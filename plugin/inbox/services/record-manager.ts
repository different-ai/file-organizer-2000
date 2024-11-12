import { TFile } from "obsidian";
import { FileRecord, FileStatus, FileMetadata, EventRecord, Classification } from "../types";
import { IdService } from "./id-service";
import { ErrorService, ErrorSeverity } from "./error-service";
import { isMediaFile } from "../utils/file";
import moment from "moment";

interface ActionLog {
  action: 'renamed' | 'moved' | 'classified' | 'tagged' | 'error';
  timestamp: string;
  details: {
    from?: string;
    to?: string;
    tags?: string[];
    classification?: Classification;
    error?: string;
    destinationFolder?: string;
    wasFormatted?: boolean;
  };
}

export class RecordManager {
  private static instance: RecordManager;
  private fileRecords: Map<string, FileRecord> = new Map();
  private eventRecords: Map<string, EventRecord[]> = new Map();
  private idService: IdService;

  private constructor() {
    this.idService = IdService.getInstance();
  }

  public static getInstance(): RecordManager {
    if (!RecordManager.instance) {
      RecordManager.instance = new RecordManager();
    }
    return RecordManager.instance;
  }

  public createOrUpdateFileRecord(
    file: TFile,
    updates?: Partial<FileRecord>
  ): FileRecord {
    try {
      const hash = this.idService.generateFileHash(file);
      const existingRecord = this.getRecordByHash(hash);

      if (existingRecord) {
        if (updates) {
          return this.updateRecord(hash, updates);
        }
        return existingRecord;
      }

      const now = moment().format();
      const metadata: FileMetadata = {
        size: file.stat.size,
        extension: file.extension,
        createdTime: file.stat.ctime,
        modifiedTime: file.stat.mtime,
        isMediaFile: isMediaFile(file),
      };

      const newRecord: FileRecord = {
        id: hash,
        filePath: file.path,
        fileName: file.basename,
        previousName: file.basename,
        status: "queued" as FileStatus,
        createdAt: now,
        updatedAt: now,
        metadata,
        errors: [],
        ...updates,
      };

      this.fileRecords.set(hash, newRecord);
      this.addEvent(hash, "File record initialized", { metadata });

      return newRecord;
    } catch (error) {
      ErrorService.getInstance().handleError({
        message: "Failed to create/update file record",
        severity: ErrorSeverity.HIGH,
        error: error as Error,
        context: { filePath: file.path },
      });
      throw error;
    }
  }

  private updateRecord(hash: string, updates: Partial<FileRecord>): FileRecord {
    const record = this.getRecordByHash(hash);
    if (!record) {
      throw new Error(`Record not found for hash: ${hash}`);
    }

    const updatedRecord = {
      ...record,
      ...updates,
      updatedAt: moment().format(),
    };

    this.fileRecords.set(hash, updatedRecord);
    return updatedRecord;
  }

  public updateFileStatus(
    record: FileRecord,
    status: FileStatus,
    message?: string,
    metadata?: Record<string, any>
  ): void {
    const hash = record.id;

    // Update the record with new status
    this.updateRecord(hash, {
      status,
      updatedAt: moment().format(),
    });

    // Add event with status change
    const statusMessage = message || `File status changed to ${status}`;
    this.addEvent(hash, statusMessage, {
      status,
      previousStatus: record.status,
      ...metadata,
    });
  }

  public recordProcessingStart(record: FileRecord): void {
    this.updateFileStatus(record, "processing", "Started processing file");
  }

  public recordProcessingComplete(
    record: FileRecord,
    metadata?: {
      newPath?: string;
      newName?: string;
      tags?: string[];
    }
  ): void {
    const updates: Partial<FileRecord> = {
      status: "completed",
      updatedAt: moment().format(),
    };

    if (metadata) {
      // Update file paths
      if (metadata.newPath) updates.newPath = metadata.newPath;
      if (metadata.newName) updates.newName = metadata.newName;

      // Update tags
      if (metadata.tags) updates.tags = metadata.tags;

      // Update processing information
    }

    this.updateRecord(record.id, updates);
    this.addEvent(record.id, "File processing completed", metadata);
  }

  public recordProcessingBypassed(record: FileRecord, reason?: string): void {
    this.updateFileStatus(
      record,
      "bypassed",
      reason || "File processing bypassed"
    );
  }

  public recordError(record: FileRecord, error: Error): void {
    this.logAction(record, 'error', { error: error.message });
  }

  public updateDestination(
    record: FileRecord,
    newName: string,
    newPath: string
  ): void {
    const hash = record.id;
    this.updateRecord(hash, { newName, newPath });
    this.addEvent(hash, `Updated destination: ${newPath}/${newName}`);
  }

  public addTags(record: FileRecord, tags: string[]): void {
    const hash = record.id;
    this.updateRecord(hash, { tags });
    this.addEvent(hash, `Added tags: ${tags.join(", ")}`);
  }

  public getRecordByHash(hash: string): FileRecord | undefined {
    return this.fileRecords.get(hash);
  }

  public getRecordByPath(path: string): FileRecord | undefined {
    return Array.from(this.fileRecords.values()).find(
      record => record.filePath === path
    );
  }

  public getAllRecords(): FileRecord[] {
    return Array.from(this.fileRecords.values());
  }

  public getFileEvents(fileId: string): EventRecord[] {
    return this.eventRecords.get(fileId) || [];
  }

  private addEvent(
    hash: string,
    message: string,
    metadata?: Record<string, any>
  ): void {
    const event: EventRecord = {
      id: this.idService.generateEventId(hash, Date.now()),
      fileRecordId: hash,
      timestamp: moment().format(),
      message,
      metadata,
    };

    const events = this.eventRecords.get(hash) || [];
    events.push(event);
    this.eventRecords.set(hash, events);
  }

  public logAction(record: FileRecord, action: ActionLog['action'], details: ActionLog['details']): void {
    const actionLog: ActionLog = {
      action,
      timestamp: moment().format(),
      details
    };

    this.updateRecord(record.id, {
      actions: [...(record.actions || []), actionLog]
    });
  }

  public recordRename(record: FileRecord, oldName: string, newName: string): void {
    this.logAction(record, 'renamed', { from: oldName, to: newName });
  }

  public recordMove(record: FileRecord, oldPath: string, newPath: string): void {
    const destinationFolder = newPath.split('/').slice(0, -1).join('/');
    this.logAction(record, 'moved', { 
      from: oldPath, 
      to: newPath,
      destinationFolder 
    });
    
    this.updateRecord(record.id, {
      destinationFolder
    });
  }

  public recordClassification(record: FileRecord, classification: Classification): void {
    this.logAction(record, 'classified', { 
      classification,
      wasFormatted: classification.confidence >= 50 
    });
    
    this.updateRecord(record.id, {
      classification,
      formattedContent: classification.confidence >= 50
    });
  }

  public recordTags(record: FileRecord, tags: string[]): void {
    this.logAction(record, 'tagged', { tags });
  }
}
