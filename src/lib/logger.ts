/**
 * Structured Logging Service for SkillForge AI
 * Provides consistent, contextual logging with environment-aware output
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'performance';

export interface LogMeta {
  userId?: string;
  skillId?: string;
  action?: string;
  duration?: number;
  error?: string;
  skillCount?: number;
  context?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: LogMeta;
  environment: 'development' | 'production';
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  private formatMessage(level: LogLevel, message: string, meta?: LogMeta): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
      environment: this.isDevelopment ? 'development' : 'production'
    };
  }

  private output(entry: LogEntry): void {
    if (!this.isClient && !this.isDevelopment) {
      // In production server-side, you might want to send to external logging service
      return;
    }

    const { level, message, meta } = entry;
    const prefix = `[${entry.timestamp}] ${level.toUpperCase()}:`;

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(prefix, message, meta || '');
        }
        break;
      case 'info':
        console.info(prefix, message, meta || '');
        break;
      case 'warn':
        console.warn(prefix, message, meta || '');
        break;
      case 'error':
        console.error(prefix, message, meta || '');
        break;
      case 'performance':
        if (this.isDevelopment) {
          console.log(`⚡ ${prefix}`, message, meta || '');
        }
        break;
    }
  }

  debug(message: string, meta?: LogMeta): void {
    this.output(this.formatMessage('debug', message, meta));
  }

  info(message: string, meta?: LogMeta): void {
    this.output(this.formatMessage('info', message, meta));
  }

  warn(message: string, meta?: LogMeta): void {
    this.output(this.formatMessage('warn', message, meta));
  }

  error(message: string, meta?: LogMeta): void {
    this.output(this.formatMessage('error', message, meta));
  }

  performance(operation: string, duration: number, meta?: Omit<LogMeta, 'duration'>): void {
    this.output(this.formatMessage('performance', `${operation} completed`, {
      ...meta,
      duration,
      action: operation
    }));
  }

  // Context-specific logging helpers
  userAction(action: string, userId: string, meta?: Omit<LogMeta, 'userId' | 'action'>): void {
    this.info(`User action: ${action}`, { userId, action, ...meta });
  }

  skillProgress(skillId: string, userId: string, completed: boolean, meta?: LogMeta): void {
    this.info(`Skill ${completed ? 'completed' : 'attempted'}`, {
      skillId,
      userId,
      action: completed ? 'skill_completed' : 'skill_attempted',
      ...meta
    });
  }

  aiOperation(operation: string, success: boolean, duration?: number, meta?: LogMeta): void {
    const level = success ? 'info' : 'error';
    this[level](`AI operation: ${operation} ${success ? 'succeeded' : 'failed'}`, {
      action: operation,
      duration,
      ...meta
    });
  }

  firebase(operation: string, success: boolean, meta?: LogMeta): void {
    const level = success ? 'debug' : 'error';
    this[level](`Firebase ${operation} ${success ? 'succeeded' : 'failed'}`, {
      action: operation,
      ...meta
    });
  }
}

export const logger = new Logger();

// Performance measurement helper
export const measurePerformance = <T>(
  operation: string,
  fn: () => T | Promise<T>,
  meta?: Omit<LogMeta, 'duration'>
): T | Promise<T> => {
  const start = performance.now();
  
  const finish = (result: T) => {
    const duration = performance.now() - start;
    logger.performance(operation, duration, meta);
    return result;
  };

  try {
    const result = fn();
    
    // Handle both sync and async operations
    if (result instanceof Promise) {
      return result.then(finish).catch(error => {
        const duration = performance.now() - start;
        logger.error(`${operation} failed`, { 
          duration, 
          error: error.message,
          ...meta 
        });
        throw error;
      });
    }
    
    return finish(result);
  } catch (error: any) {
    const duration = performance.now() - start;
    logger.error(`${operation} failed`, { 
      duration, 
      error: error.message,
      ...meta 
    });
    throw error;
  }
};