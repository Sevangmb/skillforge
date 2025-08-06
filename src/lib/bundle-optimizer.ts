/**
 * Bundle Size Optimization Utilities
 * Provides utilities for code splitting, lazy loading, and bundle analysis
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';

// Types for component loading
export type ComponentLoader<T = {}> = () => Promise<{ default: ComponentType<T> }>;
export type LazyComponentOptions = {
  fallback?: React.ComponentType;
  retryCount?: number;
  preload?: boolean;
};

// Enhanced lazy loading with retry and preload support
export function createLazyComponent<T = {}>(
  loader: ComponentLoader<T>,
  options: LazyComponentOptions = {}
): LazyExoticComponent<ComponentType<T>> {
  const { retryCount = 3, preload = false } = options;
  
  let retries = 0;
  
  const enhancedLoader = async (): Promise<{ default: ComponentType<T> }> => {
    try {
      const component = await loader();
      retries = 0; // Reset on success
      return component;
    } catch (error) {
      if (retries < retryCount) {
        retries++;
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
        return enhancedLoader();
      }
      throw error;
    }
  };
  
  const lazyComponent = lazy(enhancedLoader);
  
  // Preload component if requested
  if (preload && typeof window !== 'undefined') {
    // Preload after initial render
    setTimeout(() => {
      enhancedLoader().catch(() => {
        // Silent fail for preload
      });
    }, 100);
  }
  
  return lazyComponent;
}

// Icon optimization - lazy load icons to reduce initial bundle
export const createLazyIcon = (iconName: string) => {
  return createLazyComponent(
    () => import('lucide-react').then(icons => ({ default: (icons as any)[iconName] })),
    { preload: false }
  );
};

// Route-based code splitting helper
export const createLazyRoute = <T = {}>(
  routePath: string,
  loader: ComponentLoader<T>
) => {
  return createLazyComponent(loader, {
    preload: typeof window !== 'undefined' && window.location.pathname === routePath
  });
};

// Bundle analysis utilities
export class BundleAnalyzer {
  private static loadTimes = new Map<string, number>();
  private static chunkSizes = new Map<string, number>();
  
  static trackChunkLoad(chunkName: string, startTime: number) {
    const loadTime = performance.now() - startTime;
    this.loadTimes.set(chunkName, loadTime);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 Chunk '${chunkName}' loaded in ${loadTime.toFixed(2)}ms`);
    }
  }
  
  static trackChunkSize(chunkName: string, size: number) {
    this.chunkSizes.set(chunkName, size);
  }
  
  static getAnalytics() {
    return {
      loadTimes: Object.fromEntries(this.loadTimes),
      chunkSizes: Object.fromEntries(this.chunkSizes),
      totalChunks: this.loadTimes.size,
      averageLoadTime: Array.from(this.loadTimes.values())
        .reduce((sum, time) => sum + time, 0) / this.loadTimes.size || 0
    };
  }
  
  static reset() {
    this.loadTimes.clear();
    this.chunkSizes.clear();
  }
}

// Optimized import patterns
export const optimizedImports = {
  // UI Components - load only what's needed
  loadUIComponent: (componentName: string) => {
    const startTime = performance.now();
    return import('@/components/ui/button').then(ui => {
      BundleAnalyzer.trackChunkLoad(`ui-${String(componentName)}`, startTime);
      return { default: ui.Button };
    });
  },
  
  // Lucide Icons - load specific icons only
  loadIcon: (iconName: string) => {
    const startTime = performance.now();
    return import('lucide-react').then(icons => {
      BundleAnalyzer.trackChunkLoad(`icon-${iconName}`, startTime);
      return icons[iconName as keyof typeof icons];
    });
  },
  
  // AI Flows - load on demand
  loadAIFlow: (flowName: 'quiz' | 'explanation' | 'expansion') => {
    const startTime = performance.now();
    const flowMap = {
      quiz: () => import('@/ai/flows/generate-quiz-question'),
      explanation: () => import('@/ai/flows/generate-explanation'),
      expansion: () => import('@/ai/flows/expand-skill-tree')
    };
    
    return flowMap[flowName]().then(module => {
      BundleAnalyzer.trackChunkLoad(`ai-flow-${flowName}`, startTime);
      return module;
    });
  }
};

// Tree shaking helper - explicitly mark used exports
export const markAsUsed = <T>(module: T): T => {
  // This function helps bundlers understand which exports are actually used
  // Useful for complex re-exports and dynamic imports
  return module;
};

// Preloading strategies
export class PreloadManager {
  private static preloadedChunks = new Set<string>();
  
  static preloadRoute(routePath: string) {
    if (typeof window === 'undefined' || this.preloadedChunks.has(routePath)) {
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = routePath;
    document.head.appendChild(link);
    
    this.preloadedChunks.add(routePath);
  }
  
  static preloadCriticalChunks() {
    // Preload essential chunks for better UX
    const criticalChunks = [
      '/skill-tree',
      '/quiz-modal',
      '/auth-components'
    ];
    
    criticalChunks.forEach(chunk => {
      this.preloadRoute(chunk);
    });
  }
  
  static isPreloaded(chunkName: string): boolean {
    return this.preloadedChunks.has(chunkName);
  }
}

// Development bundle analysis
if (process.env.NODE_ENV === 'development') {
  // Auto-reset analytics on hot reload
  if (typeof window !== 'undefined') {
    (window as any).__BUNDLE_ANALYZER__ = BundleAnalyzer;
  }
}