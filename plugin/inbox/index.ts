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
import { logMessage } from "../someUtils";
import { IdService } from "./services/id-service";
import { logger } from "../services/logger";
import {
  initializeTokenCounter,
  getTokenCount,
  cleanup,
} from "../utils/token-counter";
import { isValidExtension, VALID_MEDIA_EXTENSIONS } from "../constants";
import {
  safeCreate,
  safeRename,
  safeCopy,
  safeMove,
  safeModifyContent as safeModify,
} from "../fileUtils";

// Move constants to the top level and ensure they're used consistently
const MAX_CONCURRENT_TASKS = 5;
const MAX_CONCURRENT_MEDIA_TASKS = 2;

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

interface StepValidation {
  isValid: boolean;
  reason?: string;
}

function validateContext(
  context: ProcessingContext,
  requiredFields: (keyof ProcessingContext)[]
): StepValidation {
  for (const field of requiredFields) {
    if (!context[field]) {
      return {
        isValid: false,
        reason: `Missing required field: ${field}`,
      };
    }
  }
  return { isValid: true };
}

function assertInvariant(condition: boolean, message: string) {
  if (!condition) {
    logger.error(`Invariant violation: ${message}`);
    throw new Error(`Invariant violation: ${message}`);
  }
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
    console.log("initializing inbox", plugin.settings, plugin.app);
    this.recordManager = RecordManager.getInstance(plugin.app, plugin.settings);
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
      this.recordManager.startTracking(hash, file.basename);
      this.queue.add(file, { metadata: { hash } });
    }

    // Then enqueue media files
    for (const file of mediaFiles) {
      const hash = this.idService.generateFileHash(file);
      this.recordManager.startTracking(hash, file.basename);
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

    const context: ProcessingContext = {
      inboxFile,
      hash,
      plugin: this.plugin,
      recordManager: this.recordManager,
      idService: this.idService,
      queue: this.queue,
    };

    try {
      await executeStep(
        context,
        startProcessing,
        Action.CLEANUP,
        Action.ERROR_CLEANUP
      );
      await executeStep(
        context,
        hasValidFileStep,
        Action.VALIDATE,
        Action.ERROR_VALIDATE
      );
      await executeStep(
        context,
        getContainerFileStep,
        Action.CONTAINER,
        Action.ERROR_CONTAINER
      );
      await executeStep(
        context,
        moveAttachmentFile,
        Action.MOVING_ATTACHMENT,
        Action.ERROR_MOVING_ATTACHMENT
      );
      await executeStep(
        context,
        getContentStep,
        Action.EXTRACT,
        Action.ERROR_EXTRACT
      );
      await executeStep(
        context,
        cleanupStep,
        Action.CLEANUP,
        Action.ERROR_CLEANUP
      );
      await executeStep(
        context,
        recommendClassificationStep,
        Action.CLASSIFY,
        Action.ERROR_CLASSIFY
      );
      await executeStep(
        context,
        recommendFolderStep,
        Action.MOVING,
        Action.ERROR_MOVING
      );
      await executeStep(
        context,
        recommendNameStep,
        Action.RENAME,
        Action.ERROR_RENAME
      );
      await executeStep(
        context,
        formatContentStep,
        Action.FORMATTING,
        Action.ERROR_FORMATTING
      );
      await executeStep(
        context,
        appendAttachmentStep,
        Action.APPEND,
        Action.ERROR_APPEND
      );
      await executeStep(
        context,
        recommendTagsStep,
        Action.TAGGING,
        Action.ERROR_TAGGING
      );
      await executeStep(
        context,
        completeProcessing,
        Action.COMPLETED,
        Action.ERROR_COMPLETE
      );
    } catch (error) {
      await handleError(error, context);
      logger.error("Error processing inbox file:", error);
    }
  }
}
async function moveAttachmentFile(
  context: ProcessingContext
): Promise<ProcessingContext> {
  if (VALID_MEDIA_EXTENSIONS.includes(context.inboxFile.extension)) {
    context.attachmentFile = context.inboxFile;
    await safeMove(
      context.plugin.app,
      context.inboxFile,
      context.plugin.settings.attachmentsPath
    );
  }
  return context;
}

