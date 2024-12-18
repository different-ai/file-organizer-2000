import { TFile } from "obsidian";


export type ActionType = 'renamed' | 'moved' | 'classified' | 'tagged' | 'error';

export interface Classification {
  documentType: string;
  confidence: number;
  reasoning: string;
}

export interface ActionLog {
  action: ActionType;
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

export interface FileMetadata {
  size: number;
  extension: string;
  createdTime: number;
  modifiedTime: number;
  isMediaFile: boolean;
}

export interface EventRecord {
  id: string;
  fileRecordId: string;
  timestamp: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface QueueStatus {
  queued: number;
  processing: number;
  completed: number;
  errors: number;
  bypassed: number;
  total: number;
}

export interface ProcessingResult {
  text: string;
  classification?: string;
  formattedText: string;
  tags?: string[];
}

export interface FileOperation {
  type: 'move' | 'create' | 'modify';
  file: TFile;
  newPath?: string;
  content?: string;
}

export interface BatchRequest<T> {
  content: string;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

export interface ClassificationResult {
  classification: string;
  formattedText: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hash: string;
} 