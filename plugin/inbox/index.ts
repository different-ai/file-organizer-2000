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
  file: TFile;
  hash: string;
  record: FileRecord;
  content?: string;
  newPath?: string;
  newName?: string;
  tags?: string[];
  containerFile?: TFile;
  attachmentFile?: TFile;
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
  private activeMediaTasks: number = 0;
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
      const record = this.recordManager.createOrUpdateFileRecord(file);
      this.recordManager.updateFileStatus(
        record,
        "queued",
        "File enqueued for processing"
      );
      this.queue.add(file, { metadata: { hash } });
    }

    // Then enqueue media files
    for (const file of mediaFiles) {
      const hash = this.idService.generateFileHash(file);
      const record = this.recordManager.createOrUpdateFileRecord(file);
      this.recordManager.updateFileStatus(
        record,
        "queued",
        "Media file enqueued for processing"
      );
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
    return this.recordManager.getRecordByPath(filePath);
  }

  public getFileEvents(fileId: string): EventRecord[] {
    return this.recordManager.getFileEvents(fileId);
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

  // Refactored method using a pipeline-style processing
  private async processInboxFile(file: TFile): Promise<void> {
    const hash = this.idService.generateFileHash(file);
    const record = this.recordManager.getRecordByHash(hash);
    if (!record) return;

    const context: ProcessingContext = {
      file,
      hash,
      record,
      plugin: this.plugin,
      recordManager: this.recordManager,
      idService: this.idService,
      queue: this.queue,
    };

    try {
      await startProcessing(context)
        .then(validateFileStep)
        .then(extractTextStep)
        .then(preprocessContentStep)
        .then(classifyDocument)
        .then(suggestTags)
        .then(suggestFolder)
        .then(suggestTitle)
        .then(processFileStep)
        .then(formatContentStep)
        .then(completeProcessing)
        .catch(async (error) => {
          // Only handle as error if it's not a bypass
          if (!error.message.includes("No content") && 
              !error.message.includes("Content too short")) {
            await handleError(error, context);
          }
          // Always rethrow to stop processing
          throw error;
        });
    } catch (error) {
      // Log but don't handle again
      logger.error("Error processing inbox file:", error);
    }
  }
}

// Pipeline processing steps

async function startProcessing(
  context: ProcessingContext
): Promise<ProcessingContext> {
  context.recordManager.updateFileStatus(
    context.record,
    "processing",
    "Started processing file"
  );
  return context;
}

async function validateFileStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  if (!validateFile(context.file)) {
    context.queue.bypass(context.hash);
    await moveFileToBypassedFolder(context);
    context.recordManager.recordProcessingBypassed(
      context.record,
      "File validation failed"
    );
    throw new Error("File validation failed");
  }
  return context;
}

async function extractTextStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  try {
    if (context.plugin.shouldCreateMarkdownContainer(context.file)) {
      // Handle image/media files
      const content = await context.plugin.generateImageAnnotation(
        context.file
      );
      logger.info("Extracted text from image/media", content);
      context.content = content;
    } else {
      // Handle regular text files
      const text = await context.plugin.getTextFromFile(context.file);
      logger.info("Extracted text from file", text);
      context.content = text;
    }
    return context;
  } catch (error) {
    logger.error("Error in extractTextStep:", error);
    context.recordManager.recordError(context.record, error);
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
    context.recordManager.recordProcessingBypassed(context.record, reason);

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

  if (context.classification) {
    context.recordManager.recordClassification(
      context.record,
      context.classification
    );
    // Start formatting content early if we have classification
    if (context.classification.confidence >= 80) {
      await formatContentStep(context);
    }
  }

  return context;
}

async function suggestFolder(
  context: ProcessingContext
): Promise<ProcessingContext> {
  const recommendedFolders = await context.plugin.recommendFolders(
    context.content,
    context.file.name
  );

  context.newPath = recommendedFolders[0]?.folder;

  if (context.newPath) {
    // Create folder structure immediately
    await ensureFolder(context, context.newPath);

    // Move file to new folder immediately, keeping original filename for now
    const newFilePath = `${context.newPath}/${context.file.name}`;
    await moveFile(context, context.file, newFilePath);

    // Update record
    context.recordManager.recordMove(
      context.record,
      context.file.path,
      context.newPath
    );
  }

  return context;
}

async function suggestTitle(
  context: ProcessingContext
): Promise<ProcessingContext> {
  const result = await context.plugin.recommendName(
    context.content,
    context.file.name
  );
  context.newName = result[0]?.title;

  if (context.newName) {
    context.recordManager.recordRename(
      context.record,
      context.file.basename,
      context.newName
    );
  }

  return context;
}

async function formatContentStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  // Early return if no classification or low confidence
  if (!context.classification || context.classification.confidence < 80) {
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
    // Make sure we have content to format
    if (!context.content) {
      throw new Error("No content available for formatting");
    }

    // Initialize token counter if needed
    await initializeTokenCounter();

    // Check token count
    const tokenCount = getTokenCount(context.content);
    if (tokenCount > TOKEN_LIMIT) {
      logger.info(
        `Skipping formatting: content too large (${tokenCount} tokens)`
      );
      context.recordManager.recordProcessingBypassed(
        context.record,
        `Content too large for formatting (${tokenCount} tokens)`
      );
      return context;
    }

    const instructions = await context.plugin.getTemplateInstructions(
      context.classification.documentType
    );

    // Call the new v2 endpoint
    const response = await fetch(
      `${context.plugin.getServerUrl()}/api/format/v2`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${context.plugin.settings.API_KEY}`,
        },
        body: JSON.stringify({
          content: context.content,
          formattingInstruction: instructions,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Format failed: ${response.statusText}`);
    }

    const result = await response.json();
    context.formattedContent = result.content;

    return context;
  } catch (error) {
    logger.error("Error in formatContentStep:", error);
    context.recordManager.recordError(context.record, error);
    throw error;
  }
}

