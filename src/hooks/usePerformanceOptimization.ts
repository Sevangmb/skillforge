/**
 * Performance optimization hooks for SkillForge AI
 */

import { useCallback, useRef, useMemo, useEffect } from 'react';
import { logger } from '@/lib/logger';

/**
 * Debounced callback hook with performance monitoring
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps?: React.DependencyList
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);
  const startTimeRef = useRef<number>();

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, deps || [callback]);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      const startTime = performance.now();
      startTimeRef.current = startTime;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const executionTime = performance.now() - startTime;
        
        logger.debug('Debounced callback executed', {
          action: 'debounced_callback_execution',
          delay,
          executionTime,
          args: args.length
        });

        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Throttled callback hook with performance monitoring
 */
export function useThrottleCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps?: React.DependencyList
): T {
  const lastCallRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, deps || [callback]);

  const throttledCallback = useCallback(
    ((...args: Parameters<T>) => {
      const now = performance.now();
      
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        
        const startTime = performance.now();
        const result = callbackRef.current(...args);
        const executionTime = performance.now() - startTime;

        logger.debug('Throttled callback executed', {
          action: 'throttled_callback_execution',
          delay,
          executionTime,
          timeSinceLastCall: now - (lastCallRef.current - delay)
        });

        return result;
      }
    }) as T,
    [delay]
  );

  return throttledCallback;
}

/**
 * Memoized expensive computation with performance tracking
 */
export function useExpensiveMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  debugName?: string
): T {
  return useMemo(() => {
    const startTime = performance.now();
    const result = factory();
    const computationTime = performance.now() - startTime;

    if (computationTime > 10) { // Log if computation takes more than 10ms
      logger.debug('Expensive memo computation', {
        action: 'expensive_memo_computation',
        debugName: debugName || 'anonymous',
        computationTime,
        depsLength: deps.length
      });
    }

    return result;
  }, deps);
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const observerRef = useRef<IntersectionObserver>();
  const isIntersectingRef = useRef(false);
  const callbacksRef = useRef<{
    onIntersect?: () => void;
    onLeave?: () => void;
  }>({});

  const observe = useCallback(() => {
    if (!elementRef.current || observerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const wasIntersecting = isIntersectingRef.current;
          const isIntersecting = entry.isIntersecting;
          
          if (isIntersecting && !wasIntersecting) {
            isIntersectingRef.current = true;
            callbacksRef.current.onIntersect?.();
            
            logger.debug('Element intersected', {
              action: 'intersection_observer_enter',
              target: entry.target.tagName
            });
          } else if (!isIntersecting && wasIntersecting) {
            isIntersectingRef.current = false;
            callbacksRef.current.onLeave?.();
            
            logger.debug('Element left intersection', {
              action: 'intersection_observer_leave',
              target: entry.target.tagName
            });
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observerRef.current.observe(elementRef.current);
  }, [elementRef, options]);

  const unobserve = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = undefined;
    }
  }, []);

  const setCallbacks = useCallback((callbacks: {
    onIntersect?: () => void;
    onLeave?: () => void;
  }) => {
    callbacksRef.current = callbacks;
  }, []);

  useEffect(() => {
    observe();
    return unobserve;
  }, [observe, unobserve]);

  return {
    isIntersecting: isIntersectingRef.current,
    observe,
    unobserve,
    setCallbacks
  };
}

/**
 * Memory usage monitoring hook
 */
export function useMemoryMonitoring(intervalMs: number = 10000) {
  useEffect(() => {
    if (!('memory' in performance)) return;

    const monitor = () => {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);

      logger.debug('Memory usage', {
        action: 'memory_monitoring',
        usedMB,
        totalMB,
        limitMB,
        usagePercentage: Math.round((usedMB / limitMB) * 100)
      });

      // Warn if memory usage is high
      if (usedMB / limitMB > 0.8) {
        logger.warn('High memory usage detected', {
          action: 'high_memory_usage',
          usedMB,
          limitMB,
          usagePercentage: Math.round((usedMB / limitMB) * 100)
        });
      }
    };

    const interval = setInterval(monitor, intervalMs);
    
    // Initial measurement
    monitor();

    return () => clearInterval(interval);
  }, [intervalMs]);
}

/**
 * Component render tracking
 */
export function useRenderTracking(componentName: string, props?: Record<string, any>) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef<number>();

  useEffect(() => {
    renderCount.current += 1;
    const now = performance.now();
    
    const timeSinceLastRender = lastRenderTime.current 
      ? now - lastRenderTime.current 
      : 0;

    logger.debug('Component render', {
      action: 'component_render',
      componentName,
      renderCount: renderCount.current,
      timeSinceLastRender,
      propsKeys: props ? Object.keys(props) : []
    });

    lastRenderTime.current = now;
  });

  return {
    renderCount: renderCount.current
  };
}