// Performance monitoring system for SkillForge
import React from 'react';
import { PerformanceMetrics } from './types';

// Core Web Vitals thresholds
export const PERFORMANCE_THRESHOLDS = {
  // Largest Contentful Paint (LCP)
  LCP: {
    GOOD: 2500,
    NEEDS_IMPROVEMENT: 4000,
  },
  // First Input Delay (FID)
  FID: {
    GOOD: 100,
    NEEDS_IMPROVEMENT: 300,
  },
  // Cumulative Layout Shift (CLS)
  CLS: {
    GOOD: 0.1,
    NEEDS_IMPROVEMENT: 0.25,
  },
  // First Contentful Paint (FCP)
  FCP: {
    GOOD: 1800,
    NEEDS_IMPROVEMENT: 3000,
  },
  // Time to Interactive (TTI)
  TTI: {
    GOOD: 3800,
    NEEDS_IMPROVEMENT: 7300,
  },
} as const;

// Performance metrics storage
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100; // Keep last 100 measurements
  private isEnabled = true;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Enable/disable based on environment
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     process.env.NEXT_PUBLIC_PERFORMANCE_MONITORING === 'true';

    if (!this.isEnabled) return;

    // Observe Core Web Vitals
    this.observeWebVitals();
    
    // Monitor route changes for SPA navigation
    this.observeRouteChanges();
  }

  private observeWebVitals() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.recordMetric({
          renderTime: lastEntry.startTime,
          dataFetchTime: 0,
          componentName: 'LCP',
          timestamp: new Date(),
          type: 'web-vital',
          value: lastEntry.startTime,
          rating: this.getRating(lastEntry.startTime, PERFORMANCE_THRESHOLDS.LCP),
        });
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // FID Observer
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric({
            renderTime: entry.processingStart - entry.startTime,
            dataFetchTime: 0,
            componentName: 'FID',
            timestamp: new Date(),
            type: 'web-vital',
            value: entry.processingStart - entry.startTime,
            rating: this.getRating(entry.processingStart - entry.startTime, PERFORMANCE_THRESHOLDS.FID),
          });
        });
      });

      fidObserver.observe({ entryTypes: ['first-input'] });

      // CLS Observer
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        this.recordMetric({
          renderTime: clsValue,
          dataFetchTime: 0,
          componentName: 'CLS',
          timestamp: new Date(),
          type: 'web-vital',
          value: clsValue,
          rating: this.getRating(clsValue, PERFORMANCE_THRESHOLDS.CLS),
        });
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });

    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  private observeRouteChanges() {
    if (typeof window === 'undefined') return;

    let routeStartTime = performance.now();

    // Listen for navigation events
    const handleRouteChange = () => {
      const routeEndTime = performance.now();
      const navigationTime = routeEndTime - routeStartTime;
      
      this.recordMetric({
        renderTime: navigationTime,
        dataFetchTime: 0,
        componentName: 'Route Navigation',
        timestamp: new Date(),
        type: 'navigation',
        value: navigationTime,
        rating: navigationTime < 1000 ? 'good' : navigationTime < 2000 ? 'needs-improvement' : 'poor',
      });

      routeStartTime = performance.now();
    };

    // For Next.js App Router
    window.addEventListener('beforeunload', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
  }

  private getRating(value: number, thresholds: { GOOD: number; NEEDS_IMPROVEMENT: number }) {
    if (value <= thresholds.GOOD) return 'good';
    if (value <= thresholds.NEEDS_IMPROVEMENT) return 'needs-improvement';
    return 'poor';
  }

  private recordMetric(metric: PerformanceMetrics & { type?: string; value?: number; rating?: string }) {
    if (!this.isEnabled) return;

    this.metrics.push(metric);
    
    // Keep only the last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log significant performance issues
    if (metric.rating === 'poor') {
      console.warn(`Poor performance detected: ${metric.componentName}`, metric);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }
  }

  private async sendToAnalytics(metric: PerformanceMetrics & { type?: string; value?: number; rating?: string }) {
    try {
      // Send to your analytics service (Google Analytics, etc.)
      if ('gtag' in window) {
        (window as any).gtag('event', 'performance_metric', {
          metric_name: metric.componentName,
          metric_value: metric.value,
          metric_rating: metric.rating,
          custom_map: {
            render_time: metric.renderTime,
            fetch_time: metric.dataFetchTime,
          },
        });
      }
    } catch (error) {
      console.warn('Failed to send performance metric to analytics:', error);
    }
  }

  // Public API
  public measureComponent<T>(
    componentName: string,
    operation: () => T | Promise<T>
  ): T | Promise<T> {
    if (!this.isEnabled) return operation();

    const startTime = performance.now();
    const result = operation();

    const recordTiming = (fetchTime = 0) => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      this.recordMetric({
        renderTime,
        dataFetchTime: fetchTime,
        componentName,
        timestamp: new Date(),
        type: 'component',
        value: renderTime,
        rating: renderTime < 16 ? 'good' : renderTime < 50 ? 'needs-improvement' : 'poor',
      });
    };

    if (result instanceof Promise) {
      return result.then((data) => {
        recordTiming();
        return data;
      }).catch((error) => {
        recordTiming();
        throw error;
      }) as T;
    } else {
      recordTiming();
      return result;
    }
  }

  public measureAsync<T>(
    componentName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    if (!this.isEnabled) return operation();

    const startTime = performance.now();
    const fetchStartTime = performance.now();

    return operation().then((result) => {
      const fetchEndTime = performance.now();
      const endTime = performance.now();
      
      this.recordMetric({
        renderTime: endTime - startTime,
        dataFetchTime: fetchEndTime - fetchStartTime,
        componentName,
        timestamp: new Date(),
        type: 'async-operation',
        value: endTime - startTime,
        rating: (endTime - startTime) < 100 ? 'good' : (endTime - startTime) < 500 ? 'needs-improvement' : 'poor',
      });

      return result;
    }).catch((error) => {
      const endTime = performance.now();
      this.recordMetric({
        renderTime: endTime - startTime,
        dataFetchTime: 0,
        componentName: `${componentName} (error)`,
        timestamp: new Date(),
        type: 'async-operation-error',
        value: endTime - startTime,
        rating: 'poor',
      });
      throw error;
    });
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getMetricsByComponent(componentName: string): PerformanceMetrics[] {
    return this.metrics.filter(metric => metric.componentName === componentName);
  }

  public getAverageMetrics(): Record<string, { avgRender: number; avgFetch: number; count: number }> {
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.componentName]) {
        acc[metric.componentName] = { totalRender: 0, totalFetch: 0, count: 0 };
      }
      acc[metric.componentName].totalRender += metric.renderTime;
      acc[metric.componentName].totalFetch += metric.dataFetchTime;
      acc[metric.componentName].count += 1;
      return acc;
    }, {} as Record<string, { totalRender: number; totalFetch: number; count: number }>);

    return Object.entries(grouped).reduce((acc, [name, data]) => {
      acc[name] = {
        avgRender: data.totalRender / data.count,
        avgFetch: data.totalFetch / data.count,
        count: data.count,
      };
      return acc;
    }, {} as Record<string, { avgRender: number; avgFetch: number; count: number }>);
  }

  public clearMetrics(): void {
    this.metrics = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    measureComponent: performanceMonitor.measureComponent.bind(performanceMonitor),
    measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getAverageMetrics: performanceMonitor.getAverageMetrics.bind(performanceMonitor),
    clearMetrics: performanceMonitor.clearMetrics.bind(performanceMonitor),
  };
}

// Performance measurement decorators/HOCs
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name;
    
    return performanceMonitor.measureComponent(name, () => {
      return React.createElement(Component, props);
    }) as React.ReactElement;
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default performanceMonitor;