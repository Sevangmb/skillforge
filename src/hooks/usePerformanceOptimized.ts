import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Throttle hook for expensive operations
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T {
  const throttleRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);
  
  // Update callback ref when deps change
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);

  return useCallback(
    ((...args) => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      
      throttleRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

// Debounce hook for input handling
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T {
  const debounceRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);

  return useCallback(
    ((...args) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

// Memoized state with shallow comparison
export function useShallowMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

// Optimized effect that only runs when dependencies actually change
export function useDeepEffect(
  effect: React.EffectCallback,
  deps: React.DependencyList
) {
  const prevDeps = useRef<React.DependencyList>();
  const hasChanged = !prevDeps.current || 
    deps.length !== prevDeps.current.length ||
    deps.some((dep, i) => dep !== prevDeps.current![i]);

  useEffect(() => {
    if (hasChanged) {
      prevDeps.current = deps;
      return effect();
    }
  }, deps);
}

// Intersection observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersectingNow = entry.isIntersecting;
        setIsIntersecting(isIntersectingNow);
        
        if (isIntersectingNow && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, hasIntersected, options]);

  return { isIntersecting, hasIntersected };
}

// Memory usage monitor hook
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const used = memory.usedJSHeapSize;
        const total = memory.totalJSHeapSize;
        const percentage = (used / total) * 100;
        
        setMemoryInfo({ used, total, percentage });
      }
    };

    // Check immediately and then every 5 seconds
    checkMemory();
    const interval = setInterval(checkMemory, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

// Performance timing hook
export function usePerformanceTiming(name: string) {
  const startTimeRef = useRef<number>();
  
  const start = useCallback(() => {
    startTimeRef.current = performance.now();
    performance.mark(`${name}-start`);
  }, [name]);

  const end = useCallback(() => {
    if (startTimeRef.current) {
      const endTime = performance.now();
      const duration = endTime - startTimeRef.current;
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔥 Performance [${name}]:`, `${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
    return 0;
  }, [name]);

  return { start, end };
}

// Optimized async state management
export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  deps: React.DependencyList
) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController>();

  const execute = useCallback(async () => {
    // Cancel previous operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await operation();
      
      if (!abortControllerRef.current.signal.aborted) {
        setState({ data, loading: false, error: null });
      }
    } catch (error) {
      if (!abortControllerRef.current.signal.aborted) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('Unknown error')
        }));
      }
    }
  }, deps);

  useEffect(() => {
    execute();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [execute]);

  const retry = useCallback(() => {
    execute();
  }, [execute]);

  return { ...state, retry };
}

// Component render count tracker for debugging
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} rendered ${renderCount.current} times`);
    }
  });

  return renderCount.current;
}