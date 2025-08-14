/**
 * Request Optimization Service
 * Optimizes repetitive POST requests with intelligent batching, caching, and deduplication
 */

import { logger } from './logger';

interface RequestConfig {
  method: string;
  url: string;
  body?: any;
  headers?: Record<string, string>;
}

interface PendingRequest {
  config: RequestConfig;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  id: string;
}

interface RequestStats {
  totalRequests: number;
  batchedRequests: number;
  cachedRequests: number;
  duplicatesAvoided: number;
  averageResponseTime: number;
  peakResponseTime: number;
  batchEfficiencyRate: number;
}

class RequestOptimizer {
  private pendingRequests = new Map<string, PendingRequest[]>();
  private cache = new Map<string, { data: any; expires: number }>();
  private batchTimeouts = new Map<string, NodeJS.Timeout>();
  private stats: RequestStats = {
    totalRequests: 0,
    batchedRequests: 0,
    cachedRequests: 0,
    duplicatesAvoided: 0,
    averageResponseTime: 0,
    peakResponseTime: 0,
    batchEfficiencyRate: 0
  };
  
  private readonly batchDelay = 50; // ms - batch requests within 50ms
  private readonly cacheMaxAge = 300000; // 5 minutes
  private readonly maxBatchSize = 10; // Max requests per batch
  private responseTimes: number[] = [];

  /**
   * Optimize a request with intelligent batching, caching, and deduplication
   */
  async optimizeRequest<T>(config: RequestConfig): Promise<T> {
    this.stats.totalRequests++;
    const requestKey = this.getRequestKey(config);
    const requestId = this.generateRequestId();

    // Check cache first
    const cached = this.getFromCache(requestKey);
    if (cached) {
      this.stats.cachedRequests++;
      logger.info('Request served from cache', {
        action: 'request_cache_hit',
        url: config.url,
        method: config.method
      });
      return cached;
    }

    return new Promise<T>((resolve, reject) => {
      const pendingRequest: PendingRequest = {
        config,
        resolve,
        reject,
        timestamp: Date.now(),
        id: requestId
      };

      // Check for duplicate requests
      const existingRequests = this.pendingRequests.get(requestKey);
      if (existingRequests) {
        // Add to existing batch
        existingRequests.push(pendingRequest);
        this.stats.duplicatesAvoided++;
        
        logger.info('Request added to existing batch', {
          action: 'request_batch_add',
          url: config.url,
          batchSize: existingRequests.length,
          requestId
        });
      } else {
        // Start new batch
        this.pendingRequests.set(requestKey, [pendingRequest]);
        this.scheduleBatchExecution(requestKey);
      }
    });
  }

