import { TFile } from "obsidian";
import { IdService } from "./id-service";
import moment from "moment";

export enum Step {
  PREPROCESS = "preprocess",
  EXTRACT = "extract",
  CLASSIFY = "classify",
  TAG = "tag",
  FORMAT = "format",
  MOVE = "move",
}

export interface LogEntry {
  timestamp: string;
  step: Step;
  type: "log" | "error";
  message: string;
  error?: {
    message: string;
    stack?: string;
  };
}

export interface FileRecord {
  id: string;
  tags: string[];
  classification?: string;
  formatted: boolean;
  newPath?: string;
  newName?: string;
  logs: LogEntry[];
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
        tags: [],
        formatted: false,
        logs: [],
      });
    }
    return hash;
  }

  // Record update methods
  public addTag(hash: string, tag: string): void {
    const record = this.records.get(hash);
    if (record && !record.tags.includes(tag)) {
      record.tags.push(tag);
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

  private addLog(
    hash: string,
    step: Step,
    message: string,
    error?: Error
  ): void {
    const record = this.records.get(hash);
    if (!record) return;

    const entry: LogEntry = {
      timestamp: moment().format(),
      step,
      type: error ? "error" : "log",
      message,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    record.logs.push(entry);
  }

  // Logging methods
  public log(hash: string, step: Step, message: string): void {
    this.addLog(hash, step, message);
  }

  public logError(hash: string, step: Step, error: Error): void {
    this.addLog(hash, step, error.message, error);
  }

  // Query methods
  public getRecord(hash: string): FileRecord | undefined {
    return this.records.get(hash);
  }

  public hasErrors(hash: string, step?: Step): boolean {
    const record = this.records.get(hash);
    if (!record) return false;

    return record.logs.some(
      entry => entry.type === "error" && (!step || entry.step === step)
    );
  }

  public getStepLogs(hash: string, step: Step): LogEntry[] {
    const record = this.records.get(hash);
    if (!record) return [];
    return record.logs.filter(entry => entry.step === step);
  }

  public getLastStep(hash: string): Step | null {
    const record = this.records.get(hash);
    if (!record || record.logs.length === 0) return null;
    return record.logs[record.logs.length - 1].step;
  }

  // Query methods for multiple records
  public getAllRecords(): FileRecord[] {
    return Array.from(this.records.values());
  }

  public getRecordsWithErrors(): FileRecord[] {
    return this.getAllRecords().filter(record =>
      record.logs.some(entry => entry.type === "error")
    );
  }

  public getRecordsByStep(step: Step): FileRecord[] {
    return this.getAllRecords().filter(record =>
      record.logs.some(entry => entry.step === step)
    );
  }
}
