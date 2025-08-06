/**
 * Custom hook for throttled callbacks with RAF optimization
 * Provides smooth performance for high-frequency events like mouse movement
 */

import { useCallback, useRef } from 'react';

export interface ThrottleOptions {
  delay?: number;
  useRAF?: boolean;
  leading?: boolean;
  trailing?: boolean;
}

/**
 * Creates a throttled version of the provided callback function
 * 
 * @param callback - Function to throttle
 * @param options - Throttling configuration
 * @returns Throttled callback function
 */
export function useThrottledCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  options: ThrottleOptions = {}
): T {
  const {
    delay = 16, // Default to 60fps (16ms)
    useRAF = true,
    leading = true,
    trailing = true
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const lastArgsRef = useRef<Parameters<T>>();
  const leadingRef = useRef<boolean>(true);

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    lastArgsRef.current = args;

    // Execute immediately if leading and this is the first call
    if (leading && leadingRef.current) {
      leadingRef.current = false;
      lastCallTimeRef.current = now;
      
      if (useRAF && typeof window !== 'undefined') {
        rafRef.current = requestAnimationFrame(() => {
          callback(...args);
        });
      } else {
        callback(...args);
      }
      return;
    }

    // Clear existing timeout/RAF
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (rafRef.current && typeof window !== 'undefined') {
      cancelAnimationFrame(rafRef.current);
    }

    // Calculate remaining delay
    const timeSinceLastCall = now - lastCallTimeRef.current;
    const remainingDelay = Math.max(0, delay - timeSinceLastCall);

    // Schedule the next execution
    if (trailing) {
      if (useRAF && typeof window !== 'undefined' && remainingDelay === 0) {
        rafRef.current = requestAnimationFrame(() => {
          lastCallTimeRef.current = Date.now();
          if (lastArgsRef.current) {
            callback(...lastArgsRef.current);
          }
        });
      } else {
        timeoutRef.current = setTimeout(() => {
          lastCallTimeRef.current = Date.now();
          if (lastArgsRef.current) {
            callback(...lastArgsRef.current);
          }
        }, remainingDelay);
      }
    }
  }, [callback, delay, useRAF, leading, trailing]) as T;

  // Reset leading flag when callback changes
  const resetLeading = useCallback(() => {
    leadingRef.current = true;
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (rafRef.current && typeof window !== 'undefined') {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    resetLeading();
  }, [resetLeading]);

  // Return throttled callback with cleanup utilities
  return Object.assign(throttledCallback, {
    cancel: cleanup,
    flush: () => {
      if (lastArgsRef.current) {
        callback(...lastArgsRef.current);
        cleanup();
      }
    },
    pending: () => timeoutRef.current !== null || rafRef.current !== null
  });
}

/**
 * Specialized hook for mouse event throttling with optimized defaults
 */
export function useThrottledMouseCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number = 16
): T {
  return useThrottledCallback(callback, {
    delay,
    useRAF: true,
    leading: false,
    trailing: true
  });
}

/**
 * Specialized hook for scroll event throttling
 */
export function useThrottledScrollCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number = 10
): T {
  return useThrottledCallback(callback, {
    delay,
    useRAF: true,
    leading: true,
    trailing: true
  });
}