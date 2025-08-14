/**
 * Optimized callback hooks for React components
 * Prevents unnecessary re-renders and improves performance
 */

import { useCallback, useRef, useMemo, DependencyList } from 'react';
import { AsyncUtils } from '@/lib/utils-enhanced';

/**
 * Stable callback that never changes reference unless dependencies change
 */
export function useStableCallback<TArgs extends unknown[], TReturn>(
  callback: (...args: TArgs) => TReturn,
  dependencies: DependencyList
): (...args: TArgs) => TReturn {
  const callbackRef = useRef(callback);
  
  // Update callback ref when dependencies change
  useMemo(() => {
    callbackRef.current = callback;
  }, dependencies);
  
  // Return stable callback reference
  return useCallback((...args: TArgs): TReturn => {
    return callbackRef.current(...args);
  }, []); // Empty deps array - never changes
}

/**
 * Debounced callback hook with automatic cleanup
 */
export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delay: number,
  dependencies: DependencyList
): (...args: TArgs) => void {
  const stableCallback = useStableCallback(callback, dependencies);
  const keyRef = useRef(`debounce-${Math.random().toString(36).slice(2)}`);
  
  const debouncedFn = useMemo(() => {
    return AsyncUtils.debounce(keyRef.current, stableCallback, delay);
  }, [stableCallback, delay]);
  
  // Cleanup on unmount
  useMemo(() => {
    return () => AsyncUtils.clearDebounce(keyRef.current);
  }, []);
  
  return debouncedFn;
}

/**
 * Throttled callback hook with automatic cleanup
 */
export function useThrottledCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delay: number,
  dependencies: DependencyList
): (...args: TArgs) => void {
  const stableCallback = useStableCallback(callback, dependencies);
  const keyRef = useRef(`throttle-${Math.random().toString(36).slice(2)}`);
  
  const throttledFn = useMemo(() => {
    return AsyncUtils.throttle(keyRef.current, stableCallback, delay);
  }, [stableCallback, delay]);
  
  // Cleanup on unmount
  useMemo(() => {
    return () => AsyncUtils.clearThrottle(keyRef.current);
  }, []);
  
  return throttledFn;
}

/**
 * Event handler with automatic event prevention/stopping
 */
export function useEventHandler<T extends Event>(
  handler: (event: T) => void,
  options: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
    dependencies?: DependencyList;
  } = {}
): (event: T) => void {
  const { 
    preventDefault = false, 
    stopPropagation = false, 
    dependencies = [] 
  } = options;
  
  return useStableCallback((event: T) => {
    if (preventDefault) {
      event.preventDefault();
    }
    
    if (stopPropagation) {
      event.stopPropagation();
    }
    
    handler(event);
  }, dependencies);
}

/**
 * Async callback with loading state and error handling
 */
export function useAsyncCallback<TArgs extends unknown[], TReturn>(
  asyncCallback: (...args: TArgs) => Promise<TReturn>,
  dependencies: DependencyList
) {
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(true);
  
  const execute = useStableCallback(async (...args: TArgs): Promise<TReturn | null> => {
    if (isLoadingRef.current) {
      return null; // Prevent concurrent executions
    }
    
    isLoadingRef.current = true;
    
    try {
      const result = await asyncCallback(...args);
      return mountedRef.current ? result : null;
    } catch (error) {
      if (mountedRef.current) {
        throw error;
      }
      return null;
    } finally {
      if (mountedRef.current) {
        isLoadingRef.current = false;
      }
    }
  }, dependencies);
  
  // Cleanup on unmount
  useMemo(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  return {
    execute,
    isLoading: () => isLoadingRef.current
  };
}

/**
 * Memoized click handler with optional conditions
 */
export function useClickHandler<T = HTMLElement>(
  handler: (event: React.MouseEvent<T>) => void,
  condition: boolean = true,
  dependencies: DependencyList = []
): (event: React.MouseEvent<T>) => void {
  return useEventHandler(
    (event) => {
      if (condition) {
        handler(event);
      }
    },
    {
      preventDefault: false,
      stopPropagation: false,
      dependencies: [condition, ...dependencies]
    }
  );
}

/**
 * Form submission handler with validation
 */
export function useFormHandler<T extends Record<string, unknown>>(
  onSubmit: (data: T) => void | Promise<void>,
  validate?: (data: T) => boolean | string,
  dependencies: DependencyList = []
) {
  const { execute, isLoading } = useAsyncCallback(async (data: T) => {
    if (validate) {
      const validationResult = validate(data);
      if (validationResult !== true) {
        const errorMessage = typeof validationResult === 'string' 
          ? validationResult 
          : 'Validation failed';
        throw new Error(errorMessage);
      }
    }
    
    await onSubmit(data);
  }, [validate, ...dependencies]);
  
  const handleSubmit = useEventHandler(
    async (event: React.FormEvent) => {
      const form = event.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries()) as T;
      
      await execute(data);
    },
    {
      preventDefault: true,
      dependencies: [execute]
    }
  );
  
  return {
    handleSubmit,
    isSubmitting: isLoading
  };
}

/**
 * Keyboard event handler with key filtering
 */
export function useKeyboardHandler(
  handler: (event: KeyboardEvent) => void,
  keys: string | string[],
  dependencies: DependencyList = []
): (event: KeyboardEvent) => void {
  const keySet = useMemo(() => {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    return new Set(keyArray.map(k => k.toLowerCase()));
  }, [keys]);
  
  return useEventHandler(
    (event) => {
      if (keySet.has(event.key.toLowerCase())) {
        handler(event);
      }
    },
    { dependencies: [keySet, ...dependencies] }
  );
}

/**
 * Optimized change handler for controlled inputs
 */
export function useInputChangeHandler(
  setter: (value: string) => void,
  transform?: (value: string) => string,
  dependencies: DependencyList = []
): (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void {
  return useEventHandler(
    (event) => {
      let value = event.target.value;
      if (transform) {
        value = transform(value);
      }
      setter(value);
    },
    { dependencies: [setter, transform, ...dependencies] }
  );
}

/**
 * Batch multiple callbacks into a single optimized handler
 */
export function useBatchedCallbacks<T extends Record<string, (...args: any[]) => any>>(
  callbacks: T,
  dependencies: DependencyList = []
): T {
  return useMemo(() => {
    const batchedCallbacks = {} as T;
    
    for (const [key, callback] of Object.entries(callbacks)) {
      batchedCallbacks[key as keyof T] = ((...args: any[]) => {
        // Use requestIdleCallback for better performance if available
        if (typeof requestIdleCallback === 'function') {
          requestIdleCallback(() => callback(...args));
        } else {
          setTimeout(() => callback(...args), 0);
        }
      }) as any;
    }
    
    return batchedCallbacks;
  }, dependencies);
}