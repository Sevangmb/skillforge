/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascade failures by monitoring service health and providing fallbacks
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Service is failing, use fallback
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Failures before opening circuit
  resetTimeout: number;        // Time to wait before attempting reset (ms)
  monitoringWindow: number;    // Time window for failure counting (ms)
  expectedErrors?: string[];   // Expected error types that don't count as failures
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  totalRequests: number;
  uptime: number; // percentage
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttempt?: Date;
  private totalRequests = 0;
  private readonly config: CircuitBreakerConfig;
  private readonly name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      resetTimeout: config.resetTimeout ?? 60000, // 1 minute
      monitoringWindow: config.monitoringWindow ?? 300000, // 5 minutes
      expectedErrors: config.expectedErrors ?? []
    };
  }

  async execute<T>(operation: () => Promise<T>, fallback?: () => T | Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if circuit should be opened
    if (this.state === CircuitState.CLOSED && this.shouldOpenCircuit()) {
      this.openCircuit();
    }

    // Circuit is open - use fallback or throw error
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        console.log(`Circuit breaker ${this.name}: Attempting reset (HALF_OPEN)`);
      } else {
        if (fallback) {
          console.log(`Circuit breaker ${this.name}: Using fallback (OPEN)`);
          return await Promise.resolve(fallback());
        }
        throw new Error(`Circuit breaker ${this.name} is OPEN - service unavailable`);
      }
    }

    // Execute operation
    try {
      const result = await this.executeWithTimeout(operation);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      
      // If we have a fallback, use it
      if (fallback) {
        console.log(`Circuit breaker ${this.name}: Operation failed, using fallback`);
        return await Promise.resolve(fallback());
      }
      
      throw error;
    }
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>, timeout = 10000): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout')), timeout)
      )
    ]);
  }

  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = new Date();
    
    if (this.state === CircuitState.HALF_OPEN) {
      console.log(`Circuit breaker ${this.name}: Reset successful (CLOSED)`);
      this.reset();
    }
  }

  private onFailure(error: Error): void {
    // Check if this is an expected error that shouldn't count as failure
    if (this.config.expectedErrors?.some(expectedError => 
      error.message.includes(expectedError) || error.name.includes(expectedError)
    )) {
      console.log(`Circuit breaker ${this.name}: Expected error, not counting as failure:`, error.message);
      return;
    }

    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.state === CircuitState.HALF_OPEN) {
      console.log(`Circuit breaker ${this.name}: Half-open test failed, reopening circuit`);
      this.openCircuit();
    }
  }

  private shouldOpenCircuit(): boolean {
    // Only open if we have enough requests to be statistically significant
    if (this.totalRequests < this.config.failureThreshold) {
      return false;
    }

    // Check failure rate within monitoring window
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.config.monitoringWindow);
    
    // If we don't have recent failure data, don't open circuit
    if (!this.lastFailureTime || this.lastFailureTime < windowStart) {
      return false;
    }

    return this.failureCount >= this.config.failureThreshold;
  }

  private shouldAttemptReset(): boolean {
    if (!this.nextAttempt) {
      return false;
    }
    return new Date() >= this.nextAttempt;
  }

  private openCircuit(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = new Date(Date.now() + this.config.resetTimeout);
    console.log(`Circuit breaker ${this.name}: Circuit opened due to failures. Next attempt at:`, this.nextAttempt);
  }

  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.nextAttempt = undefined;
  }

  // Public methods for monitoring
  getStats(): CircuitBreakerStats {
    const totalOperations = this.successCount + this.failureCount;
    const uptime = totalOperations > 0 ? (this.successCount / totalOperations) * 100 : 100;

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      uptime: Math.round(uptime * 100) / 100
    };
  }

  getName(): string {
    return this.name;
  }

  // Force circuit state (for testing)
  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = new Date(Date.now() + this.config.resetTimeout);
  }

  forceClose(): void {
    this.reset();
  }
}

// Retry strategy with exponential backoff
export class RetryStrategy {
  static async withExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Calculate delay with exponential backoff and jitter
        const exponentialDelay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
        const delay = Math.min(exponentialDelay + jitter, maxDelay);
        
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  static async withLinearBackoff<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        const backoffDelay = delay * (attempt + 1);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${backoffDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
    
    throw lastError!;
  }
}

// Global circuit breaker registry
class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  getOrCreate(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  reset(name?: string): void {
    if (name) {
      this.breakers.get(name)?.forceClose();
    } else {
      for (const breaker of this.breakers.values()) {
        breaker.forceClose();
      }
    }
  }
}

export const circuitBreakerRegistry = new CircuitBreakerRegistry();