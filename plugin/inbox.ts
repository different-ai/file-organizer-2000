import { TFile, moment, Notice, App } from "obsidian";
import { moveFile, ensureFolderExists } from "./fileUtils";
import { logMessage } from "./someUtils";
import { VALID_MEDIA_EXTENSIONS } from "./constants";
import FileOrganizer from "./index";
import { validateFile } from "./utils";
import { logger } from "./services/logger";

type ProcessingResult = {
  text: string;
  classification?: string;
  formattedText: string;
  tags?: string[];
};

export interface FolderSuggestion {
  isNewFolder: boolean;
  score: number;
  folder: string;
  reason: string;
}

interface TitleSuggestion {
  score: number;
  title: string;
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

export interface FileRecord {
  id: string;
  filePath: string;
  fileName: string;
  status: "queued" | "processing" | "completed" | "error";
  createdAt: string;
  updatedAt: string;
  newPath?: string;
  newName?: string;
  classification?: string;
  addedTags?: string[];
  errors?: string[];
}

interface EventRecord {
  id: string;
  fileRecordId: string;
  timestamp: string;
  message: string;
  metadata?: Record<string, any>;
}

interface TagResult {
  tags: string[];
  success: boolean;
  error?: string;
}

export class Inbox {
  protected static instance: Inbox;
  private plugin: FileOrganizer;
  private processingQueue: TFile[] = [];
  private inMemoryLog: { [key: string]: string[] } = {};
  private activeProcessingTasks: number = 0;
  private readonly MAX_CONCURRENT_TASKS: number = 100;
  private isDebugEnabled: boolean = false;
  private queueStatus: {
    queued: string[];
    processing: string[];
    completed: string[];
    errors: string[];
  } = {
    queued: [],
    processing: [],
    completed: [],
    errors: [],
  };
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private logEntries: Map<string, LogEntry> = new Map();
  private fileRecords: Map<string, FileRecord> = new Map();
  private eventRecords: Map<string, EventRecord[]> = new Map();

  private constructor(plugin: FileOrganizer) {
    this.plugin = plugin;
    this.startQueueProcessor();
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
      Inbox.instance.cleanup();
      Inbox.instance = null;
    }
  }

  public enqueueFile(file: TFile): void {
    this.enqueueFiles([file]);
  }

  public enqueueFiles(files: TFile[]): void {
    for (const file of files) {
      const record = this.trackFile(file);
      this.addEvent(record, "File enqueued for processing");
      this.queueStatus.queued.push(file.basename);
      this.processingQueue.push(file);
    }
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      logMessage("Process queue already running, skipping...");
      return;
    }

