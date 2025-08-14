/**
 * Centralized error handling system for SkillForge AI
 */

import { logger } from './logger';
import type { 
  Result, 
  Success, 
  Failure, 
  SkillForgeError, 
  ValidationError, 
  NetworkError, 
  FirebaseError
} from './types';
import { createSuccess, createFailure } from './types';

export class ErrorHandler {
  /**
   * Wraps async operations with error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<Result<T, SkillForgeError>> {
    try {
      const result = await operation();
      return createSuccess(result);
    } catch (error) {
      const skillForgeError = this.normalizeError(error, context);
      logger.error(`Error in ${context}`, {
        action: 'error_handler_catch',
        context,
        error: skillForgeError
      });
      return createFailure(skillForgeError);
    }
  }

  /**
   * Wraps sync operations with error handling
   */
  static withSyncErrorHandling<T>(
    operation: () => T,
    context: string
  ): Result<T, SkillForgeError> {
    try {
      const result = operation();
      return createSuccess(result);
    } catch (error) {
      const skillForgeError = this.normalizeError(error, context);
      logger.error(`Sync error in ${context}`, {
        action: 'sync_error_handler_catch',
        context,
        error: skillForgeError
      });
      return createFailure(skillForgeError);
    }
  }

  /**
   * Normalizes different error types into SkillForgeError
   */
  private static normalizeError(error: unknown, context: string): SkillForgeError {
    // Firebase errors
    if (this.isFirebaseError(error)) {
      return {
        code: 'FIREBASE_ERROR',
        message: error.message || 'Firebase operation failed',
        firebaseCode: error.code,
        details: { context, originalError: error }
      } as FirebaseError;
    }

    // Network errors
    if (this.isNetworkError(error)) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network operation failed',
        statusCode: error.status,
        details: { context, originalError: error }
      } as NetworkError;
    }

    // Validation errors
    if (this.isValidationError(error)) {
      return {
        code: 'VALIDATION_ERROR',
        message: error.message || 'Validation failed',
        field: error.field || 'unknown',
        value: error.value,
        details: { context, originalError: error }
      } as ValidationError;
    }

    // Generic Error objects
    if (error instanceof Error) {
      return {
        code: 'GENERIC_ERROR',
        message: error.message,
        details: { 
          context, 
          stack: error.stack,
          originalError: error 
        }
      };
    }

    // Unknown error types
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: { 
        context, 
        originalError: error,
        errorType: typeof error
      }
    };
  }

  /**
   * Type guards for different error types
   */
  private static isFirebaseError(error: unknown): error is { code: string; message: string } {
    return typeof error === 'object' && 
           error !== null && 
           'code' in error && 
           typeof (error as any).code === 'string' &&
           (error as any).code.includes('firebase');
  }

  private static isNetworkError(error: unknown): error is { status: number; message: string } {
    return typeof error === 'object' && 
           error !== null && 
           'status' in error &&
           typeof (error as any).status === 'number';
  }

  private static isValidationError(error: unknown): error is { field: string; value: unknown; message: string } {
    return typeof error === 'object' && 
           error !== null && 
           'field' in error &&
           typeof (error as any).field === 'string';
  }

  /**
   * Creates specific error types
   */
  static createValidationError(field: string, value: unknown, message: string): ValidationError {
    return {
      code: 'VALIDATION_ERROR',
      message,
      field,
      value,
      details: {}
    };
  }

  static createNetworkError(statusCode: number, message: string): NetworkError {
    return {
      code: 'NETWORK_ERROR',
      message,
      statusCode,
      details: {}
    };
  }

  static createFirebaseError(firebaseCode: string, message: string): FirebaseError {
    return {
      code: 'FIREBASE_ERROR',
      message,
      firebaseCode,
      details: {}
    };
  }

  /**
   * Handles React component errors
   */
  static handleComponentError(error: Error, errorInfo: { componentStack: string }): void {
    logger.error('React component error', {
      action: 'component_error',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error reporting service (e.g., Sentry)
    }
  }
}

/**
 * Utility function for handling results
 */
export function handleResult<T, E = SkillForgeError>(
  result: Result<T, E>,
  onSuccess: (data: T) => void,
  onError: (error: E) => void
): void {
  if (result.success) {
    onSuccess(result.data);
  } else {
    onError(result.error);
  }
}

/**
 * Utility function to unwrap results with default values
 */
export function unwrapResult<T, E = SkillForgeError>(
  result: Result<T, E>,
  defaultValue: T
): T {
  return result.success ? result.data : defaultValue;
}

/**
 * Retry decorator for operations that might fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: number;
    context?: string;
  } = {}
): Promise<T> {
  const { 
    maxRetries = 3, 
    delay = 1000, 
    backoff = 2, 
    context = 'unknown operation' 
  } = options;

  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        logger.error(`Operation failed after ${maxRetries + 1} attempts`, {
          action: 'retry_exhausted',
          context,
          attempts: attempt + 1,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }

      const currentDelay = delay * Math.pow(backoff, attempt);
      logger.warn(`Retrying operation (attempt ${attempt + 1}/${maxRetries + 1})`, {
        action: 'retry_attempt',
        context,
        attempt: attempt + 1,
        delay: currentDelay,
        error: error instanceof Error ? error.message : String(error)
      });

      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }

  throw lastError;
}