async function getContainerFileStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  logger.info("Get container file step");
  if (VALID_MEDIA_EXTENSIONS.includes(context.inboxFile?.extension)) {
    const containerFile = await safeCreate(
      context.plugin.app,
      context.inboxFile.basename + ".md",
      ""
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
  // check if file is valid
  logger.info("Has valid file step");
  // check if file is supported if not bypass
  if (!isValidExtension(context.inboxFile?.extension)) {
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
    context.containerFile.basename
  );
  context.newName = newName[0]?.title;
  // if new name is the same as the old name then don't rename
  if (context.newName === context.containerFile.basename) {
    return context;
  }
  context.recordManager.setNewName(context.hash, context.newName);
  await safeRename(context.plugin.app, context.containerFile, context.newName);
  return context;
}

async function recommendFolderStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  assertInvariant(
    !!context.content,
    "Content must be available before folder recommendation"
  );
  assertInvariant(
    !!context.containerFile,
    "Container file must exist before moving"
  );

  const newPath = await context.plugin.recommendFolders(
    context.content,
    context.inboxFile.basename
  );

  assertInvariant(
    !!newPath?.[0]?.folder,
    "Folder recommendation must return a valid path"
  );

  context.newPath = newPath[0]?.folder;
  console.log("new path", context.newPath, context.containerFile);
  await safeMove(context.plugin.app, context.containerFile, context.newPath);
  console.log("moved file to", context.containerFile);

  return context;
}

async function recommendClassificationStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  // Validate required context
  const validation = validateContext(context, ["content", "containerFile"]);
  if (!validation.isValid) {
    throw new Error(
      `Classification step validation failed: ${validation.reason}`
    );
  }

  if (context.plugin.settings.enableDocumentClassification) {
    const templateNames = await context.plugin.getTemplateNames();
    const result = await context.plugin.classifyContentV2(
      `${context.content}, ${context.containerFile.name}`,
      templateNames
    );
    logger.info("Classification result", result);
    if (!result) return context;
    await context.plugin.appendTag(context.containerFile, result);
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
  console.log("startProcessing", context);
  return context;
}

async function getContentStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  const fileToRead = context.inboxFile;
  const content = await context.plugin.getTextFromFile(fileToRead);
  context.content = content;
  await context.plugin.app.vault.modify(context.containerFile, content);
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
    logger.info("Bypassing file", context.inboxFile);
    // First mark as bypassed in the record manager

    // Then move the file
    const bypassedFolderPath = context.plugin.settings.bypassedFilePath;
    await safeMove(context.plugin.app, context.inboxFile, bypassedFolderPath);

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
      context.plugin.app,
      context.containerFile,
      context.plugin.settings.referencePath
    );

    await safeModify(
      context.plugin.app,
      context.containerFile,
      formattedContent
    );

    const markdownLink = context.plugin.app.fileManager.generateMarkdownLink(
      referenceFile,
      context.containerFile.parent.path
    );
    await context.plugin.app.vault.append(
      context.containerFile,
      `\n\n---\nThis file is formatted and the original file is: ${markdownLink}\n\n---\n\n`
    );

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
    context.containerFile.path,
    existingTags
  );
  context.tags = tags?.map(t => t.tag);
  // for each tag, append it to the file
  for (const tag of context.tags) {
    await context.plugin.appendTag(context.containerFile, tag);
  }
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
  context.recordManager.setStatus(context.hash, "completed");
  return context;
}

// Error handling

async function handleError(
  error: any,
  context: ProcessingContext
): Promise<void> {
  const lastError = context.recordManager.getLastError(context.hash);

  logger.error(`Error in step ${lastError?.action}:`, {
    error: error.message,
    step: lastError?.action,
    file: context.inboxFile.path,
  });

  context.recordManager.setStatus(context.hash, "error");

  // Different handling based on error type
  switch (lastError?.action) {
    case Action.ERROR_MOVING_ATTACHMENT:
    case Action.ERROR_MOVING:
      // Handle file system errors
      await moveFileToErrorFolder(context);
      break;
    case Action.ERROR_CLASSIFY:
    case Action.ERROR_TAGGING:
      // Handle AI-related errors
      await moveToBackupFolder(context);
      break;
    default:
      // Default error handling
      await moveFileToErrorFolder(context);
  }
}

// moveToBackupFolder
async function moveToBackupFolder(context: ProcessingContext): Promise<void> {
  await safeMove(
    context.plugin.app,
    context.inboxFile,
    context.plugin.settings.backupFolderPath
  );
}

// Helper functions for file operations
async function moveFileToErrorFolder(
  context: ProcessingContext
): Promise<void> {
  await safeMove(
    context.plugin.app,
    context.inboxFile,
    context.plugin.settings.errorFilePath
  );
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

async function executeStep(
  context: ProcessingContext,
  step: (context: ProcessingContext) => Promise<ProcessingContext>,
  action: Action,
  errorAction: Action
): Promise<ProcessingContext> {
  try {
    context.recordManager.addAction(context.hash, action);
    const result = await step(context);
    context.recordManager.addAction(context.hash, action, true);
    return result;
  } catch (error) {
    // Log the error with the specific action that failed
    context.recordManager.addAction(context.hash, errorAction);
    context.recordManager.addError(context.hash, {
      action: errorAction,
      message: error.message,
      stack: error.stack,
    });
    throw error; // Re-throw to stop pipeline
  }
}