    try {
      this.isProcessing = true;

      while (
        this.processingQueue.length > 0 &&
        this.activeProcessingTasks < this.MAX_CONCURRENT_TASKS
      ) {
        const file = this.processingQueue.shift();
        if (file) {
          this.activeProcessingTasks++;
          this.processInboxFile(file)
            .catch((error: Error) => {
              logger.error("Error processing file:", error);
            })
            .finally(() => {
              this.activeProcessingTasks--;
              if (this.processingQueue.length > 0 && !this.isProcessing) {
                this.processQueue();
              }
            });
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processInboxFile(file: TFile): Promise<void> {
    const record = this.trackFile(file);
    this.updateFileStatus(file, "processing", "Started processing file");

    try {
      const fileName = file.basename;

      if (!validateFile(file)) {
        await this.moveFileToErrorFolder(file);
        this.updateFileStatus(file, "error", "Unsupported file type", {
          error: "Unsupported file type",
        });
        return;
      }

      const processingResult = await this.processContent(file, fileName);
      if (!processingResult) return;

      const { text, classification, formattedText } = processingResult;

      const { newPath, newName } = await this.determineDestination(
        formattedText || text,
        file,
        text,
        fileName
      );

      let tags: string[] = [];

      if (this.shouldCreateMarkdownContainer(file)) {
        tags = await this.processMediaFile(
          file,
          text,
          newName,
          newPath,
          fileName,
          formattedText
        );
      } else {
        tags = await this.processNonMediaFile(
          file,
          text,
          newName,
          newPath,
          classification || "",
          fileName,
          formattedText
        );
      }

      this.updateFileStatus(file, "completed", "Processing completed", {
        newPath,
        newName,
        classification,
        addedTags: tags,
      });
    } catch (error: any) {
      this.updateFileStatus(file, "error", "Processing failed", {
        error: error.message,
      });
      await this.handleError(error, file, file.basename);
    }

    if (this.isDebugEnabled) {
      console.log(this.getQueueStatus());
    }
  }

  private async handleError(
    error: any,
    file: TFile,
    fileName: string
  ): Promise<void> {
    this.updateFileStatus(
      file,
      "error",
      `Error processing ${fileName}: ${error.message}`,
      {
        errors: [error.message],
      }
    );
    await this.moveFileToErrorFolder(file);
    this.updateFileStatus(
      file,
      "error",
      `Moved ${fileName} to error folder due to processing error`,
      {
        newPath: "_FileOrganizer2000/Error",
        newName: fileName,
      }
    );
  }

  private async moveFileToErrorFolder(file: TFile): Promise<void> {
    const errorFolderPath = "_FileOrganizer2000/Error";
    await ensureFolderExists(this.plugin.app, errorFolderPath);
    const newFilePath = `${errorFolderPath}/${file.name}`;
    await this.plugin.app.fileManager.renameFile(file, newFilePath);
  }

  private async classifyAndFormatContent(
    text: string,
    fileName: string,
    file: TFile
  ): Promise<{
    classification: string;
    formattedText: string;
  }> {
    const templateNames = await this.plugin.getTemplateNames();
    if (!templateNames) {
      return { classification: "unclassified", formattedText: text };
    }
    const classification = await this.plugin.classifyContentV2(
      text,
      templateNames
    );
    if (!classification) {
      return { classification: "unclassified", formattedText: text };
    }

    const instructions = await this.plugin.getTemplateInstructions(
      classification
    );
    if (!instructions) {
      this.updateFileStatus(
        file,
        "error",
        `No instructions found for classification`,
        {
          classification,
        }
      );
      return { classification, formattedText: text };
    }
    const formattedText = await this.plugin.formatContentV2(text, instructions);
    if (!formattedText) {
      return { classification: "unclassified", formattedText: text };
    }

    logMessage(`formattedText: ${formattedText}`);
    this.updateFileStatus(
      file,
      "completed",
      `Classified as ${classification}`,
      {
        classification,
      }
    );

    return { classification, formattedText };
  }

  private async processContent(
    file: TFile,
    fileName: string
  ): Promise<ProcessingResult | null> {
    try {
      const text = await this.plugin.getTextFromFile(file);
      this.updateFileStatus(
        file,
        "completed",
        `Read content from ${file.basename}`,
        {
          text,
        }
      );

      let classification = "unclassified";
      let formattedText = text;

      if (this.plugin.settings.enableDocumentClassification) {
        const result = await this.classifyAndFormatContent(
          text,
          fileName,
          file
        );
        classification = result.classification;
        formattedText = result.formattedText;
      }

      return { text, classification, formattedText };
    } catch (error) {
      this.updateFileStatus(
        file,
        "error",
        `Error reading file ${file.basename}: ${error.message}`,
        {
          error: error.message,
        }
      );
      new Notice(`Error reading file ${file.basename}`, 3000);
      logger.error("Error in getTextFromFile:", error);
      throw Error("Error in processContent");
    }
  }

  private async determineDestination(
    content: string,
    file: TFile,
    originalText: string,
    fileName: string
  ) {
    const newPath = await this.plugin.getAIClassifiedFolder(content, file.path);
    this.updateFileStatus(
      file,
      "completed",
      `Determined new folder: ${newPath}`,
      {
        newPath,
      }
    );

    const newName = await this.plugin.generateNameFromContent(
      originalText,
      file.basename
    );
    this.updateFileStatus(file, "completed", `Generated new name: ${newName}`, {
      newName,
    });

    return { newPath, newName };
  }

  private async processMediaFile(
    file: TFile,
    content: string,
    newName: string,
    newPath: string,
    fileName: string,
    formattedText: string
  ): Promise<string[]> {
    try {
      this.logDebug(`Processing media file: ${fileName}`);

      const containerFile = await this.plugin.createMediaContainer(
        formattedText
      );
      this.logDebug(`Created container: ${containerFile.path}`);

      const attachmentFile = await this.plugin.moveToAttachmentFolder(
        file,
        newName
      );
      await this.plugin.app.vault.append(
        containerFile,
        `\n\n![[${attachmentFile.path}]]`
      );

      const tagResult = await this.processAndTrackTags(
        containerFile,
        content,
      );

      await this.plugin.moveFile(containerFile, newName, newPath);

      this.updateFileStatus(
        file,
        "completed",
        `Media file processed successfully`,
        {
          containerPath: containerFile.path,
          attachmentPath: attachmentFile.path,
          newPath,
          newName,
          addedTags: tagResult.tags,
          processingSteps: [
            "container-created",
            "attachment-moved",
            tagResult.success ? "tags-added" : "tags-failed",
            "container-moved",
          ],
        }
      );

      return tagResult.tags;
    } catch (error) {
      this.logDebug(`Error processing media file: ${error.message}`);
      throw error;
    }
  }

  private async processNonMediaFile(
    file: TFile,
    content: string,
    newName: string,
    newPath: string,
    classification: string,
    fileName: string,
    formattedText: string
  ): Promise<string[]> {
    try {
      this.logDebug(`Processing non-media file: ${fileName}`);

      if (classification && classification !== "unclassified") {
        await this.plugin.app.vault.modify(file, formattedText);
        this.updateFileStatus(
          file,
          "processing",
          `Applied formatting for ${classification}`
        );
      }

      const tagResult = await this.processAndTrackTags(file, content, newName);

      if (!tagResult.success) {
        this.updateFileStatus(
          file,
          "warning",
          `Tag generation issue: ${tagResult.error}`,
          {
            warning: tagResult.error,
          }
        );
      }

      await this.plugin.moveFile(file, newName, newPath);

      this.updateFileStatus(file, "completed", `File processed successfully`, {
        newPath,
        newName,
        classification,
        addedTags: tagResult.tags,
        processingSteps: [
          "content-formatted",
          tagResult.success ? "tags-added" : "tags-failed",
          "file-moved",
        ],
      });

      return tagResult.tags;
    } catch (error) {
      this.logDebug(`Error processing non-media file: ${error.message}`);
      throw error;
    }
  }

  private shouldCreateMarkdownContainer(file: TFile): boolean {
    return (
      VALID_MEDIA_EXTENSIONS.includes(file.extension) ||
      file.extension === "pdf"
    );
  }

  public enableDebug(): void {
    this.isDebugEnabled = true;
    console.log("Debug mode enabled for Inbox");
  }

  public disableDebug(): void {
    this.isDebugEnabled = false;
  }

  public getQueueStatus(): string {
    const logs = Object.entries(this.inMemoryLog)
      .map(([fileName, messages]) => {
        return `${fileName}:\n${messages.slice(-3).join("\n")}`;
      })
      .join("\n\n");

    return `
Queue Status:
${this.getBasicQueueStatus()}

Recent Logs:
${logs}
    `.trim();
  }

  private getBasicQueueStatus(): string {
    return `
- Queued (${this.queueStatus.queued.length}): ${this.queueStatus.queued.join(
      ", "
    )}
- Processing (${
      this.queueStatus.processing.length
    }): ${this.queueStatus.processing.join(", ")}
- Completed (${this.queueStatus.completed.length}): ${this.queueStatus.completed
      .slice(-5)
      .join(", ")}
- Errors (${this.queueStatus.errors.length}): ${this.queueStatus.errors.join(
      ", "
    )}
- Active Tasks: ${this.activeProcessingTasks}
- Queue Length: ${this.processingQueue.length}`.trim();
  }

  public cleanup(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  private startQueueProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(() => {
      if (
        !this.isProcessing &&
        (this.processingQueue.length > 0 || this.activeProcessingTasks > 0)
      ) {
        this.processQueue();
      }
    }, 1000);
  }

  public getInMemoryLog(): { [key: string]: string[] } {
    return this.inMemoryLog;
  }

  public getAllLogs(): LogEntry[] {
    return Array.from(this.logEntries.values()).sort(
      (a, b) => moment(b.timestamp).valueOf() - moment(a.timestamp).valueOf()
    );
  }

  public getLatestLogs(limit: number = 50): LogEntry[] {
    return this.getAllLogs().slice(0, limit);
  }

  private createFileRecord(filePath: string): FileRecord {
    const id = `file-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const record: FileRecord = {
      id,
      filePath,
      fileName: filePath.split("/").pop() || "",
      status: "queued",
      createdAt: moment().format(),
      updatedAt: moment().format(),
    };
    this.fileRecords.set(filePath, record);
    return record;
  }

  private updateFileRecord(
    filePath: string,
    updates: Partial<FileRecord>
  ): FileRecord {
    const record = this.fileRecords.get(filePath);
    if (!record) {
      throw new Error(`No file record found for ${filePath}`);
    }

    const updatedRecord = {
      ...record,
      ...updates,
      updatedAt: moment().format(),
    };
    this.fileRecords.set(filePath, updatedRecord);
    return updatedRecord;
  }

  private addEvent(
    fileRecord: FileRecord,
    message: string,
    metadata?: Record<string, any>
  ): void {
    const event: EventRecord = {
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      fileRecordId: fileRecord.id,
      timestamp: moment().format(),
      message,
      metadata,
    };

    const events = this.eventRecords.get(fileRecord.id) || [];
    events.push(event);
    this.eventRecords.set(fileRecord.id, events);
  }

  private trackFile(file: TFile): FileRecord {
    const existingRecord = this.fileRecords.get(file.path);
    if (existingRecord) {
      return existingRecord;
    }
    return this.createFileRecord(file.path);
  }

  private updateFileStatus(
    file: TFile,
    status: FileRecord["status"],
    message: string,
    metadata?: Record<string, any>
  ): void {
    const record = this.updateFileRecord(file.path, {
      status,
      ...metadata,
    });
    this.addEvent(record, message, metadata);
  }

  public getFileStatus(filePath: string): FileRecord | undefined {
    return this.fileRecords.get(filePath);
  }

  public getFileEvents(fileId: string): EventRecord[] {
    return this.eventRecords.get(fileId) || [];
  }

  public getAllFiles(): FileRecord[] {
    return Array.from(this.fileRecords.values()).sort(
      (a, b) => moment(b.updatedAt).valueOf() - moment(a.updatedAt).valueOf()
    );
  }

  private logDebug(message: string, data?: any): void {
    if (this.isDebugEnabled) {
      console.log(`[Inbox Debug] ${message}`, data || "");

      // Also store in memory for UI display
      const debugEntry = `${moment().format("HH:mm:ss")} - ${message}`;
      this.inMemoryLog["debug"] = this.inMemoryLog["debug"] || [];
      this.inMemoryLog["debug"].push(debugEntry);
    }
  }

  private async processAndTrackTags(
    file: TFile,
    content: string,
  ): Promise<TagResult> {
    try {
      this.logDebug(`Starting tag generation for ${file.basename}`);

      // get existing tags
      const existingTags = await this.plugin.getAllVaultTags();

      const tags = await this.plugin.guessRelevantTags(
        content,
        file.path,
        existingTags
      );

      if (!tags && !Array.isArray(tags)) {
        throw new Error("Tag generation failed - invalid response");
      }

      this.logDebug(`Generated tags: ${tags.join(", ")}`);

      return {
        tags,
        success: true,
      };
    } catch (error: any) {
      this.logDebug(`Tag generation error: ${error.message}`);
      return {
        tags: [],
        success: false,
        error: error.message || "Unknown error during tag generation",
      };
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

export function enableInboxDebug(): void {
  Inbox.getInstance().enableDebug();
}

export function getInboxStatus(): string {
  return Inbox.getInstance().getQueueStatus();
}
