export interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  details?: any;
}

class LoggerService {
  private logs: LogEntry[] = [];
  private isEnabled = false;
  private maxLogs = 1000;

  configure(enabled: boolean) {
    this.isEnabled = enabled;
  }

  private addLog(level: LogEntry['level'], message: string, details?: any) {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level,
      message,
      details: details ? JSON.stringify(details) : undefined
    };

    const consoleArgs = [`[${timestamp}] ${message}`, details].filter(Boolean);
    
    switch (level) {
      case 'info':
        console.info(...consoleArgs);
        break;
      case 'error':
        console.error(...consoleArgs);
        break;
      case 'warn':
        console.warn(...consoleArgs);
        break;
      case 'debug':
        console.debug(...consoleArgs);
        break;
    }

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  info(message: string, details?: any) {
    this.addLog('info', message, details);
  }

  error(message: string, details?: any) {
    this.addLog('error', message, details);
  }

  warn(message: string, details?: any) {
    this.addLog('warn', message, details);
  }

  debug(message: string, details?: any) {
    this.addLog('debug', message, details);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  exportToCSV(): string {
    const headers = ['Timestamp', 'Level', 'Message', 'Details'];
    const rows = this.logs.map(log => [
      log.timestamp,
      log.level,
      log.message,
      log.details || ''
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  getStatus(): { enabled: boolean; logsCount: number } {
    return {
      enabled: this.isEnabled,
      logsCount: this.logs.length
    };
  }
}

export const logger = new LoggerService(); 