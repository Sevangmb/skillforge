/**
 * Advanced State Management Optimizations
 * Provides sophisticated state management patterns for SkillForge AI
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { create, StoreApi, UseBoundStore } from 'zustand';
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware';
import { logger } from './logger';
import { performanceMonitor } from './performance-monitor';

// ==================== OPTIMIZED SELECTOR PATTERNS ====================

/**
 * Creates a memoized selector with automatic dependency tracking
 */
export function createMemoizedSelector<T, R>(
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) {
  const memoizedSelector = (state: T) => {
    const startTime = performance.now();
    const result = selector(state);
    const duration = performance.now() - startTime;
    
    // Log slow selectors
    if (duration > 1) {
      logger.performance('Slow selector detected', duration, {
        context: { selectorName: selector.name || 'anonymous' }
      });
    }
    
    return result;
  };
  
  // Add equality function for shallow comparison by default
  memoizedSelector.equalityFn = equalityFn || ((a: R, b: R) => {
    if (a === b) return true;
    
    // Shallow equality for objects and arrays
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      return keysA.every(key => 
        (a as any)[key] === (b as any)[key]
      );
    }
    
    return false;
  });
  
  return memoizedSelector;
}

/**
 * Hook for optimized store subscriptions with batching
 */
export function useOptimizedSelector<T, R>(
  store: UseBoundStore<StoreApi<T>>,
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) {
  const batchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastValueRef = useRef<R>();
  const [selectedValue, setSelectedValue] = useState<R>();
  
  useEffect(() => {
    const unsubscribe = store.subscribe((state) => {
      const newValue = selector(state);
      
      // Batch rapid updates
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      
      batchTimeoutRef.current = setTimeout(() => {
        const shouldUpdate = equalityFn 
          ? !equalityFn(lastValueRef.current as R, newValue)
          : lastValueRef.current !== newValue;
          
        if (shouldUpdate) {
          lastValueRef.current = newValue;
          setSelectedValue(newValue);
        }
      }, 16); // Batch updates within a frame
    });
    
    return () => {
      unsubscribe();
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, [store, selector, equalityFn]);
  
  return selectedValue;
}

// ==================== STATE SLICING PATTERNS ====================

/**
 * Creates a slice-based store with automatic performance monitoring
 */
export function createOptimizedSlice<T extends object>(
  name: string,
  initialState: T,
  actions: (set: StoreApi<T>['setState'], get: StoreApi<T>['getState']) => any
) {
  const store = create<T & ReturnType<typeof actions>>()(
    devtools(
      subscribeWithSelector(
        persist(
          (set, get) => {
            // Wrap set function with performance monitoring
            const optimizedSet = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
              const startTime = performance.now();
              
              set((state) => {
                const updates = typeof partial === 'function' ? partial(state) : partial;
                const duration = performance.now() - startTime;
                
                // Log expensive state updates
                if (duration > 5) {
                  logger.performance(`State update in ${name}`, duration, {
                    context: { 
                      slice: name,
                      updatedKeys: Object.keys(updates),
                      stateSize: JSON.stringify(state).length 
                    }
                  });
                }
                
                return { ...state, ...updates };
              });
            };
            
            return {
              ...initialState,
              ...actions(optimizedSet, get)
            };
          },
          {
            name: `skillforge-${name}`,
            partialize: (state) => {
              // Only persist non-transient state
              const { isLoading, error, ...persistentState } = state as any;
              return persistentState;
            }
          }
        )
      ),
      { name: `SkillForge-${name}` }
    )
  );
  
  return store;
}

// ==================== COMPUTED VALUES OPTIMIZATION ====================

/**
 * Creates optimized computed values with caching and dependency tracking
 */
export class ComputedValueCache<T, R> {
  private cache = new Map<string, { value: R; deps: any[]; timestamp: number }>();
  private readonly ttl: number;
  
  constructor(ttl = 60000) { // 1 minute default TTL
    this.ttl = ttl;
  }
  
  compute(
    key: string,
    dependencies: any[],
    computeFn: (state: T) => R,
    state: T
  ): R {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    // Check cache validity
    if (cached && 
        (now - cached.timestamp) < this.ttl &&
        this.areDependenciesEqual(cached.deps, dependencies)) {
      return cached.value;
    }
    
    // Compute new value
    const startTime = performance.now();
    const value = computeFn(state);
    const computeTime = performance.now() - startTime;
    
    // Cache the result
    this.cache.set(key, {
      value,
      deps: [...dependencies],
      timestamp: now
    });
    
    // Log expensive computations
    if (computeTime > 10) {
      logger.performance(`Expensive computation: ${key}`, computeTime, {
        context: { cacheKey: key, dependencies: dependencies.length }
      });
    }
    
    return value;
  }
  
  private areDependenciesEqual(deps1: any[], deps2: any[]): boolean {
    if (deps1.length !== deps2.length) return false;
    return deps1.every((dep, index) => dep === deps2[index]);
  }
  
  invalidate(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
  
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, { timestamp }]) => ({
        key,
        age: Date.now() - timestamp
      }))
    };
  }
}

// Global computed value cache
export const globalComputedCache = new ComputedValueCache();

