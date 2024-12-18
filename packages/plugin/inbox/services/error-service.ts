import { Notice } from "obsidian";
import { logger } from "../../services/logger";

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

export interface ErrorDetails {
  message: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  error?: Error;
  shouldNotify?: boolean;
}

export class ErrorService {
  private static instance: ErrorService;
  private errorLog: ErrorDetails[] = [];
  private readonly MAX_LOG_SIZE = 100;
  private isDebugEnabled = false;

  private constructor() {}

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  public handleError(details: ErrorDetails): void {
    // Log the error
    this.logError(details);

    // Show notification if needed
    if (details.shouldNotify) {
      this.showNotification(details);
    }

    // Log to console in debug mode
    if (this.isDebugEnabled) {
      logger.error("[FileOrganizer Error]", {
        ...details,
        timestamp: new Date().toISOString()
      });
    }
  }

  private logError(details: ErrorDetails): void {
    this.errorLog.unshift({
      ...details,
      context: {
        ...details.context,
        timestamp: new Date().toISOString()
      }
    });

    // Trim log if it gets too large
    if (this.errorLog.length > this.MAX_LOG_SIZE) {
      this.errorLog = this.errorLog.slice(0, this.MAX_LOG_SIZE);
    }
  }

  private showNotification(details: ErrorDetails): void {
    const duration = this.getNotificationDuration(details.severity);
    new Notice(
      `FileOrganizer: ${details.message}`, 
      duration
    );
  }

  private getNotificationDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 10000; // 10 seconds
      case ErrorSeverity.HIGH:
        return 5000;  // 5 seconds
      case ErrorSeverity.MEDIUM:
        return 3000;  // 3 seconds
      default:
        return 2000;  // 2 seconds
    }
  }

  public getRecentErrors(): ErrorDetails[] {
    return [...this.errorLog];
  }

  public clearErrors(): void {
    this.errorLog = [];
  }

  public enableDebug(): void {
    this.isDebugEnabled = true;
  }

  public disableDebug(): void {
    this.isDebugEnabled = false;
  }

  // Helper methods for common error scenarios
  public handleFileOperationError(operation: string, path: string, error: Error): void {
    this.handleError({
      message: `Failed to ${operation} file: ${path}`,
      severity: ErrorSeverity.HIGH,
      context: { operation, path },
      error,
      shouldNotify: true
    });
  }

  public handleAPIError(endpoint: string, error: Error): void {
    this.handleError({
      message: `API request failed: ${endpoint}`,
      severity: ErrorSeverity.MEDIUM,
      context: { endpoint },
      error,
      shouldNotify: false
    });
  }

  public handleProcessingError(fileName: string, error: Error): void {
    this.handleError({
      message: `Error processing file: ${fileName}`,
      severity: ErrorSeverity.HIGH,
      context: { fileName },
      error,
      shouldNotify: true
    });
  }
}

// Helper function to wrap async operations with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorDetails: Omit<ErrorDetails, 'error'>
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    ErrorService.getInstance().handleError({
      ...errorDetails,
      error: error as Error
    });
    return null;
  }
} 