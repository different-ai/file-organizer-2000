import { TFile, moment, TFolder, Vault } from "obsidian";
import FileOrganizer from "../index";
import { Queue } from "./services/queue";
import {
  FileRecord,
  RecordManager,
  Action,
  FileStatus,
} from "./services/record-manager";
import { QueueStatus } from "./types";
import { cleanPath, logMessage } from "../someUtils";
import { IdService } from "./services/id-service";
import { logger } from "../services/logger";
import {
  initializeTokenCounter,
  getTokenCount,
  cleanup,
} from "../utils/token-counter";
import { isValidExtension, VALID_MEDIA_EXTENSIONS } from "../constants";
import { ensureFolderExists } from "../fileUtils";

// Move constants to the top level and ensure they're used consistently
const MAX_CONCURRENT_TASKS = 5;
const MAX_CONCURRENT_MEDIA_TASKS = 2;
const TOKEN_LIMIT = 50000; // 50k tokens limit for formatting

export interface FolderSuggestion {
  isNewFolder: boolean;
  score: number;
  folder: string;
  reason: string;
}

export interface LogEntry {
  id: string;
  fileName: string;
  timestamp: string;
  status: "queued" | "processing" | "completed" | "error";
  newPath?: string;
  newName?: string;
  classification?: string;
  addedTags?: string[];
  errors?: string[];
  messages: string[];
}

interface EventRecord {
  id: string;
  fileRecordId: string;
  timestamp: string;
  message: string;
  metadata?: Record<string, any>;
}

interface ProcessingContext {
  inboxFile: TFile;
  containerFile?: TFile;
  attachmentFile?: TFile;
  hash: string;
  content?: string;
  newPath?: string;
  newName?: string;
  tags?: string[];
  plugin: FileOrganizer;
  recordManager: RecordManager;
  idService: IdService;
  queue: Queue<TFile>;
  formattedContent?: string;
  classification?: {
    documentType: string;
    confidence: number;
    reasoning: string;
  };
  suggestedTags?: Array<{
    score: number;
    isNew: boolean;
    tag: string;
    reason: string;
  }>;
}

export class Inbox {
  protected static instance: Inbox;
  private plugin: FileOrganizer;
  private activeMediaTasks = 0;
  private mediaQueue: Array<TFile> = [];

  private queue: Queue<TFile>;
  private recordManager: RecordManager;
  private idService: IdService;

  private constructor(plugin: FileOrganizer) {
    this.plugin = plugin;
    this.recordManager = RecordManager.getInstance();
    this.idService = IdService.getInstance();
    this.initializeQueue();
  }

  public static initialize(plugin: FileOrganizer): Inbox {
    if (!Inbox.instance) {
      Inbox.instance = new Inbox(plugin);
    }
    return Inbox.instance;
  }

  public static getInstance(): Inbox {
    if (!Inbox.instance) {
      throw new Error("Inbox not initialized. Call initialize() first.");
    }
    return Inbox.instance;
  }

  public static cleanup(): void {
    if (Inbox.instance) {
      Inbox.instance.queue.clear();
      cleanup(); // Clean up token counter
      // @ts-ignore - We know what we're doing here
      Inbox.instance = null;
    }
  }

  public enqueueFile(file: TFile): void {
    this.enqueueFiles([file]);
  }

  public enqueueFiles(files: TFile[]): void {
    logMessage(`Enqueuing ${files.length} files`);

    // Separate media and non-media files
    const [mediaFiles, regularFiles] = files.reduce<[TFile[], TFile[]]>(
      (acc, file) => {
        if (this.plugin.shouldCreateMarkdownContainer(file)) {
          acc[0].push(file);
        } else {
          acc[1].push(file);
        }
        return acc;
      },
      [[], []]
    );

    // First enqueue regular files
    for (const file of regularFiles) {
      const hash = this.idService.generateFileHash(file);
      this.recordManager.startTracking(hash);
      this.queue.add(file, { metadata: { hash } });
    }

    // Then enqueue media files
    for (const file of mediaFiles) {
      const hash = this.idService.generateFileHash(file);
      this.recordManager.startTracking(hash);
      this.queue.add(file, { metadata: { hash } });
    }

    logMessage(
      `Enqueued ${regularFiles.length} regular files and ${mediaFiles.length} media files`
    );
  }

