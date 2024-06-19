// logger.js
const logLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class Logger {
  constructor(level = logLevel.ERROR) {
    this.level = level;
  }

  setLevel(level) {
    this.level = level;
  }

  error(...args) {
    if (this.level >= logLevel.ERROR) {
      console.error(...args);
    }
  }

  warn(...args) {
    if (this.level >= logLevel.WARN) {
      console.warn(...args);
    }
  }

  info(...args) {
    if (this.level >= logLevel.INFO) {
      console.info(...args);
    }
  }

  debug(...args) {
    if (this.level >= logLevel.DEBUG) {
      console.debug(...args);
    }
  }
}

// Create a logger instance
const isDev = !("update_url" in chrome.runtime.getManifest());
const logger = new Logger(isDev ? logLevel.DEBUG : logLevel.ERROR);
