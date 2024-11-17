export interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  details?: any;
}

class LoggerService {
  private logs: LogEntry[] = [];
  private isEnabled = false;

  configure(enabled: boolean) {
    this.isEnabled = enabled;
  }


  info(...messages: any[]) {
    console.info(...messages);
  }

  error(...messages: any[]) {
    console.error(...messages);
  }

  warn(...messages: any[]) {
    console.warn(...messages);
  }

  debug(...messages: any[]) {
    console.debug(...messages);
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new LoggerService(); 