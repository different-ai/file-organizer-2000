import { TFile, moment, TFolder } from "obsidian";
import FileOrganizer from "../index";
import { validateFile } from "../utils";
import { Queue } from "./services/queue";
import { RecordManager } from "./services/record-manager";
import { FileRecord, QueueStatus } from "./types";
import { logMessage } from "../someUtils";
import { IdService } from "./services/id-service";
import { logger } from "../services/logger";

const CONTENT_PREVIEW_LENGTH = 500;

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
  contentPreview?: string;
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
  private readonly MAX_CONCURRENT_TASKS: number = 100;

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
      // @ts-ignore - We know what we're doing here
      Inbox.instance = null;
    }
  }

  public enqueueFile(file: TFile): void {
    this.enqueueFiles([file]);
  }

  public enqueueFiles(files: TFile[]): void {
    logMessage(`Enqueuing ${files.length} files`);
    for (const file of files) {
      const hash = this.idService.generateFileHash(file);
      const record = this.recordManager.createOrUpdateFileRecord(file);

      this.recordManager.updateFileStatus(
        record,
        "queued",
        "File enqueued for processing"
      );

      this.queue.add(file, {
        metadata: { hash },
      });
    }
    logMessage(`Enqueued ${this.getQueueStats().queued} files`);
  }

  private initializeQueue(): void {
    this.queue = new Queue<TFile>({
      concurrency: this.MAX_CONCURRENT_TASKS,
      timeout: 30000,
      onProcess: async (file: TFile, metadata?: Record<string, any>) => {
        await this.processInboxFile(file);
      },
      onComplete: (file: TFile, metadata?: Record<string, any>) => {},
      onError: (error: Error, file: TFile, metadata?: Record<string, any>) => {
        logger.error("Queue processing error:", error);
      },
    });
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
        .then(completeProcessing);

      this.queue.remove(context.hash);
    } catch (error) {
      logger.error("Error processing inbox file:", error);
      await handleError(error, context);
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
    const text = await context.plugin.getTextFromFile(context.file);
    logger.info("Extracted text", text);
    context.content = text;
    return context;
  } catch (error) {
    context.recordManager.recordError(context.record, error);
    throw error;
  }
}

async function preprocessContentStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  if (!context.content) return context;

  // Check if content appears to be binary
  const isBinary = /[\u0000-\u0008\u000E-\u001F]/.test(
    context.content.slice(0, 1000)
  );
  if (isBinary) {
    logger.info("Binary file detected, bypassing content preprocessing");
    context.queue.bypass(context.hash);
    await moveFileToBypassedFolder(context);
    context.recordManager.recordProcessingBypassed(
      context.record,
      "Binary file detected"
    );
    throw new Error("Binary file detected");
  }

  // Create a preview of the content for initial analysis
  context.contentPreview = context.content.slice(0, CONTENT_PREVIEW_LENGTH);

  // Add ellipsis if content was truncated
  if (context.content.length > CONTENT_PREVIEW_LENGTH) {
    context.contentPreview += "...";
  }

  logger.info("Content preview generated", {
    previewLength: context.contentPreview.length,
    fullLength: context.content.length,
  });

  return context;
}

async function classifyDocument(
  context: ProcessingContext
): Promise<ProcessingContext> {
  if (!context.plugin.settings.enableDocumentClassification) return context;
  const templateNames = await context.plugin.getTemplateNames();
  const response = await fetch(
    `${context.plugin.getServerUrl()}/api/classify-v2`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${context.plugin.settings.API_KEY}`,
      },
      body: JSON.stringify({
        content: context.content,
        fileName: context.file.name,
        templateNames,
      }),
    }
  );

  if (!response.ok)
    throw new Error(`Classification failed: ${response.statusText}`);
  const result = await response.json();
  context.classification = result.classification;

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
  const folders = await context.plugin.app.vault
    .getAllLoadedFiles()
    .filter(file => file instanceof TFolder)
    .map(folder => folder.path);

  const response = await fetch(
    `${context.plugin.getServerUrl()}/api/folders/v2`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${context.plugin.settings.API_KEY}`,
      },
      body: JSON.stringify({
        content: context.content,
        fileName: context.file.name,
        folders,
        count: 1,
        customInstructions: context.plugin.settings.customFolderInstructions,
      }),
    }
  );

  if (!response.ok)
    throw new Error(`Folder suggestion failed: ${response.statusText}`);
  const result = await response.json();
  context.newPath = result.folders[0]?.folder;

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
  const response = await fetch(
    `${context.plugin.getServerUrl()}/api/title/v2`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${context.plugin.settings.API_KEY}`,
      },
      body: JSON.stringify({
        content: context.content,
        fileName: context.file.name,
        count: 1,
        customInstructions: context.plugin.settings.renameInstructions,
      }),
    }
  );

  if (!response.ok)
    throw new Error(`Title suggestion failed: ${response.statusText}`);
  const result = await response.json();
  context.newName = result.titles[0]?.title;

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
  logger.info("Formatting content step", context.classification);

  if (!context.classification || context.classification.confidence < 80) {
    return context;
  }

  try {
    const instructions = await context.plugin.getTemplateInstructions(
      context.classification.documentType
    );

    // Make sure we have content to format
    if (!context.content) {
      throw new Error("No content available for formatting");
    }

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
      // Media file processing
      // Ensure we have string content
      const contentToUse = (
        context.formattedContent ||
        context.content ||
        ""
      ).toString();

      const containerContent = [
        "---",
        `original-file: ${context.file.name}`,
        "---",
        "",
        contentToUse,
        "", // Empty line for separation
      ].join("\n");

      context.containerFile = await createFile(
        context,
        finalPath,
        containerContent
      );

      // 2. Create attachments folder
      const attachmentFolderPath = `${context.newPath}/attachments`;
      await ensureFolder(context, attachmentFolderPath);

      // 3. Move the original media file to attachments folder
      const attachmentPath = `${attachmentFolderPath}/${context.file.name}`;
      await moveFile(context, context.file, attachmentPath);
      context.attachmentFile = context.plugin.app.vault.getAbstractFileByPath(
        attachmentPath
      ) as TFile;

      // 4. Update the container file with the attachment reference
      const finalContent = [
        containerContent,
        "## Original File",
        `![[${context.attachmentFile.path}]]`,
      ].join("\n");

      await context.plugin.app.vault.modify(
        context.containerFile,
        finalContent
      );
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
      const timestamp = moment.format("YYYY-MM-DD-HHmmss");
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
