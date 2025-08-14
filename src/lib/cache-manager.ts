/**
 * SkillForge AI - Cache Manager
 * Intelligent caching system with TTL support and memory management
 */

import { logger } from './logger';

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface CacheManagerInterface {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): boolean;
  clear(): void;
  has(key: string): boolean;
  getStats(): CacheStats;
  cleanup(): void;
  invalidateByPrefix(prefix: string): number;
  getSize(): number;
}

class CacheManager implements CacheManagerInterface {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxEntries = 1000;
  private cleanupInterval = 60 * 1000; // 1 minute
  private stats = {
    hits: 0,
    misses: 0
  };

  constructor() {
    // Start periodic cleanup
    this.startPeriodicCleanup();
    
    // Setup memory monitoring
    this.setupMemoryMonitoring();
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      logger.debug('Cache miss', { key, cacheHit: false });
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      logger.debug('Cache expired', { key, age: now - entry.timestamp, ttl: entry.ttl });
      return null;
    }

    // Update access statistics
    entry.hits++;
    entry.lastAccessed = now;
    this.stats.hits++;

    logger.debug('Cache hit', { 
      key, 
      cacheHit: true, 
      hits: entry.hits,
      age: now - entry.timestamp
    });

    return entry.data as T;
  }

  /**
   * Set a value in cache with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.defaultTTL;

    // Check if we need to make room
    if (this.cache.size >= this.maxEntries) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: now,
      ttl: entryTTL,
      hits: 0,
      lastAccessed: now
    };

    this.cache.set(key, entry);

    logger.debug('Cache set', { 
      key, 
      ttl: entryTTL,
      cacheSize: this.cache.size,
      dataAge: 0
    });
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    
    if (existed) {
      logger.debug('Cache delete', { key, cacheInvalidated: true });
    }
    
    return existed;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const previousSize = this.cache.size;
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    
    logger.info('Cache cleared', { 
      entriesRemoved: previousSize,
      cacheInvalidated: true
    });
  }

  /**
   * Check if key exists in cache (without updating access stats)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const now = Date.now();
    let oldestTimestamp = now;
    let newestTimestamp = 0;
    let totalMemory = 0;

    for (const [key, entry] of this.cache.entries()) {
      oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
      newestTimestamp = Math.max(newestTimestamp, entry.timestamp);
      
      // Rough memory calculation
      totalMemory += JSON.stringify(entry.data).length + key.length + 100; // overhead
    }

    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      totalEntries: this.cache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: totalMemory,
      oldestEntry: oldestTimestamp,
      newestEntry: newestTimestamp
    };
  }

  /**
   * Manual cleanup of expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug('Cache cleanup completed', { 
        removedEntries: removedCount,
        remainingEntries: this.cache.size,
        cacheInvalidated: removedCount > 0
      });
    }
  }

  /**
   * Invalidate all keys with a given prefix
   */
  invalidateByPrefix(prefix: string): number {
    let removedCount = 0;

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.info('Cache prefix invalidation', { 
        prefix, 
        removedEntries: removedCount,
        cacheInvalidated: true
      });
    }

    return removedCount;
  }

  /**
   * Get current cache size
   */
  getSize(): number {
    return this.cache.size;
  }

  /**
   * Get cache entries for debugging
   */
  getEntries(): Array<{ key: string; entry: CacheEntry }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({ key, entry }));
  }

  /**
   * Set maximum number of cache entries
   */
  setMaxEntries(max: number): void {
    this.maxEntries = max;
    
    // Trim cache if necessary
    while (this.cache.size > this.maxEntries) {
      this.evictLeastRecentlyUsed();
    }
  }

  /**
   * Set default TTL for cache entries
   */
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }

  /**
   * Warm cache with preloaded data
   */
  warm<T>(entries: Array<{ key: string; value: T; ttl?: number }>): void {
    entries.forEach(({ key, value, ttl }) => {
      this.set(key, value, ttl);
    });

    logger.info('Cache warmed', { 
      entriesAdded: entries.length,
      totalEntries: this.cache.size
    });
  }

  // Private methods

  private evictLeastRecentlyUsed(): void {
    let lruKey = '';
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      logger.debug('Cache LRU eviction', { 
        evictedKey: lruKey, 
        lastAccessed: lruTime,
        cacheInvalidated: true
      });
    }
  }

  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  private setupMemoryMonitoring(): void {
    // Log cache stats periodically
    setInterval(() => {
      const stats = this.getStats();
      
      if (stats.totalEntries > 0) {
        logger.debug('Cache statistics', {
          entries: stats.totalEntries,
          hitRate: stats.hitRate,
          memoryKB: Math.round(stats.memoryUsage / 1024),
          cacheHits: stats.totalHits,
          cacheMisses: stats.totalMisses
        });
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}

// Create and export singleton instance
export const cacheManager = new CacheManager();

// Enhanced cache utilities
export class SmartCache {
  private cacheManager: CacheManager;
  private keyPrefix: string;

  constructor(prefix: string, cacheManager: CacheManager) {
    this.keyPrefix = prefix;
    this.cacheManager = cacheManager;
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  get<T>(key: string): T | null {
    return this.cacheManager.get<T>(this.getKey(key));
  }

  set<T>(key: string, value: T, ttl?: number): void {
    this.cacheManager.set(this.getKey(key), value, ttl);
  }

  delete(key: string): boolean {
    return this.cacheManager.delete(this.getKey(key));
  }

  has(key: string): boolean {
    return this.cacheManager.has(this.getKey(key));
  }

  clear(): number {
    return this.cacheManager.invalidateByPrefix(this.keyPrefix);
  }

  /**
   * Memoize function results with caching
   */
  memoize<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    keyGenerator: (...args: TArgs) => string,
    ttl?: number
  ) {
    return async (...args: TArgs): Promise<TReturn> => {
      const key = keyGenerator(...args);
      
      // Check cache first
      const cached = this.get<TReturn>(key);
      if (cached !== null) {
        return cached;
      }

      // Execute function and cache result
      const result = await fn(...args);
      this.set(key, result, ttl);
      
      return result;
    };
  }

  /**
   * Cache with refresh-ahead pattern
   */
  async getWithRefresh<T>(
    key: string,
    refreshFn: () => Promise<T>,
    ttl?: number,
    refreshThreshold = 0.8
  ): Promise<T> {
    const fullKey = this.getKey(key);
    const entry = this.cacheManager.cache.get(fullKey);
    
    if (entry) {
      const age = Date.now() - entry.timestamp;
      const ageRatio = age / entry.ttl;
      
      // If data is getting old, refresh in background
      if (ageRatio > refreshThreshold) {
        refreshFn().then(newData => {
          this.set(key, newData, ttl);
        }).catch(error => {
          logger.error('Background cache refresh failed', { key, error });
        });
      }
      
      return entry.data as T;
    }

    // No cache hit, fetch fresh data
    const freshData = await refreshFn();
    this.set(key, freshData, ttl);
    return freshData;
  }
}

export default cacheManager;