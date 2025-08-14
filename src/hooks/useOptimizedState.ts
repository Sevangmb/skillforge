/**
 * Optimized state management hook with performance enhancements
 * Provides memoized setters, transition support, and cleanup handling
 */
import { useState, useCallback, useRef, useTransition } from 'react';

export interface OptimizedStateOptions {
  enableTransitions?: boolean;
  debugName?: string;
}

export function useOptimizedState<T>(
  initialState: T,
  options: OptimizedStateOptions = {}
) {
  const { enableTransitions = false, debugName } = options;
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    isMountedRef.current = false;
  }, []);

  // Standard state updater with mount check
  const updateState = useCallback((updates: Partial<T>) => {
    if (!isMountedRef.current) {
      if (debugName) {
        console.debug(`[${debugName}] State update skipped - component unmounted`);
      }
      return;
    }
    setState(prev => ({ ...prev, ...updates }));
  }, [debugName]);

  // State updater with transition (for non-urgent updates)
  const updateStateWithTransition = useCallback((updates: Partial<T>) => {
    if (!isMountedRef.current) {
      if (debugName) {
        console.debug(`[${debugName}] Transition update skipped - component unmounted`);
      }
      return;
    }
    startTransition(() => {
      setState(prev => ({ ...prev, ...updates }));
    });
  }, [debugName]);

  // Replace entire state
  const replaceState = useCallback((newState: T) => {
    if (!isMountedRef.current) return;
    setState(newState);
  }, []);

  return {
    state,
    updateState: enableTransitions ? updateStateWithTransition : updateState,
    updateStateSync: updateState, // Always synchronous
    updateStateAsync: updateStateWithTransition, // Always with transition
    replaceState,
    isPending: enableTransitions ? isPending : false,
    isMounted: () => isMountedRef.current,
    cleanup,
  };
}

/**
 * Optimized effect dependency tracking
 * Prevents unnecessary re-renders by deep comparing dependencies
 */
export function useDeepEffect(
  effect: () => void | (() => void),
  deps: unknown[]
): void {
  const prevDepsRef = useRef<unknown[]>();
  const cleanupRef = useRef<(() => void) | void>();

  // Deep comparison utility
  const deepEquals = (a: unknown[], b: unknown[]): boolean => {
    if (a.length !== b.length) return false;
    return a.every((item, index) => {
      const other = b[index];
      if (typeof item === 'object' && item !== null && typeof other === 'object' && other !== null) {
        return JSON.stringify(item) === JSON.stringify(other);
      }
      return item === other;
    });
  };

  if (!prevDepsRef.current || !deepEquals(prevDepsRef.current, deps)) {
    // Clean up previous effect
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    // Run new effect
    cleanupRef.current = effect();
    prevDepsRef.current = deps;
  }
}

/**
 * Performance monitoring hook for components
 */
export function usePerformanceMonitor(componentName: string, enabled = false) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  
  if (enabled) {
    renderCountRef.current++;
    const now = Date.now();
    const renderDuration = now - lastRenderTimeRef.current;
    
    if (renderDuration > 16) { // More than one frame (60fps)
      console.warn(`[${componentName}] Slow render detected: ${renderDuration}ms (render #${renderCountRef.current})`);
    }
    
    lastRenderTimeRef.current = now;
  }

  return {
    renderCount: renderCountRef.current,
    getStats: () => ({
      renderCount: renderCountRef.current,
      lastRenderTime: lastRenderTimeRef.current,
    }),
  };
}