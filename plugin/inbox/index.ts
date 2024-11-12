import { TFile, moment, Notice, Vault } from "obsidian";
import { VALID_MEDIA_EXTENSIONS } from "../constants";
import FileOrganizer from "../index";
import { validateFile } from "../utils";
import { Queue } from "./services/queue";
import { RecordManager } from "./services/record-manager";
import { FileRecord, QueueStatus } from "./types";
import { logMessage } from "../../utils";
import { IdService } from "./services/id-service";

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
        console.error("Queue processing error:", error);
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
        .then(processContentStep)
        .then(determineDestinationStep)
        .then(async ctx => {
          if (this.shouldCreateMarkdownContainer(ctx.file)) {
            return await processMediaFileStep(ctx);
          } else {
            return await processNonMediaFileStep(ctx);
          }
        })
        .then(completeProcessing);
      this.queue.remove(context.hash);
    } catch (error) {
      console.error("Error processing inbox file:", error);
      await handleError(error, context);
    }
  }

  private shouldCreateMarkdownContainer(file: TFile): boolean {
    return (
      VALID_MEDIA_EXTENSIONS.includes(file.extension) ||
      file.extension === "pdf"
    );
  }
}

// Pipeline processing steps

async function startProcessing(
  context: ProcessingContext
): Promise<ProcessingContext> {
  context.recordManager.recordProcessingStart(context.record);
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

async function processContentStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  const result = await processContent(context.plugin, context.file);
  if (!result) {
    context.recordManager.recordProcessingBypassed(
      context.record,
      "No content to process"
    );
    throw new Error("No content to process");
  }
  context.content = result.text;
  return context;
}

async function determineDestinationStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  // Get AI classified folder and update record
  context.newPath = await context.plugin.getAIClassifiedFolder(
    context.content!,
    context.file.path
  );
  context.recordManager.updateFileStatus(
    context.record,
    "processing",
    `Determined destination folder: ${context.newPath}`
  );

  // Generate AI name and update record
  context.newName = await context.plugin.generateNameFromContent(
    context.content!,
    context.file.name
  );
  context.recordManager.updateFileStatus(
    context.record,
    "processing",
    `Generated new name: ${context.newName}`
  );

  return context;
}

async function processMediaFileStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  // Create container file
  const containerPath = `${context.newPath}/${context.newName}.md`;
  context.containerFile = await createFile(
    context,
    containerPath,
    context.content!
  );

  // Move attachment
  const attachmentFolderPath = `${context.newPath}/attachments`;
  await moveFile(
    context,
    context.file,
    `${attachmentFolderPath}/${context.file.name}`
  );
  context.attachmentFile = context.plugin.app.vault.getAbstractFileByPath(
    `${attachmentFolderPath}/${context.file.name}`
  ) as TFile;

  // Update container with attachment reference
  await context.plugin.app.vault.modify(
    context.containerFile,
    `${context.content}\n\n![[${context.attachmentFile.path}]]`
  );

  // Generate tags
  const existingTags = await context.plugin.getAllVaultTags();
  context.tags = (
    await context.plugin.guessRelevantTags(
      context.content!,
      context.file.path,
      existingTags
    )
  ).map(tag => tag.tag);

  return context;
}

async function processNonMediaFileStep(
  context: ProcessingContext
): Promise<ProcessingContext> {
  const existingTags = await context.plugin.getAllVaultTags();
  context.tags = (
    await context.plugin.guessRelevantTags(
      context.content!,
      context.file.path,
      existingTags
    )
  ).map(tag => tag.tag);

  const finalPath = `${context.newPath}/${context.newName}.md`;
  await moveFile(context, context.file, finalPath);

  return context;
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

async function processContent(
  plugin: FileOrganizer,
  file: TFile
): Promise<{ text: string } | null> {
  try {
    const text = await plugin.getTextFromFile(file);
    return { text };
  } catch (error) {
    console.error("Error in processContent:", error);
    throw new Error("Error in processContent");
  }
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
    console.error(`Failed to move file ${file.path} to ${newPath}:`, error);
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
    console.error(`Failed to create file at ${path}:`, error);
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
      console.error("Error creating folder:", error);
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
