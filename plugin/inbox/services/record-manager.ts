import { TFile } from "obsidian";
import { IdService } from "./id-service";
import moment from "moment";

enum Step {
  PREPROCESS = 'preprocess',
  EXTRACT = 'extract',
  CLASSIFY = 'classify',
  TAG = 'tag',
  FORMAT = 'format',
  MOVE = 'move'
}

interface LogEntry {
  timestamp: string;
  step: Step;
  type: 'log' | 'error';
  message: string;
  error?: {
    message: string;
    stack?: string;
  };
}

interface FileLog {
  id: string;
  filePath: string;
  logs: LogEntry[];
}

export class RecordManager {
  private static instance: RecordManager;
  private logs: Map<string, FileLog> = new Map();
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

  public trackFile(file: TFile): string {
    const id = this.idService.generateFileHash(file);
    
    if (!this.logs.has(id)) {
      this.logs.set(id, {
        id,
        filePath: file.path,
        logs: []
      });
    }

    return id;
  }

  private addLog(fileId: string, step: Step, message: string, error?: Error): void {
    const log = this.logs.get(fileId);
    if (!log) return;

    const entry: LogEntry = {
      timestamp: moment().format(),
      step,
      type: error ? 'error' : 'log',
      message,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack
        }
      })
    };

    log.logs.push(entry);
  }

  // Consistent logging API
  public log(fileId: string, step: Step, message: string): void {
    this.addLog(fileId, step, message);
  }

  public logError(fileId: string, step: Step, error: Error): void {
    this.addLog(fileId, step, error.message, error);
  }

  // Query methods
  public hasErrors(fileId: string, step?: Step): boolean {
    const log = this.logs.get(fileId);
    if (!log) return false;
    
    return log.logs.some(entry => 
      entry.type === 'error' && 
      (!step || entry.step === step)
    );
  }

  public getStepLogs(fileId: string, step: Step): LogEntry[] {
    const log = this.logs.get(fileId);
    if (!log) return [];
    return log.logs.filter(entry => entry.step === step);
  }

  public getLastStep(fileId: string): Step | null {
    const log = this.logs.get(fileId);
    if (!log || log.logs.length === 0) return null;
    return log.logs[log.logs.length - 1].step;
  }

  // Query methods for multiple files
  public getAllRecords(): FileLog[] {
    return Array.from(this.logs.values());
  }

  public getRecordsWithErrors(): FileLog[] {
    return this.getAllRecords().filter(log => 
      log.logs.some(entry => entry.type === 'error')
    );
  }

  public getRecordsByStep(step: Step): FileLog[] {
    return this.getAllRecords().filter(log =>
      log.logs.some(entry => entry.step === step)
    );
  }

  public getRecordsSummary(): Array<{
    id: string;
    filePath: string;
    lastStep: Step | null;
    hasErrors: boolean;
    logCount: number;
  }> {
    return this.getAllRecords().map(log => ({
      id: log.id,
      filePath: log.filePath,
      lastStep: log.logs.length ? log.logs[log.logs.length - 1].step : null,
      hasErrors: log.logs.some(entry => entry.type === 'error'),
      logCount: log.logs.length
    }));
  }
}
