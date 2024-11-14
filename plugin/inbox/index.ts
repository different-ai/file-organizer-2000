import { TFile, moment, TFolder } from "obsidian";
import FileOrganizer from "../index";
import { validateFile } from "../utils";
import { Queue } from "./services/queue";
import { RecordManager } from "./services/record-manager";
import { FileRecord, QueueStatus } from "./types";
import { logMessage } from "../someUtils";
import { IdService } from "./services/id-service";
import { logger } from "../services/logger";
import {
  initializeTokenCounter,
  getTokenCount,
  cleanup,
} from "../utils/token-counter";
import { isValidExtension, VALID_MEDIA_EXTENSIONS } from "../constants";
import { record } from "zod";

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
  record: FileRecord;
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
      this.queue.add(file, { metadata: { hash } });
    }

    // Then enqueue media files
    for (const file of mediaFiles) {
      const hash = this.idService.generateFileHash(file);
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

          await this.processInboxFile(file);

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
  }

  public getFileEvents(fileId: string): EventRecord[] {
    // return this.recordManager.getFileEvents(fileId);
    return [];
  }

  public getAllFiles(): FileRecord[] {
    return [];
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

  // Refactored method using parallel processing where possible
  private async processInboxFile(inboxFile: TFile): Promise<void> {
    const hash = this.idService.generateFileHash(inboxFile);
    // const record = this.recordManager.getRecordByHash(hash);
    // if (!record) return;

    console.log("Processing inbox file", inboxFile);
    const context: ProcessingContext = {
      inboxFile,
      // from now on we will only work with the container file
      hash,
      // record,
      plugin: this.plugin,
      recordManager: this.recordManager,
      idService: this.idService,
      queue: this.queue,
    };
    console.log("Processing inbox file", context.inboxFile.path);

    try {
      await startProcessing(context)
        .then(hasValidFileStep)
        .then(getContainerFileStep)
        .then(moveAttachmentFile)
        .then(getContentStep)
        .then(preprocessContentStep)
        .then(recommendTagsStep)
        .then(recommendClassificationStep)
        .then(recommendFolderStep)
        .then(recommendNameStep)
        .then(formatContentStep)
        .then(completeProcessing)
        .catch(async error => {
          await handleError(error, context);
          throw error;
        });
    } catch (error) {
      logger.error("Error processing inbox file:", error);
    }
  }
}
async function moveAttachmentFile(
  context: ProcessingContext
): Promise<ProcessingContext> {
  if (VALID_MEDIA_EXTENSIONS.includes(context.inboxFile.extension)) {
    await moveFile(
      context,
      context.inboxFile,
      context.plugin.settings.attachmentsPath
    );
  }
  return context;
}

async function getContainerFileStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  if (VALID_MEDIA_EXTENSIONS.includes(context.inboxFile.extension)) {
    await this.plugin.app.vault.create(
      context.inboxFile.name,
      `![[${context.inboxFile.name}]]`
    );
    return context;
  }
  // return the inboxFile if it is not a media file
  return context;
}

async function hasValidFileStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  console.log("hasValidFileStep", context.containerFile.extension);
  // check if file is supported if not bypass
  if (!isValidExtension(context.containerFile.extension)) {
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
    context.inboxFile.path
  );
  context.newName = newName[0]?.title;
  moveFile(context, context.inboxFile, context.newPath);
  return context;
}

async function recommendFolderStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  const newPath = await context.plugin.recommendFolders(
    context.content,
    context.inboxFile.path
  );
  context.newPath = newPath[0]?.folder;
  moveFile(context, context.inboxFile, context.newPath);

  return context;
}

async function recommendClassificationStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  if (!context.plugin.settings.enableDocumentClassification) {
    const templateNames = await context.plugin.getTemplateNames();
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
  }
  return context;
}

// Pipeline processing steps

async function startProcessing(
  context: ProcessingContext
): Promise<ProcessingContext> {
  return context;
}

