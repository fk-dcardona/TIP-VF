/**
 * 📝 Logger Utility
 * SuperClaude Optimized for Production
 * 
 * Features:
 * - Structured logging
 * - Environment-aware
 * - Performance tracking
 * - Error context preservation
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.logLevel];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const baseLog = {
      timestamp,
      level,
      message,
      ...context,
    };

    if (this.isDevelopment) {
      // Pretty print in development
      const emoji = this.getEmoji(level);
      const color = this.getColor(level);
      
      let output = `${emoji} ${timestamp} [${level.toUpperCase()}] ${message}`;
      if (context && Object.keys(context).length > 0) {
        output += '\n' + JSON.stringify(context, null, 2);
      }
      
      return color + output + '\x1b[0m'; // Reset color
    }

    // JSON format for production
    return JSON.stringify(baseLog);
  }

  private getEmoji(level: LogLevel): string {
    const emojis = {
      debug: '🐛',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      fatal: '💀',
    };
    return emojis[level];
  }

  private getColor(level: LogLevel): string {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[37m',  // White
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      fatal: '\x1b[35m', // Magenta
    };
    return colors[level];
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);
    
    switch (level) {
      case 'debug':
      case 'info':
        console.log(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
      case 'fatal':
        console.error(formattedMessage);
        break;
    }

    // Send to external service in production
    if (!this.isDevelopment && ['error', 'fatal'].includes(level)) {
      this.sendToErrorTracking(level, message, context);
    }
  }

  private sendToErrorTracking(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): void {
    // Integration with Sentry or similar service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(message, {
        level: level === 'fatal' ? 'fatal' : 'error',
        extra: context,
      });
    }
  }

  // Public methods
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = { ...context };
    
    if (error instanceof Error) {
      errorContext.errorName = error.name;
      errorContext.errorMessage = error.message;
      errorContext.errorStack = error.stack;
    } else if (error) {
      errorContext.error = error;
    }
    
    this.log('error', message, errorContext);
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = { ...context };
    
    if (error instanceof Error) {
      errorContext.errorName = error.name;
      errorContext.errorMessage = error.message;
      errorContext.errorStack = error.stack;
    } else if (error) {
      errorContext.error = error;
    }
    
    this.log('fatal', message, errorContext);
  }

  // Performance tracking
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // Measure function execution time
  async measure<T>(
    label: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      this.info(`${label} completed`, {
        ...context,
        durationMs: duration,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      this.error(`${label} failed`, error, {
        ...context,
        durationMs: duration,
      });
      
      throw error;
    }
  }

  // Create child logger with context
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    const originalLog = childLogger.log.bind(childLogger);
    
    childLogger.log = (level: LogLevel, message: string, ctx?: LogContext) => {
      originalLog(level, message, { ...context, ...ctx });
    };
    
    return childLogger;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export specific loggers for different modules
export const dbLogger = logger.child({ module: 'database' });
export const apiLogger = logger.child({ module: 'api' });
export const aiLogger = logger.child({ module: 'ai' });
export const alertLogger = logger.child({ module: 'alerts' });