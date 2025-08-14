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
  errorStack?: string;
  skillCount?: number;
  context?: Record<string, unknown>;
  component?: string;
  operation?: string;
  retryAttempt?: number;
  userAgent?: string;
  sessionId?: string;
  // Additional properties used in APIs
  name?: string;
  topic?: string;
  competenceId?: string;
  questionIndex?: number;
  userLevel?: number;
  learningStyle?: string;
  responseTime?: number;
  language?: string;
  // Additional properties from APIs
  success?: boolean;
  value?: number | string;
  questionLength?: number;
  componentStack?: string;
  attempt?: number;
  
  // Properties from various components and services
  stepId?: string;
  skillName?: string;
  skillsCount?: number;
  prereqs?: string[];
  url?: string;
  requestKey?: string;
  failures?: number;
  attempts?: number;
  delay?: number;
  cacheHit?: boolean;
  circuitBreakerState?: string;
  dataAge?: number;
  updatedFields?: string[];
  count?: number;
  totalUsers?: number;
  maxRetries?: number;
  id?: string;
  categories?: string[];
  isAvailable?: boolean;
  maxLevel?: number;
  isCompleted?: boolean;
  completedSkills?: string[];
  method?: string;
  batchSize?: number;
  cacheInvalidated?: boolean;
  cacheHits?: number;
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
  private sessionId = this.generateSessionId();
  private errorCount = 0;
  private maxErrorsPerSession = 100;

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatMessage(level: LogLevel, message: string, meta?: LogMeta): LogEntry {
    const enrichedMeta: LogMeta = {
      ...meta,
      sessionId: this.sessionId,
      userAgent: this.isClient ? navigator?.userAgent : undefined,
      component: meta?.component || 'unknown',
    };

    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta: enrichedMeta,
      environment: this.isDevelopment ? 'development' : 'production'
    };
  }

  private output(entry: LogEntry): void {
    try {
      // Prevent error spam
      if (entry.level === 'error') {
        this.errorCount++;
        if (this.errorCount > this.maxErrorsPerSession) {
          return;
        }
      }

      if (!this.isClient && !this.isDevelopment) {
        // In production server-side, you might want to send to external logging service
        // For now, we'll still log errors in production for debugging
        if (entry.level === 'error') {
          console.error(`[${entry.timestamp}] ERROR:`, entry.message, entry.meta || '');
        }
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
          // In development, also show stack trace if available
          if (this.isDevelopment && meta?.errorStack) {
            console.error('Stack trace:', meta.errorStack);
          }
          break;
        case 'performance':
          if (this.isDevelopment) {
            console.log(`⚡ ${prefix}`, message, meta || '');
          }
          break;
      }
    } catch (outputError) {
      // Fallback if logging itself fails
      console.error('Logger output failed:', outputError);
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

  // Enhanced error logging with stack trace capture
  errorWithStack(error: Error | unknown, context?: string, meta?: Omit<LogMeta, 'error' | 'errorStack'>): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    this.error(
      context ? `${context}: ${errorMessage}` : errorMessage,
      {
        ...meta,
        error: errorMessage,
        errorStack,
      }
    );
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

// Retry mechanism with exponential backoff
export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    operationName?: string;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    operationName = 'operation',
    shouldRetry = () => true
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        logger.info(`${operationName} succeeded after ${attempt} attempts`);
      }
      return result;
    } catch (error) {
      lastError = error;
      
      logger.warn(`${operationName} failed on attempt ${attempt}`, {
        retryAttempt: attempt,
        error: error instanceof Error ? error.message : String(error),
        operation: operationName,
      });

      if (attempt === maxAttempts || !shouldRetry(error)) {
        logger.errorWithStack(
          error,
          `${operationName} failed after ${attempt} attempts`,
          { retryAttempt: attempt, operation: operationName }
        );
        throw error;
      }

      // Exponential backoff with jitter
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      const jitterDelay = delay + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, jitterDelay));
    }
  }

  throw lastError;
};

// Circuit breaker pattern for error resilience
export class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private name: string = 'circuit'
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime > this.timeout) {
        this.state = 'HALF_OPEN';
        logger.info(`Circuit breaker ${this.name} transitioning to HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
        logger.info(`Circuit breaker ${this.name} recovered, state: CLOSED`);
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailTime = Date.now();

      if (this.failures >= this.threshold) {
        this.state = 'OPEN';
        logger.error(`Circuit breaker ${this.name} opened due to failures`, {
          failures: this.failures,
          threshold: this.threshold,
          operation: this.name,
        });
      }

      throw error;
    }
  }
}

// Error boundary utility for React components
export const createErrorHandler = (componentName: string) => {
  return (error: Error | unknown, errorInfo?: { componentStack?: string }) => {
    logger.errorWithStack(
      error,
      `React Error Boundary: ${componentName}`,
      {
        component: componentName,
        context: errorInfo?.componentStack || 'Unknown component stack',
      }
    );
  };
};