async function getContentStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  try {
    const content = await context.plugin.getTextFromFile(context.containerFile);
    context.content = content;
    return context;
  } catch (error) {
    logger.error("Error in extractTextStep:", error);
    throw error;
  }
}

async function preprocessContentStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  try {
    // Early return if no content
    if (!context.content) {
      await handleBypass(context, "No content available");
      throw new Error("No content available");
    }

    // Strip front matter and trim
    const contentWithoutFrontMatter = context.content
      .replace(/^---\n[\s\S]*?\n---\n/, "")
      .trim();

    // Bypass if content is too short
    if (contentWithoutFrontMatter.length < 5) {
      await handleBypass(context, "Content too short (less than 5 characters)");
      throw new Error("Content too short");
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
    await ensureFolder(context, bypassedFolderPath);
    const newPath = `${bypassedFolderPath}/${context.file.name}`;

    // Move file using the vault API
    await context.plugin.app.vault.rename(context.file, newPath);

    // Finally, bypass in the queue
    context.queue.bypass(context.hash);
  } catch (error) {
    logger.error("Error in handleBypass:", error);
    throw error;
  }
}

async function classifyDocument(
  context: ProcessingContext
): Promise<ProcessingContext> {
  if (!context.plugin.settings.enableDocumentClassification) return context;
  const templateNames = await context.plugin.getTemplateNames();
  const result = await context.plugin.classifyContentV2(
    context.content,
    templateNames
  );
  context.classification = {
    documentType: result,
    confidence: 100,
    reasoning: "N/A",
  };

  return context;
}

async function formatContentStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
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
    context.plugin.app.vault.modify(context.containerFile, formattedContent);

    return context;
  } catch (error) {
    logger.error("Error in formatContentStep:", error);
    throw error;
  }
}
async function recommendTagsStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  const existingTags = await context.plugin.getAllVaultTags();
  const tags = await context.plugin.recommendTags(
    context.content,
    context.inboxFile.path,
    existingTags
  );
  context.tags = tags?.map(t => t.tag);
  // for each tag, append it to the file
  for (const tag of context.tags) {
    await context.plugin.appendTag(context.containerFile, tag);
  }
  return context;
}

async function completeProcessing(
  context: ProcessingContext
): Promise<ProcessingContext> {
  return context;
}

// Error handling

async function handleError(
  error: any,
  context: ProcessingContext
): Promise<void> {
  await moveFileToErrorFolder(context);
}

// Helper functions for file operations

async function moveFileToBypassedFolder(
  context: ProcessingContext
): Promise<void> {
  const bypassedFolderPath = context.plugin.settings.bypassedFilePath;
  const newPath = `${bypassedFolderPath}/${context.inboxFile.name}`;
  await moveFile(context, context.inboxFile, newPath);
}

async function moveFileToErrorFolder(
  context: ProcessingContext
): Promise<void> {
  const errorFolderPath = context.plugin.settings.errorFilePath;
  const newPath = `${errorFolderPath}/${context.inboxFile.name}`;
  await moveFile(context, context.inboxFile, newPath);
}

async function moveFile(
  context: ProcessingContext,
  file: TFile,
  newPath: string
): Promise<void> {
  try {
    await ensureFolder(context, newPath);

    const exists = await context.plugin.app.vault.adapter.exists(newPath);
    if (exists) {
      const timestamp = moment().format("YYYY-MM-DD-HHmmss");
      const parts = newPath.split(".");
      const ext = parts.pop();
      newPath = `${parts.join(".")}-${timestamp}.${ext}`;
    }

    await context.plugin.app.vault.rename(file, newPath);
  } catch (error) {
    logger.error(`Failed to move file ${file.path} to ${newPath}:`, error);
    throw new Error(`Failed to move file: ${error.message}`);
  }
}

async function ensureFolder(
  context: ProcessingContext,
  path: string
): Promise<void> {
  const folderPath = path.split("/").slice(0, -1).join("/");
  try {
    await context.plugin.app.vault.createFolder(folderPath);
  } catch (error) {
    if (!error.message.includes("already exists")) {
      logger.error("Error creating folder:", error);
      throw error;
    }
  }
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