  private getRequestKey(config: RequestConfig): string {
    // Create a unique key for caching and batching similar requests
    const bodyHash = config.body ? this.simpleHash(JSON.stringify(config.body)) : 'no-body';
    return `${config.method}:${config.url}:${bodyHash}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    // Implement intelligent TTL based on request type
    const ttl = this.getSmartTTL(key);
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }

  private getSmartTTL(key: string): number {
    // Different TTL strategies based on request type
    if (key.includes('/api/quiz')) {
      return 600000; // 10 minutes for quiz data
    }
    if (key.includes('/api/achievements')) {
      return 300000; // 5 minutes for achievements
    }
    if (key.includes('/api/leaderboard')) {
      return 120000; // 2 minutes for leaderboard
    }
    if (key.includes('/api/progress')) {
      return 60000; // 1 minute for progress
    }
    return this.cacheMaxAge; // Default 5 minutes
  }

  private scheduleBatchExecution(requestKey: string): void {
    // Clear existing timeout if any
    const existingTimeout = this.batchTimeouts.get(requestKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule batch execution
    const timeout = setTimeout(() => {
      this.executeBatch(requestKey);
    }, this.batchDelay);

    this.batchTimeouts.set(requestKey, timeout);

    // Execute immediately if batch is full
    const requests = this.pendingRequests.get(requestKey);
    if (requests && requests.length >= this.maxBatchSize) {
      clearTimeout(timeout);
      this.batchTimeouts.delete(requestKey);
      this.executeBatch(requestKey);
    }
  }

  private async executeBatch(requestKey: string): Promise<void> {
    const requests = this.pendingRequests.get(requestKey);
    if (!requests || requests.length === 0) return;

    // Remove from pending
    this.pendingRequests.delete(requestKey);
    this.batchTimeouts.delete(requestKey);

    const startTime = performance.now();
    
    logger.info('Executing request batch', {
      action: 'request_batch_execute',
      requestKey,
      batchSize: requests.length,
      requestIds: requests.map(r => r.id)
    });

    try {
      // For this implementation, we execute the first request and share the result
      // In a real implementation, you might want to batch multiple requests into one API call
      const sampleRequest = requests[0];
      const response = await this.executeRequest(sampleRequest.config);
      
      const responseTime = performance.now() - startTime;
      this.updateResponseTimeStats(responseTime);

      // Cache the result
      this.setCache(requestKey, response);

      // Resolve all pending requests with the same result
      requests.forEach(request => {
        request.resolve(response);
      });

      this.stats.batchedRequests += requests.length;
      this.updateBatchEfficiency();

      logger.info('Request batch completed successfully', {
        action: 'request_batch_success',
        requestKey,
        batchSize: requests.length,
        responseTime
      });

    } catch (error) {
      // Reject all pending requests
      requests.forEach(request => {
        request.reject(error);
      });

      logger.error('Request batch failed', {
        action: 'request_batch_failed',
        requestKey,
        batchSize: requests.length,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async executeRequest(config: RequestConfig): Promise<any> {
    const { method, url, body, headers } = config;
    
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body && method !== 'GET') {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private updateResponseTimeStats(responseTime: number): void {
    this.responseTimes.push(responseTime);
    
    // Keep only last 100 response times for memory efficiency
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100);
    }

    this.stats.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
    
    this.stats.peakResponseTime = Math.max(this.stats.peakResponseTime, responseTime);
  }

  private updateBatchEfficiency(): void {
    const totalOptimized = this.stats.batchedRequests + this.stats.cachedRequests;
    this.stats.batchEfficiencyRate = 
      this.stats.totalRequests > 0 ? (totalOptimized / this.stats.totalRequests) * 100 : 0;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get optimization statistics
   */
  getStats(): RequestStats & {
    cacheSize: number;
    pendingBatches: number;
  } {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      pendingBatches: this.pendingRequests.size
    };
  }

  /**
   * Clear cache and reset stats
   */
  reset(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    
    // Clear all timeouts
    this.batchTimeouts.forEach(timeout => clearTimeout(timeout));
    this.batchTimeouts.clear();

    this.stats = {
      totalRequests: 0,
      batchedRequests: 0,
      cachedRequests: 0,
      duplicatesAvoided: 0,
      averageResponseTime: 0,
      peakResponseTime: 0,
      batchEfficiencyRate: 0
    };
    
    this.responseTimes = [];
  }

  /**
   * Generate performance recommendations based on current stats
   */
  getRecommendations(): string[] {
    const recommendations = [];

    if (this.stats.averageResponseTime > 500) {
      recommendations.push('Consider implementing server-side request caching');
      recommendations.push('Investigate backend performance bottlenecks');
    }

    if (this.stats.batchEfficiencyRate < 50) {
      recommendations.push('Increase batch delay to capture more duplicate requests');
      recommendations.push('Implement more aggressive request deduplication');
    }

    if (this.cache.size > 1000) {
      recommendations.push('Implement cache size limits and LRU eviction');
      recommendations.push('Reduce cache TTL for less critical data');
    }

    if (this.stats.duplicatesAvoided / this.stats.totalRequests > 0.3) {
      recommendations.push('Consider implementing request cancellation for outdated requests');
      recommendations.push('Review client-side logic to reduce duplicate requests');
    }

    return recommendations;
  }

  /**
   * Cleanup method for proper resource management
   */
  cleanup(): void {
    this.batchTimeouts.forEach(timeout => clearTimeout(timeout));
    this.batchTimeouts.clear();
    this.pendingRequests.clear();
  }
}

// Global instance
export const requestOptimizer = new RequestOptimizer();

// React hook for optimized API requests
export function useOptimizedRequest() {
  return {
    post: <T>(url: string, data?: any, headers?: Record<string, string>) => 
      requestOptimizer.optimizeRequest<T>({
        method: 'POST',
        url,
        body: data,
        headers
      }),
    
    get: <T>(url: string, headers?: Record<string, string>) => 
      requestOptimizer.optimizeRequest<T>({
        method: 'GET', 
        url,
        headers
      }),

    getStats: () => requestOptimizer.getStats(),
    getRecommendations: () => requestOptimizer.getRecommendations()
  };
}

export { RequestOptimizer };