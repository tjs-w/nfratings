enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.ERROR) {
    this.level = level;
  }

  public getLevel(): LogLevel {
    return this.level;
  }

  error(...args: any[]): void {
    if (this.level >= LogLevel.ERROR) {
      console.error("%c" + args[0], "color: red", ...args.slice(1));
    }
  }

  warn(...args: any[]): void {
    if (this.level >= LogLevel.WARN) {
      console.warn("%c" + args[0], "color: orange", ...args.slice(1));
    }
  }

  info(...args: any[]): void {
    if (this.level >= LogLevel.INFO) {
      console.info("%c" + args[0], "color: blue", ...args.slice(1));
    }
  }

  debug(...args: any[]): void {
    if (this.level >= LogLevel.DEBUG) {
      console.debug("%c" + args[0], "color: green", ...args.slice(1));
    }
  }
}

// Create a logger instance
const isDev: boolean = !("update_url" in chrome.runtime.getManifest());
const logger: Logger = new Logger(isDev ? LogLevel.DEBUG : LogLevel.ERROR);

// Attach logger to the global scope
(globalThis as any).logger = logger;
(globalThis as any).LogLevel = LogLevel;
(globalThis as any).Logger = Logger;
