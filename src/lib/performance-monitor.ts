/**
 * Performance Monitoring and Optimization Utilities
 * Provides comprehensive performance tracking for SkillForge AI
 */

import React from 'react';
import { logger } from './logger';

// Performance metrics interface
export interface PerformanceMetrics {
  timing: {
    navigationStart: number;
    domContentLoaded: number;
    loadComplete: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
  };
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  navigation: {
    type: string;
    redirectCount: number;
  };
}

// Core Web Vitals tracking
export interface CoreWebVitals {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay  
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private vitals: CoreWebVitals = {};
  
  private constructor() {
    this.initializeObservers();
  }
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  private initializeObservers() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }
    
    // Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lcp = entries[entries.length - 1];
      this.vitals.lcp = lcp.startTime;
      this.reportMetric('lcp', lcp.startTime);
    });
    
    // First Input Delay
    this.observeMetric('first-input', (entries) => {
      const fid = entries[0];
      this.vitals.fid = (fid as any).processingStart - fid.startTime;
      this.reportMetric('fid', this.vitals.fid);
    });
    
    // Cumulative Layout Shift
    this.observeMetric('layout-shift', (entries) => {
      const cls = entries.reduce((sum, entry) => {
        return (entry as any).hadRecentInput ? sum : sum + (entry as any).value;
      }, this.vitals.cls || 0);
      this.vitals.cls = cls;
      this.reportMetric('cls', cls);
    });
    
    // First Contentful Paint
    this.observeMetric('paint', (entries) => {
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.vitals.fcp = entry.startTime;
          this.reportMetric('fcp', entry.startTime);
        }
      });
    });
    
    // Navigation timing
    this.observeMetric('navigation', (entries) => {
      entries.forEach(entry => {
        this.vitals.ttfb = (entry as any).responseStart;
        this.reportMetric('ttfb', (entry as any).responseStart);
      });
    });
  }
  
  private observeMetric(type: string, callback: (entries: PerformanceEntry[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries() as PerformanceEntry[]);
      });
      
      observer.observe({ type, buffered: true });
      this.observers.set(type, observer);
    } catch (error) {
      logger.warn('Failed to observe performance metric', {
        action: 'performance_observer_failed',
        context: { type, error: error instanceof Error ? error.message : String(error) }
      });
    }
  }
  
  private reportMetric(name: string, value: number) {
    this.metrics.set(name, value);
    
    // Log significant metrics
    if (['lcp', 'fid', 'cls'].includes(name)) {
      logger.performance(`Core Web Vital: ${name}`, value, {
        context: { metric: name, value, timestamp: Date.now() }
      });
    }
  }
  
  // Component performance tracking
  measureComponent<T>(componentName: string, fn: () => T): T {
    const startTime = performance.now();
    
    try {
      const result = fn();
      
      // Handle both sync and async results
      if (result instanceof Promise) {
        return result.then(asyncResult => {
          const duration = performance.now() - startTime;
          this.trackComponentRender(componentName, duration);
          return asyncResult;
        }).catch(error => {
          const duration = performance.now() - startTime;
          this.trackComponentError(componentName, duration, error);
          throw error;
        }) as T;
      }
      
      const duration = performance.now() - startTime;
      this.trackComponentRender(componentName, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.trackComponentError(componentName, duration, error);
      throw error;
    }
  }
  
  private trackComponentRender(componentName: string, duration: number) {
    const key = `component_${componentName}`;
    this.metrics.set(key, duration);
    
    // Log slow components
    if (duration > 16) { // More than one frame at 60fps
      logger.performance(`Slow component render: ${componentName}`, duration, {
        context: { component: componentName, threshold: 16 }
      });
    }
  }
  
  private trackComponentError(componentName: string, duration: number, error: any) {
    logger.error('Component performance tracking failed', {
      action: 'component_render_error',
      context: { 
        component: componentName, 
        duration, 
        error: error instanceof Error ? error.message : String(error) 
      }
    });
  }
  
  // Memory monitoring
  getMemoryUsage(): PerformanceMetrics['memory'] | null {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return null;
    }
    
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    };
  }
  
  // Resource timing analysis
  analyzeResourceTiming(): Array<{ name: string; duration: number; type: string }> {
    if (typeof window === 'undefined') return [];
    
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return resources.map(resource => ({
      name: resource.name,
      duration: resource.responseEnd - resource.startTime,
      type: this.getResourceType(resource.name)
    })).sort((a, b) => b.duration - a.duration);
  }
  
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'image';
    return 'other';
  }
  
  // Generate performance report
  generateReport(): PerformanceMetrics & { vitals: CoreWebVitals; resources: any[] } {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memory = this.getMemoryUsage();
    
    const report = {
      timing: {
        navigationStart: navigation?.startTime || 0,
        domContentLoaded: navigation?.domContentLoadedEventEnd || 0,
        loadComplete: navigation?.loadEventEnd || 0,
        firstContentfulPaint: this.vitals.fcp,
        largestContentfulPaint: this.vitals.lcp
      },
      memory,
      navigation: {
        type: (navigation as any)?.type === 0 ? 'navigate' : 
              (navigation as any)?.type === 1 ? 'reload' : 
              (navigation as any)?.type === 2 ? 'back_forward' : 'unknown',
        redirectCount: navigation?.redirectCount || 0
      },
      vitals: this.vitals,
      resources: this.analyzeResourceTiming()
    };
    
    // Log comprehensive report
    logger.info('Performance report generated', {
      action: 'performance_report',
      context: { 
        lcp: this.vitals.lcp,
        fid: this.vitals.fid, 
        cls: this.vitals.cls,
        memoryUsage: memory?.usedJSHeapSize,
        resourceCount: report.resources.length
      }
    });
    
    return report;
  }
  
  // Performance budgets and alerts
  checkPerformanceBudgets() {
    const budgets = {
      lcp: 2500, // 2.5s
      fid: 100,  // 100ms
      cls: 0.1,  // 0.1
      fcp: 1800  // 1.8s
    };
    
    const violations: Array<{ metric: string; value: number; budget: number }> = [];
    
    Object.entries(budgets).forEach(([metric, budget]) => {
      const value = this.vitals[metric as keyof CoreWebVitals];
      if (value && value > budget) {
        violations.push({ metric, value, budget });
      }
    });
    
    if (violations.length > 0) {
      logger.warn('Performance budget violations detected', {
        action: 'performance_budget_violation',
        context: { violations }
      });
    }
    
    return violations;
  }
  
  // Cleanup observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// React hook for component performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  return {
    measure: <T>(fn: () => T): T => performanceMonitor.measureComponent(componentName, fn),
    getMetrics: () => performanceMonitor.generateReport()
  };
};

// HOC for automatic performance monitoring
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const MonitoredComponent = (props: P) => {
    return performanceMonitor.measureComponent(displayName, () => (
      React.createElement(WrappedComponent, props)
    ));
  };
  
  MonitoredComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  return MonitoredComponent;
}

// Initialize monitoring on client-side
if (typeof window !== 'undefined') {
  // Auto-generate reports periodically
  setInterval(() => {
    performanceMonitor.checkPerformanceBudgets();
  }, 30000); // Every 30 seconds
  
  // Generate final report on page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.generateReport();
  });
}