  private initializeQueue(): void {
    this.queue = new Queue<TFile>({
      concurrency: MAX_CONCURRENT_TASKS,
      timeout: 30000,
      onProcess: async (file: TFile, metadata?: Record<string, any>) => {
        try {
          const isMediaFile = this.plugin.shouldCreateMarkdownContainer(file);

          if (isMediaFile) {
            // Check if we can process more media files
            if (this.activeMediaTasks >= MAX_CONCURRENT_MEDIA_TASKS) {
              // Add to media queue and skip for now
              this.mediaQueue.push(file);
              if (metadata?.hash) {
                this.queue.remove(metadata.hash);
              }
              return;
            }
            this.activeMediaTasks++;
          }

          await this.processInboxFile(file, metadata?.hash);

          if (isMediaFile) {
            this.activeMediaTasks--;
            // Process next media file if available
            this.processNextMediaFile();
          }
        } finally {
          if (metadata?.hash) {
            this.queue.remove(metadata.hash);
          }
        }
      },
      onComplete: () => {},
      onError: (error: Error) => {
        logger.error("Queue processing error:", error);
      },
    });
  }

  private async processNextMediaFile(): Promise<void> {
    if (
      this.mediaQueue.length === 0 ||
      this.activeMediaTasks >= MAX_CONCURRENT_MEDIA_TASKS
    ) {
      return;
    }

    const nextFile = this.mediaQueue.shift();
    if (nextFile) {
      const hash = this.idService.generateFileHash(nextFile);
      this.queue.add(nextFile, { metadata: { hash } });
    }
  }

  public getFileStatus(filePath: string): FileRecord | undefined {
    // return this.recordManager.getRecordByPath(filePath);
    return undefined;
  }

  public getFileEvents(fileId: string): EventRecord[] {
    // return this.recordManager.getFileEvents(fileId);
    return [];
  }

  public getAllFiles(): FileRecord[] {
    return this.recordManager.getAllRecords();
  }

  public getQueueStats(): QueueStatus {
    return this.queue.getStats();
  }

  public getMediaProcessingStats(): { active: number; queued: number } {
    return {
      active: this.activeMediaTasks,
      queued: this.mediaQueue.length,
    };
  }

  public getAnalytics(): {
    byStatus: Record<FileStatus, number>;
    totalFiles: number;
    mediaStats: {
      active: number;
      queued: number;
    };
    queueStats: QueueStatus;
  } {
    const records = this.getAllFiles();
    const byStatus = records.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {} as Record<FileStatus, number>);

    return {
      byStatus,
      totalFiles: records.length,
      mediaStats: this.getMediaProcessingStats(),
      queueStats: this.getQueueStats(),
    };
  }

  // Refactored method using parallel processing where possible
  private async processInboxFile(
    inboxFile: TFile,
    hash?: string
  ): Promise<void> {
    this.recordManager.setStatus(hash, "processing");

    console.log("Processing inbox file", inboxFile);
    const context: ProcessingContext = {
      inboxFile,
      // from now on we will only work with the container file
      hash,
      plugin: this.plugin,
      recordManager: this.recordManager,
      idService: this.idService,
      queue: this.queue,
    };
    console.log("Processing inbox file", context.inboxFile.path);

    try {
      await startProcessing(context);
      await hasValidFileStep(context);
      await getContainerFileStep(context);
      await moveAttachmentFile(context);
      await getContentStep(context);
      await cleanupStep(context);
      await recommendClassificationStep(context);
      await recommendFolderStep(context);
      await recommendNameStep(context);
      await formatContentStep(context);
      await appendAttachmentStep(context);
      await recommendTagsStep(context);
      await completeProcessing(context);
    } catch (error) {
      await handleError(error, context);
      logger.error("Error processing inbox file:", error);
    }
  }
}
async function moveAttachmentFile(
  context: ProcessingContext
): Promise<ProcessingContext> {
  context.recordManager.addAction(context.hash, Action.MOVING_ATTACHEMENT);
  if (VALID_MEDIA_EXTENSIONS.includes(context.inboxFile.extension)) {
    context.attachmentFile = context.inboxFile;
    await safeMove(
      context,
      context.inboxFile,
      context.plugin.settings.attachmentsPath
    );
  }
  context.recordManager.addAction(
    context.hash,
    Action.MOVING_ATTACHEMENT,
    true
  );
  return context;
}

async function getContainerFileStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  if (VALID_MEDIA_EXTENSIONS.includes(context.inboxFile.extension)) {
    const containerFile = await context.plugin.app.vault.create(
      context.inboxFile.basename + ".md",
      ``
    );
    context.containerFile = containerFile;
  } else {
    context.containerFile = context.inboxFile;
  }
  context.recordManager.setFile(context.hash, context.containerFile);
  // return the inboxFile if it is not a media file
  return context;
}

async function hasValidFileStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  // check if file is supported if not bypass
  if (!isValidExtension(context.inboxFile.extension)) {
    await handleBypass(context, "Unsupported file type");
    throw new Error("Unsupported file type");
  }
  return context;
}