/**
 * Hook for creating optimized computed values
 */
export function useComputedValue<T, R>(
  key: string,
  dependencies: any[],
  computeFn: () => R,
  state?: T
): R {
  return useMemo(() => {
    return globalComputedCache.compute(
      key,
      dependencies,
      () => computeFn(),
      state as T
    ) as R;
  }, dependencies);
}

// ==================== STATE SYNCHRONIZATION ====================

/**
 * Manages synchronization between local state and server state
 */
export class StateSynchronizer<T> {
  private pendingUpdates = new Map<string, T>();
  private syncInProgress = false;
  private syncQueue: Array<() => Promise<void>> = [];
  
  constructor(
    private syncFn: (updates: Record<string, T>) => Promise<void>,
    private onError: (error: Error) => void
  ) {}
  
  queueUpdate(key: string, value: T): void {
    this.pendingUpdates.set(key, value);
    this.scheduleSync();
  }
  
  private scheduleSync(): void {
    if (this.syncInProgress) return;
    
    // Debounce sync operations
    setTimeout(() => {
      this.performSync();
    }, 500);
  }
  
  private async performSync(): Promise<void> {
    if (this.syncInProgress || this.pendingUpdates.size === 0) return;
    
    this.syncInProgress = true;
    const updates = Object.fromEntries(this.pendingUpdates);
    this.pendingUpdates.clear();
    
    try {
      const startTime = performance.now();
      await this.syncFn(updates);
      const duration = performance.now() - startTime;
      
      logger.performance('State sync completed', duration, {
        context: { 
          updatesCount: Object.keys(updates).length,
          success: true 
        }
      });
    } catch (error) {
      logger.error('State sync failed', {
        action: 'state_sync_failed',
        error: error instanceof Error ? error.message : String(error),
        context: { updatesCount: Object.keys(updates).length }
      });
      
      this.onError(error instanceof Error ? error : new Error(String(error)));
      
      // Re-queue failed updates
      Object.entries(updates).forEach(([key, value]) => {
        this.pendingUpdates.set(key, value as T);
      });
    } finally {
      this.syncInProgress = false;
      
      // Process any queued operations
      if (this.syncQueue.length > 0) {
        const nextSync = this.syncQueue.shift();
        if (nextSync) await nextSync();
      }
    }
  }
  
  async forceSync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.syncQueue.push(async () => {
        try {
          await this.performSync();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.syncInProgress) {
        this.performSync();
      }
    });
  }
  
  getPendingUpdates(): Record<string, T> {
    return Object.fromEntries(this.pendingUpdates);
  }
}

// ==================== PERFORMANCE MONITORING INTEGRATION ====================

/**
 * Monitors state management performance and provides insights
 */
export class StatePerformanceMonitor {
  private static instance: StatePerformanceMonitor;
  private subscriptionCounts = new Map<string, number>();
  private updateFrequencies = new Map<string, number[]>();
  
  static getInstance(): StatePerformanceMonitor {
    if (!StatePerformanceMonitor.instance) {
      StatePerformanceMonitor.instance = new StatePerformanceMonitor();
    }
    return StatePerformanceMonitor.instance;
  }
  
  trackSubscription(storeName: string): () => void {
    const count = this.subscriptionCounts.get(storeName) || 0;
    this.subscriptionCounts.set(storeName, count + 1);
    
    return () => {
      const currentCount = this.subscriptionCounts.get(storeName) || 0;
      this.subscriptionCounts.set(storeName, Math.max(0, currentCount - 1));
    };
  }
  
  trackUpdate(storeName: string): void {
    const now = Date.now();
    const frequencies = this.updateFrequencies.get(storeName) || [];
    
    // Keep only updates from the last minute
    const recentUpdates = frequencies.filter(time => now - time < 60000);
    recentUpdates.push(now);
    
    this.updateFrequencies.set(storeName, recentUpdates);
    
    // Alert on high update frequency
    if (recentUpdates.length > 100) {
      logger.warn('High state update frequency detected', {
        action: 'high_update_frequency',
        context: { 
          storeName, 
          updatesPerMinute: recentUpdates.length 
        }
      });
    }
  }
  
  getPerformanceReport() {
    const report = {
      subscriptions: Object.fromEntries(this.subscriptionCounts),
      updateFrequencies: Object.fromEntries(
        Array.from(this.updateFrequencies.entries()).map(([store, times]) => [
          store,
          times.length
        ])
      ),
      recommendations: this.generateRecommendations()
    };
    
    logger.info('State performance report generated', {
      action: 'state_performance_report',
      context: report
    });
    
    return report;
  }
  
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Check for stores with many subscriptions
    for (const [store, count] of this.subscriptionCounts.entries()) {
      if (count > 10) {
        recommendations.push(`Consider splitting ${store} store (${count} subscriptions)`);
      }
    }
    
    // Check for high update frequencies
    for (const [store, updates] of this.updateFrequencies.entries()) {
      if (updates.length > 50) {
        recommendations.push(`Reduce update frequency for ${store} store (${updates.length}/min)`);
      }
    }
    
    return recommendations;
  }
}

export const statePerformanceMonitor = StatePerformanceMonitor.getInstance();