async function processFileStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  try {
    const isMediaFile = context.plugin.shouldCreateMarkdownContainer(
      context.file
    );
    const finalPath = `${context.newPath}/${context.newName}.md`;

    if (isMediaFile) {
      // Add error handling for media files
      try {
        // Ensure we have string content
        const contentToUse = (
          context.formattedContent ||
          context.content ||
          "No content extracted"
        ).toString();

        // Add front matter with metadata
        const containerContent = [
          "---",
          `original-file: ${context.file.name}`,
          `processed-date: ${moment().format("YYYY-MM-DD HH:mm:ss")}`,
          `file-type: ${context.file.extension}`,
          "---",
          "",
          contentToUse,
          "", // Empty line for separation
        ].join("\n");

        // Create container file with better error handling
        context.containerFile = await createFile(
          context,
          finalPath,
          containerContent
        ).catch(error => {
          logger.error("Failed to create container file:", error);
          throw error;
        });

        // Create attachments folder with better path handling
        const attachmentFolderPath = `${context.newPath}/attachments`;
        await ensureFolder(context, attachmentFolderPath);

        // Move the original media file with better error handling
        const attachmentPath = `${attachmentFolderPath}/${context.file.name}`;
        await moveFile(context, context.file, attachmentPath);

        context.attachmentFile = context.plugin.app.vault.getAbstractFileByPath(
          attachmentPath
        ) as TFile;

        if (!context.attachmentFile) {
          throw new Error("Failed to locate moved attachment file");
        }

        // Update container with attachment reference
        const finalContent = [
          containerContent,
          "## Original File",
          `![[${context.attachmentFile.path}]]`,
        ].join("\n");

        await context.plugin.app.vault.modify(
          context.containerFile,
          finalContent
        );
      } catch (mediaError) {
        logger.error("Media processing error:", mediaError);
        context.recordManager.recordError(context.record, mediaError);
        throw mediaError;
      }
    } else {
      // Regular file processing
      if (context.formattedContent) {
        // Ensure we're writing a string
        const contentToWrite = context.formattedContent.toString();
        await context.plugin.app.vault.modify(context.file, contentToWrite);
      }

      if (context.newName !== context.file.basename) {
        await moveFile(context, context.file, finalPath);
      }
    }

    // Record metadata updates
    if (context.classification) {
      context.recordManager.recordClassification(
        context.record,
        context.classification
      );
    }

    if (context.tags?.length) {
      context.recordManager.recordTags(context.record, context.tags);
    }

    if (context.newName !== context.file.basename) {
      context.recordManager.recordRename(
        context.record,
        context.file.basename,
        context.newName!
      );
    }

    return context;
  } catch (error) {
    logger.error("Error in processFileStep:", error);
    context.recordManager.recordError(context.record, error);
    throw error;
  }
}

async function completeProcessing(
  context: ProcessingContext
): Promise<ProcessingContext> {
  context.recordManager.recordProcessingComplete(context.record, {
    newPath: context.newPath!,
    newName: context.newName!,
    tags: context.tags,
  });
  return context;
}

// Error handling

async function handleError(
  error: any,
  context: ProcessingContext
): Promise<void> {
  context.recordManager.recordError(context.record, error);
  await moveFileToErrorFolder(context);
  context.recordManager.updateFileStatus(
    context.record,
    "error",
    `Processing error: ${error.message}`,
    {
      errorDetails: {
        message: error.message,
        stack: error.stack,
        fileName: context.file.name,
        newLocation: context.plugin.settings.errorFilePath,
      },
    }
  );
}

// Helper functions for file operations

async function moveFileToBypassedFolder(
  context: ProcessingContext
): Promise<void> {
  const bypassedFolderPath = context.plugin.settings.bypassedFilePath;
  const newPath = `${bypassedFolderPath}/${context.file.name}`;
  await moveFile(context, context.file, newPath);
}

async function moveFileToErrorFolder(
  context: ProcessingContext
): Promise<void> {
  const errorFolderPath = context.plugin.settings.errorFilePath;
  const newPath = `${errorFolderPath}/${context.file.name}`;
  await moveFile(context, context.file, newPath);
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

async function createFile(
  context: ProcessingContext,
  path: string,
  content: string
): Promise<TFile> {
  try {
    await ensureFolder(context, path);
    return await context.plugin.app.vault.create(path, content);
  } catch (error) {
    logger.error(`Failed to create file at ${path}:`, error);
    throw new Error(`Failed to create file: ${error.message}`);
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

async function suggestTags(
  context: ProcessingContext
): Promise<ProcessingContext> {
  const existingTags = await context.plugin.getAllVaultTags();
  const response = await fetch(`${context.plugin.getServerUrl()}/api/tags/v2`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${context.plugin.settings.API_KEY}`,
    },
    body: JSON.stringify({
      content: context.content,
      fileName: context.file.name,
      existingTags,
      count: 5,
    }),
  });

  if (!response.ok)
    throw new Error(`Tag suggestion failed: ${response.statusText}`);
  const result = await response.json();

  // Filter tags by confidence threshold (e.g., 70)
  context.suggestedTags = result.tags.filter(t => t.score >= 70);
  context.tags = context.suggestedTags.map(t => t.tag);

  // Apply tags immediately if we have suggestions
  if (context.tags?.length) {
    for (const tag of context.tags) {
      await context.plugin.appendTag(context.file, tag);
    }
    context.recordManager.recordTags(context.record, context.tags);
  }

  return context;
}

