import { TFile } from "obsidian";
import { IdService } from "./id-service";
import moment from "moment";

export enum Action {
  CLEANUP = "cleaning up file",
  RENAME = "renaming file",
  EXTRACT = "extracting text",
  MOVING_ATTACHEMENT = "moving attachments",
  CLASSIFY = "classifying",
  TAGGING = "recommending tags",
  APPLYING_TAGS = "applying tags",
  RECOMMEND_NAME = "recommending name",
  APPLYING_NAME = "applying name",
  FORMATTING = "formatting",
  MOVING = "moving",
  COMPLETED = "completed",
}

export interface LogEntry {
  timestamp: string;
  completed?: boolean;
  error?: {
    message: string;
    stack?: string;
  };
}

export type FileStatus =
  | "queued"
  | "processing"
  | "completed"
  | "error"
  | "bypassed";

export interface FileRecord {
  id: string;
  tags: string[];
  classification?: string;
  formatted: boolean;
  newPath?: string;
  newName?: string;
  logs: Record<Action, LogEntry>;
  status: FileStatus;
  file: TFile | null;
}

export class RecordManager {
  private static instance: RecordManager;
  private records: Map<string, FileRecord> = new Map();
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

  public startTracking(hash: string): string {
    if (!this.records.has(hash)) {
      this.records.set(hash, {
        id: hash,
        file: null,
        tags: [],
        formatted: false,
        logs: {} as Record<Action, LogEntry>,
        status: "queued",
      });
    }
    return hash;
  }

  public setFile(hash: string, file: TFile): void {
    const record = this.records.get(hash);
    if (record) {
      record.file = file;
    }
  }

  public setStatus(hash: string, status: FileStatus): void {
    const record = this.records.get(hash);
    if (record) {
      record.status = status;
    }
  }

  public addAction(hash: string, step: Action, completed = false): void {
    const record = this.records.get(hash);
    if (record) {
      record.logs[step] = {
        timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
        completed,
      };
    }
  }

  // Record update methods
  public addTag(hash: string, tag: string): void {
    const record = this.records.get(hash);
    if (record && !record.tags.includes(tag)) {
      record.tags.push(tag);
    }
  }

  public setTags(hash: string, tags: string[]): void {
    const record = this.records.get(hash);
    if (record) {
      record.tags = tags;
    }
  }

  public setClassification(hash: string, classification: string): void {
    const record = this.records.get(hash);
    if (record) {
      record.classification = classification;
    }
  }

  public setFormatted(hash: string, formatted: boolean): void {
    const record = this.records.get(hash);
    if (record) {
      record.formatted = formatted;
    }
  }

  public setNewPath(hash: string, newPath: string): void {
    const record = this.records.get(hash);
    if (record) {
      record.newPath = newPath;
    }
  }

  public setNewName(hash: string, newName: string): void {
    const record = this.records.get(hash);
    if (record) {
      record.newName = newName;
    }
  }

  // Logging methods
  // Query methods
  public getRecord(hash: string): FileRecord | undefined {
    return this.records.get(hash);
  }

  public hasErrors(hash: string, step?: Action): boolean {
    const record = this.records.get(hash);
    if (!record) return false;

    if (step) {
      return !!record.logs[step]?.error;
    }

    return Object.values(record.logs).some(log => !!log.error);
  }

  public getStepLogs(hash: string, step: Action): LogEntry | undefined {
    const record = this.records.get(hash);
    if (!record) return undefined;
    return record.logs[step];
  }

  public getLastStep(hash: string): Action | null {
    const record = this.records.get(hash);
    if (!record) return null;

    const steps = Object.entries(record.logs);
    if (steps.length === 0) return null;

    return steps.reduce((latest, [action, log]) => {
      if (!latest || moment(log.timestamp).isAfter(moment(record.logs[latest].timestamp))) {
        return action as Action;
      }
      return latest;
    }, null as Action | null);
  }

  // Query methods for multiple records
  public getAllRecords(): FileRecord[] {
    return Array.from(this.records.values());
  }

  public getRecordsWithErrors(): FileRecord[] {
    return this.getAllRecords().filter(record =>
      Object.values(record.logs).some(log => !!log.error)
    );
  }

  public getRecordsByStep(step: Action): FileRecord[] {
    return this.getAllRecords().filter(record => !!record.logs[step]);
  }
}