async function recommendNameStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  const newName = await context.plugin.recommendName(
    context.content,
    context.inboxFile.basename
  );
  context.newName = newName[0]?.title;
  // if new name is the same as the old name then don't rename
  if (context.newName === context.inboxFile.basename) {
    return context;
  }
  context.recordManager.setNewName(context.hash, context.newName);
  context.recordManager.addAction(context.hash, Action.RENAME);
  await safeRename(context, context.containerFile, context.newName);
  context.recordManager.addAction(context.hash, Action.RENAME, true);
  return context;
}

async function recommendFolderStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  const newPath = await context.plugin.recommendFolders(
    context.content,
    context.inboxFile.basename
  );

  context.newPath = newPath[0]?.folder;
  console.log("new path", context.newPath, context.containerFile);
  context.recordManager.addAction(context.hash, Action.MOVING);
  await safeMove(context, context.containerFile, context.newPath);
  context.recordManager.addAction(context.hash, Action.MOVING, true);
  console.log("moved file to", context.containerFile);

  return context;
}

async function recommendClassificationStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  if (context.plugin.settings.enableDocumentClassification) {
    const templateNames = await context.plugin.getTemplateNames();

    context.recordManager.addAction(context.hash, Action.CLASSIFY);
    const result = await context.plugin.classifyContentV2(
      context.content,
      templateNames
    );
    context.plugin.appendTag(context.containerFile, result);
    context.classification = {
      documentType: result,
      confidence: 100,
      reasoning: "N/A",
    };
    context.recordManager.addAction(context.hash, Action.CLASSIFY, true);
    context.recordManager.setClassification(context.hash, result);
  }
  return context;
}

// Pipeline processing steps

async function startProcessing(
  context: ProcessingContext
): Promise<ProcessingContext> {
  console.log("startProcessing", context);
  return context;
}

async function getContentStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  const fileToRead = context.inboxFile;
  context.recordManager.addAction(context.hash, Action.EXTRACT);
  const content = await context.plugin.getTextFromFile(fileToRead);
  context.content = content;
  console.log("content", content);
  console.log("containerFile", context.containerFile);
  await context.plugin.app.vault.modify(context.containerFile, content);
  context.recordManager.addAction(context.hash, Action.EXTRACT, true);
  return context;
}

async function cleanupStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  try {
    // Early return if no content
    if (!context.content) {
      await handleBypass(context, "No content available");
    }

    // Strip front matter and trim
    const contentWithoutFrontMatter = context.content
      .replace(/^---\n[\s\S]*?\n---\n/, "")
      .trim();

    // Bypass if content is too short
    if (contentWithoutFrontMatter.length < 5) {
      await handleBypass(context, "Content too short (less than 5 characters)");
    }

    // Set the cleaned content back
    context.content = contentWithoutFrontMatter;
    return context;
  } catch (error) {
    logger.error("Error in preprocessContentStep:", error);
    throw error;
  }
}

// New helper function to handle bypassing
async function handleBypass(
  context: ProcessingContext,
  reason: string
): Promise<void> {
  try {
    // First mark as bypassed in the record manager

    // Then move the file
    const bypassedFolderPath = context.plugin.settings.bypassedFilePath;
    await safeMove(context, context.inboxFile, bypassedFolderPath);

    context.queue.bypass(context.hash);
    context.recordManager.setStatus(context.hash, "bypassed");
    throw new Error("Bypassed due to " + reason);
  } catch (error) {
    logger.error("Error in handleBypass:", error);
    throw error;
  }
}

async function formatContentStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  if (!context.classification) {
    logger.info("Skipping formatting: no classification available");
    return context;
  }
  // Early return if no classification
  if (!context.classification.documentType) {
    logger.info("Skipping formatting: no classification available");
    return context;
  }

  // Early return if classification confidence is too low
  if (context.classification.confidence < 80) {
    logger.info("Skipping formatting: classification confidence too low", {
      confidence: context.classification.confidence,
    });
    return context;
  }

  // Early return if no content
  if (!context.content) {
    logger.info("Skipping formatting: no content available");
    return context;
  }

  logger.info("Formatting content step", context.classification);
  context.recordManager.addAction(context.hash, Action.FORMATTING);

  // get token amount from token counter
  await initializeTokenCounter();
  const tokenAmount = getTokenCount(context.content);
  cleanup();
  if (tokenAmount > context.plugin.settings.maxFormattingTokens) {
    logger.info("Skipping formatting: content too large", {
      tokenAmount,
      maxFormattingTokens: context.plugin.settings.maxFormattingTokens,
    });
    return context;
  }

  try {
    const instructions = await context.plugin.getTemplateInstructions(
      context.classification.documentType
    );

    if (!instructions) {
      logger.info("Skipping formatting: no instructions available");
      return context;
    }

    const formattedContent = await context.plugin.formatContentV2(
      context.content,
      instructions
    );
    context.formattedContent = formattedContent;

    const referenceFile = await safeCopy(
      context,
      context.containerFile,
      context.plugin.settings.referencePath
    );

    await context.plugin.app.vault.modify(
      context.containerFile,
      formattedContent
    );

    const markdownLink = context.plugin.app.fileManager.generateMarkdownLink(
      referenceFile,
      context.containerFile.parent.path
    );
    await context.plugin.app.vault.append(
      context.containerFile,
      `\n\n---\n\This file is formatted and the original file is: ${markdownLink}\n\n---\n\n`
    );

    context.recordManager.addAction(context.hash, Action.FORMATTING, true);
    return context;
  } catch (error) {
    logger.error("Error in formatContentStep:", error);
    throw error;
  }
}
async function recommendTagsStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  context.recordManager.addAction(context.hash, Action.TAGGING);
  const existingTags = await context.plugin.getAllVaultTags();
  const tags = await context.plugin.recommendTags(
    context.content,
    context.containerFile.path,
    existingTags
  );
  context.tags = tags?.map(t => t.tag);
  // for each tag, append it to the file
  for (const tag of context.tags) {
    await context.plugin.appendTag(context.containerFile, tag);
  }
  context.recordManager.addAction(context.hash, Action.TAGGING, true);
  context.recordManager.setTags(context.hash, context.tags);
  return context;
}
async function appendAttachmentStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  if (context.attachmentFile) {
    context.plugin.app.vault.append(
      context.containerFile,
      `\n\n![[${context.attachmentFile.name}]]`
    );
  }
  return context;
}

