/**
 * Enhanced utility functions with performance optimizations and type safety
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Result, SystemError, PerformanceMetrics, NonEmptyArray } from "./types";

// Cached cn function for better performance
const cnCache = new Map<string, string>();

export function cn(...inputs: ClassValue[]): string {
  const key = JSON.stringify(inputs);
  
  if (cnCache.has(key)) {
    return cnCache.get(key)!;
  }
  
  const result = twMerge(clsx(inputs));
  
  // Prevent memory leaks by limiting cache size
  if (cnCache.size > 1000) {
    const firstKey = cnCache.keys().next().value;
    cnCache.delete(firstKey);
  }
  
  cnCache.set(key, result);
  return result;
}

// Performance utilities
export class PerformanceUtils {
  private static metrics = new Map<string, PerformanceMetrics[]>();
  
  static measure<T>(
    operationName: string, 
    fn: () => T | Promise<T>,
    metadata?: Record<string, unknown>
  ): T extends Promise<any> ? Promise<T> : T {
    const start = performance.now();
    
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result
          .then((value) => {
            this.recordMetric(operationName, start, true, metadata);
            return value;
          })
          .catch((error) => {
            this.recordMetric(operationName, start, false, { ...metadata, error: error.message });
            throw error;
          }) as any;
      } else {
        this.recordMetric(operationName, start, true, metadata);
        return result as any;
      }
    } catch (error) {
      this.recordMetric(operationName, start, false, { ...metadata, error: (error as Error).message });
      throw error;
    }
  }
  
  private static recordMetric(
    operation: string,
    startTime: number,
    success: boolean,
    metadata?: Record<string, unknown>
  ): void {
    const metric: PerformanceMetrics = {
      operation,
      duration: performance.now() - startTime,
      success,
      timestamp: new Date(),
      metadata
    };
    
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const operationMetrics = this.metrics.get(operation)!;
    operationMetrics.push(metric);
    
    // Keep only last 100 metrics per operation
    if (operationMetrics.length > 100) {
      operationMetrics.shift();
    }
  }
  
  static getMetrics(operation?: string): PerformanceMetrics[] {
    if (operation) {
      return this.metrics.get(operation) || [];
    }
    
    return Array.from(this.metrics.values()).flat();
  }
  
  static getAverageMetrics(operation: string): {
    averageDuration: number;
    successRate: number;
    totalOperations: number;
  } {
    const operationMetrics = this.metrics.get(operation) || [];
    
    if (operationMetrics.length === 0) {
      return { averageDuration: 0, successRate: 0, totalOperations: 0 };
    }
    
    const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    const successfulOperations = operationMetrics.filter(m => m.success).length;
    
    return {
      averageDuration: totalDuration / operationMetrics.length,
      successRate: (successfulOperations / operationMetrics.length) * 100,
      totalOperations: operationMetrics.length
    };
  }
  
  static clearMetrics(operation?: string): void {
    if (operation) {
      this.metrics.delete(operation);
    } else {
      this.metrics.clear();
    }
  }
}

// Enhanced debouncing and throttling utilities
export class AsyncUtils {
  private static debounceMap = new Map<string, NodeJS.Timeout>();
  private static throttleMap = new Map<string, { lastCall: number; timeoutId?: NodeJS.Timeout }>();
  
  static debounce<TArgs extends unknown[]>(
    key: string,
    fn: (...args: TArgs) => void,
    delay: number
  ): (...args: TArgs) => void {
    return (...args: TArgs) => {
      const existingTimeout = this.debounceMap.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      const timeout = setTimeout(() => {
        this.debounceMap.delete(key);
        fn(...args);
      }, delay);
      
      this.debounceMap.set(key, timeout);
    };
  }
  
  static throttle<TArgs extends unknown[]>(
    key: string,
    fn: (...args: TArgs) => void,
    delay: number
  ): (...args: TArgs) => void {
    return (...args: TArgs) => {
      const now = Date.now();
      const throttleData = this.throttleMap.get(key);
      
      if (!throttleData) {
        this.throttleMap.set(key, { lastCall: now });
        fn(...args);
        return;
      }
      
      if (now - throttleData.lastCall >= delay) {
        throttleData.lastCall = now;
        fn(...args);
      } else if (!throttleData.timeoutId) {
        throttleData.timeoutId = setTimeout(() => {
          throttleData.lastCall = Date.now();
          throttleData.timeoutId = undefined;
          fn(...args);
        }, delay - (now - throttleData.lastCall));
      }
    };
  }
  
  static clearDebounce(key: string): void {
    const timeout = this.debounceMap.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.debounceMap.delete(key);
    }
  }
  
  static clearThrottle(key: string): void {
    const throttleData = this.throttleMap.get(key);
    if (throttleData?.timeoutId) {
      clearTimeout(throttleData.timeoutId);
    }
    this.throttleMap.delete(key);
  }
}

// Result handling utilities for better error management
export class ResultUtils {
  static success<T>(data: T): Result<T> {
    return { success: true, data };
  }
  
  static failure<T>(error: SystemError): Result<T> {
    return { success: false, error };
  }
  
  static async fromPromise<T>(
    promise: Promise<T>,
    errorTransformer?: (error: unknown) => SystemError
  ): Promise<Result<T>> {
    try {
      const data = await promise;
      return this.success(data);
    } catch (error) {
      const systemError = errorTransformer 
        ? errorTransformer(error)
        : this.createSystemError(error);
      return this.failure(systemError);
    }
  }
  
  static isSuccess<T>(result: Result<T>): result is { success: true; data: T } {
    return result.success;
  }
  
  static isFailure<T>(result: Result<T>): result is { success: false; error: SystemError } {
    return !result.success;
  }
  
  static unwrap<T>(result: Result<T>): T {
    if (this.isSuccess(result)) {
      return result.data;
    }
    throw new Error(`Result unwrap failed: ${result.error.message}`);
  }
  
  static unwrapOr<T>(result: Result<T>, defaultValue: T): T {
    return this.isSuccess(result) ? result.data : defaultValue;
  }
  
  private static createSystemError(error: unknown): SystemError {
    const timestamp = new Date();
    const id = `error_${timestamp.getTime()}_${Math.random().toString(36).substring(2, 9)}`;
    
    if (error instanceof Error) {
      return {
        id,
        code: error.name,
        message: error.message,
        severity: 'medium',
        category: 'system',
        timestamp,
        stack: error.stack,
        recoverable: true
      };
    }
    
    return {
      id,
      code: 'UNKNOWN_ERROR',
      message: String(error),
      severity: 'medium',
      category: 'system',
      timestamp,
      recoverable: true
    };
  }
}

// Array utilities with type safety
export class ArrayUtils {
  static isNonEmpty<T>(array: T[]): array is NonEmptyArray<T> {
    return array.length > 0;
  }
  
  static chunk<T>(array: T[], size: number): T[][] {
    if (size <= 0) return [];
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }
  
  static unique<T>(array: T[], keyFn?: (item: T) => unknown): T[] {
    if (!keyFn) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  static groupBy<T, K extends string | number | symbol>(
    array: T[],
    keyFn: (item: T) => K
  ): Record<K, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  }
  
  static sortBy<T>(array: T[], keyFn: (item: T) => number | string): T[] {
    return [...array].sort((a, b) => {
      const keyA = keyFn(a);
      const keyB = keyFn(b);
      
      if (typeof keyA === 'number' && typeof keyB === 'number') {
        return keyA - keyB;
      }
      
      return String(keyA).localeCompare(String(keyB));
    });
  }
}

// Object utilities
export class ObjectUtils {
  static pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }
  
  static omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  }
  
  static isEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0;
  }
  
  static isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a as object);
      const keysB = Object.keys(b as object);
      
      if (keysA.length !== keysB.length) return false;
      
      return keysA.every(key => 
        this.isEqual((a as any)[key], (b as any)[key])
      );
    }
    
    return false;
  }
}

// String utilities
export class StringUtils {
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  static truncate(text: string, length: number, suffix = '...'): string {
    if (text.length <= length) return text;
    return text.substring(0, length - suffix.length) + suffix;
  }
  
  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
  
  static pascalCase(text: string): string {
    return text
      .split(/[-_\s]+/)
      .map(word => this.capitalize(word))
      .join('');
  }
  
  static camelCase(text: string): string {
    const pascalCased = this.pascalCase(text);
    return pascalCased.charAt(0).toLowerCase() + pascalCased.slice(1);
  }
}

// Storage utilities with error handling
export class StorageUtils {
  static setItem(key: string, value: unknown): Result<void> {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return ResultUtils.success(undefined);
    } catch (error) {
      return ResultUtils.failure(ResultUtils['createSystemError'](error));
    }
  }
  
  static getItem<T>(key: string): Result<T | null> {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return ResultUtils.success(null);
      }
      
      const parsed = JSON.parse(item) as T;
      return ResultUtils.success(parsed);
    } catch (error) {
      return ResultUtils.failure(ResultUtils['createSystemError'](error));
    }
  }
  
  static removeItem(key: string): Result<void> {
    try {
      localStorage.removeItem(key);
      return ResultUtils.success(undefined);
    } catch (error) {
      return ResultUtils.failure(ResultUtils['createSystemError'](error));
    }
  }
  
  static clear(): Result<void> {
    try {
      localStorage.clear();
      return ResultUtils.success(undefined);
    } catch (error) {
      return ResultUtils.failure(ResultUtils['createSystemError'](error));
    }
  }
}

// Export enhanced utilities as default
export {
  PerformanceUtils as Performance,
  AsyncUtils as Async,
  ResultUtils as Result,
  ArrayUtils as Array,
  ObjectUtils as Object,
  StringUtils as String,
  StorageUtils as Storage
};