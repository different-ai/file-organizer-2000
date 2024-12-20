class LoggerService {
  private isEnabled = false;

  configure(enabled: boolean) {
    this.isEnabled = enabled;
  }

  info(...messages: any[]) {
    if (!this.isEnabled) return;
    console.info(...messages);
  }

  error(...messages: any[]) {
    if (!this.isEnabled) return;
    console.error(...messages);
  }

  warn(...messages: any[]) {
    if (!this.isEnabled) return;
    console.warn(...messages);
  }

  debug(...messages: any[]) {
    if (!this.isEnabled) return;
    console.debug(...messages);
  }


}

export const logger = new LoggerService(); 