async function completeProcessing(
  context: ProcessingContext
): Promise<ProcessingContext> {
  context.recordManager.addAction(context.hash, Action.COMPLETED, true);
  context.recordManager.setStatus(context.hash, "completed");
  return context;
}

// Error handling

async function handleError(
  error: any,
  context: ProcessingContext
): Promise<void> {
  console.log("handleError", error);
  context.recordManager.setStatus(context.hash, "error");

  await moveFileToErrorFolder(context);
}

// moveToBackupFolder
async function moveToBackupFolder(context: ProcessingContext): Promise<void> {
  const backupFolderPath = context.plugin.settings.backupFolderPath;
  await safeMove(context, context.inboxFile, backupFolderPath);
}

// Helper functions for file operations
async function moveFileToErrorFolder(
  context: ProcessingContext
): Promise<void> {
  const errorFolderPath = context.plugin.settings.errorFilePath;
  await safeMove(context, context.inboxFile, errorFolderPath);
}

async function getAvailablePath(
  desiredPath: string,
  vault: Vault
): Promise<string> {
  let available = desiredPath;
  let increment = 0;

  // Split path into directory and filename
  const lastDotIndex = desiredPath.lastIndexOf(".");
  const lastSlashIndex = desiredPath.lastIndexOf("/");
  const dir = desiredPath.substring(0, lastSlashIndex);
  const nameWithoutExt = desiredPath.substring(
    lastSlashIndex + 1,
    lastDotIndex
  );
  const ext = desiredPath.substring(lastDotIndex);

  // Keep incrementing until we find an available path
  while (await vault.adapter.exists(available)) {
    increment++;
    available = `${dir}/${nameWithoutExt} ${increment}${ext}`;
  }

  return available;
}

async function safeRename(
  context: ProcessingContext,
  file: TFile,
  desiredNewName: string
): Promise<void> {
  const parentPath = file.parent.path;
  const extension = file.extension;
  const desiredPath = `${parentPath}/${desiredNewName}.${extension}`;
  const availablePath = await getAvailablePath(
    desiredPath,
    context.plugin.app.vault
  );
  await context.plugin.app.fileManager.renameFile(file, availablePath);
}
async function safeCopy(
  context: ProcessingContext,
  file: TFile,
  desiredFolderPath: string
): Promise<TFile> {
  await ensureFolderExists(context.plugin.app, desiredFolderPath);
  const availablePath = await getAvailablePath(
    `${desiredFolderPath}/${file.name}`,
    context.plugin.app.vault
  );
  const copiedFile = await context.plugin.app.vault.copy(file, availablePath);
  return copiedFile;
}

async function safeMove(
  context: ProcessingContext,
  file: TFile,
  desiredFolderPath: string
): Promise<void> {
  await ensureFolderExists(context.plugin.app, desiredFolderPath);
  const availablePath = await getAvailablePath(
    `${desiredFolderPath}/${file.name}`,
    context.plugin.app.vault
  );
  await context.plugin.app.fileManager.renameFile(file, availablePath);
}

// Helper functions for initialization and usage
export function initializeInboxQueue(plugin: FileOrganizer): void {
  Inbox.cleanup();
  Inbox.initialize(plugin);
}

export function enqueueFiles(files: TFile[]): void {
  Inbox.getInstance().enqueueFiles(files);
}

export function getInboxStatus(): QueueStatus {
  return Inbox.getInstance().getQueueStats();
}
