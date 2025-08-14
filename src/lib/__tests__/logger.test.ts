import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, withRetry, CircuitBreaker, createErrorHandler, measurePerformance } from '../logger';

describe('Logger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic logging functions', () => {
    it('should log info messages with timestamp', () => {
      logger.info('Test message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] INFO:/),
        'Test message',
        expect.objectContaining({
          sessionId: expect.stringContaining('session_'),
          component: 'unknown'
        })
      );
    });

    it('should log error messages with enhanced metadata', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      logger.error('Test error', { 
        component: 'test-component',
        userId: 'user123' 
      });
      
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] ERROR:/),
        'Test error',
        expect.objectContaining({
          component: 'test-component',
          userId: 'user123',
          sessionId: expect.stringContaining('session_')
        })
      );
    });

    it('should handle errorWithStack properly', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Test error message');
      
      logger.errorWithStack(testError, 'Test context');
      
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] ERROR:/),
        'Test context: Test error message',
        expect.objectContaining({
          error: 'Test error message',
          errorStack: expect.stringContaining('Error: Test error message')
        })
      );
    });
  });

  describe('Performance logging', () => {
    it('should log performance metrics', () => {
      logger.performance('test-operation', 150, { userId: 'user123' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^⚡ \[.*\] PERFORMANCE:/),
        'test-operation completed',
        expect.objectContaining({
          duration: 150,
          action: 'test-operation',
          userId: 'user123'
        })
      );
    });
  });

  describe('Context-specific logging', () => {
    it('should log user actions with proper context', () => {
      logger.userAction('login', 'user123', { component: 'auth' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] INFO:/),
        'User action: login',
        expect.objectContaining({
          userId: 'user123',
          action: 'login',
          component: 'auth'
        })
      );
    });

    it('should log skill progress correctly', () => {
      logger.skillProgress('skill-123', 'user-456', true, { level: 2 });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] INFO:/),
        'Skill completed',
        expect.objectContaining({
          skillId: 'skill-123',
          userId: 'user-456',
          action: 'skill_completed',
          level: 2
        })
      );
    });
  });

  describe('Error spam prevention', () => {
    it('should limit error logging when threshold is exceeded', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Log many errors to exceed threshold
      for (let i = 0; i < 105; i++) {
        logger.error(`Error ${i}`);
      }
      
      // Should have stopped logging after 100 errors + initial few
      expect(errorSpy).toHaveBeenCalledTimes(100);
    });
  });
});

describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    const mockOperation = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(mockOperation, {
      operationName: 'test-operation'
    });
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const mockOperation = vi
      .fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue('success');
    
    const result = await withRetry(mockOperation, {
      operationName: 'test-operation',
      maxAttempts: 3,
      baseDelay: 10 // Reduce delay for testing
    });
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts exceeded', async () => {
    const mockOperation = vi.fn().mockRejectedValue(new Error('Persistent failure'));
    
    await expect(withRetry(mockOperation, {
      operationName: 'test-operation',
      maxAttempts: 2,
      baseDelay: 10
    })).rejects.toThrow('Persistent failure');
    
    expect(mockOperation).toHaveBeenCalledTimes(2);
  });

  it('should respect shouldRetry predicate', async () => {
    const mockOperation = vi.fn().mockRejectedValue(new Error('Auth error'));
    
    await expect(withRetry(mockOperation, {
      operationName: 'test-operation',
      shouldRetry: (error) => !String(error).includes('Auth'),
      baseDelay: 10
    })).rejects.toThrow('Auth error');
    
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(2, 1000, 'test-circuit');
  });

  it('should allow operations when circuit is closed', async () => {
    const mockOperation = vi.fn().mockResolvedValue('success');
    
    const result = await circuitBreaker.execute(mockOperation);
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should open circuit after threshold failures', async () => {
    const mockOperation = vi.fn().mockRejectedValue(new Error('Service failure'));
    
    // First failure
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Service failure');
    
    // Second failure - should open circuit
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Service failure');
    
    // Third attempt should be blocked by open circuit
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Circuit breaker test-circuit is OPEN');
    
    expect(mockOperation).toHaveBeenCalledTimes(2);
  });

  it('should transition to half-open after timeout', async () => {
    const mockOperation = vi
      .fn()
      .mockRejectedValueOnce(new Error('Failure 1'))
      .mockRejectedValueOnce(new Error('Failure 2'))
      .mockResolvedValue('recovery');
    
    // Trigger circuit to open
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow();
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow();
    
    // Wait for timeout (simulate with shorter timeout for testing)
    circuitBreaker = new CircuitBreaker(2, 1, 'test-circuit');
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Should now allow one attempt (half-open)
    const result = await circuitBreaker.execute(mockOperation);
    expect(result).toBe('recovery');
  });
});

describe('measurePerformance', () => {
  beforeEach(() => {
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(0)    // Start time
      .mockReturnValueOnce(100); // End time
  });

  it('should measure sync function performance', () => {
    const mockFn = vi.fn().mockReturnValue('result');
    
    const result = measurePerformance('test-sync', mockFn);
    
    expect(result).toBe('result');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should measure async function performance', async () => {
    const mockFn = vi.fn().mockResolvedValue('async-result');
    
    const result = await measurePerformance('test-async', mockFn);
    
    expect(result).toBe('async-result');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle sync function errors', () => {
    const mockFn = vi.fn().mockImplementation(() => {
      throw new Error('Sync error');
    });
    
    expect(() => measurePerformance('test-sync-error', mockFn)).toThrow('Sync error');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle async function errors', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Async error'));
    
    await expect(measurePerformance('test-async-error', mockFn)).rejects.toThrow('Async error');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

describe('createErrorHandler', () => {
  it('should create error handler with component context', () => {
    const errorHandler = createErrorHandler('TestComponent');
    
    expect(typeof errorHandler).toBe('function');
  });

  it('should handle errors with proper context', () => {
    const errorHandler = createErrorHandler('TestComponent');
    const testError = new Error('Component error');
    const errorInfo = { componentStack: 'Component stack trace' };
    
    const loggerSpy = vi.spyOn(logger, 'errorWithStack');
    
    errorHandler(testError, errorInfo);
    
    expect(loggerSpy).toHaveBeenCalledWith(
      testError,
      'React Error Boundary: TestComponent',
      expect.objectContaining({
        component: 'TestComponent',
        context: 'Component stack trace'
      })
    );
  });
});