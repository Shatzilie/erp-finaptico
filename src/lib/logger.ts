/**
 * Centralized logging utility
 * Suppresses logs in production builds
 */

const IS_PRODUCTION = import.meta.env.PROD;
const IS_DEV = import.meta.env.DEV;

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  component?: string;
  action?: string;
  [key: string]: unknown;
}

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (IS_PRODUCTION) {
      // In production, only show errors and warnings
      return level === 'error' || level === 'warn';
    }
    return true;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  log(message: string, context?: LogContext) {
    if (this.shouldLog('log')) {
      console.log(this.formatMessage('log', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
      if (error) {
        console.error(error);
      }
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog('debug') && IS_DEV) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }
}

export const logger = new Logger();
