import { TFile } from "obsidian";
import { createHash } from "crypto";

export class IdService {
  private static instance: IdService;

  public static getInstance(): IdService {
    if (!IdService.instance) {
      IdService.instance = new IdService();
    }
    return IdService.instance;
  }

  public generateFileHash(file: TFile): string {
    // Create a unique hash based on file path and last modified time
    const content = `${file.path}-${file.stat.mtime}`;
    return createHash('sha256').update(content).digest('hex').slice(0, 12);
  }

  public generateEventId(fileHash: string, timestamp: number): string {
    return `evt-${fileHash}-${timestamp}`;
  }

  public generateStepId(fileHash: string, type: string): string {
    return `step-${fileHash}-${type}`;
  }

  public validateHash(hash: string): boolean {
    return typeof hash === 'string' && hash.length === 12;
  }
} 