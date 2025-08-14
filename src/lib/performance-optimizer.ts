/**
 * Advanced Performance Optimization System
 * Monitors, analyzes, and optimizes application performance in real-time
 */

import { logger } from './logger';

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  type: 'navigation' | 'resource' | 'measure' | 'mark';
  details?: Record<string, unknown>;
}

interface PerformanceThresholds {
  pageLoad: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

interface ResourceTiming {
  name: string;
  size: number;
  loadTime: number;
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'other';
  critical: boolean;
}

class PerformanceOptimizer {
  private measurements = new Map<string, PerformanceEntry[]>();
  private webVitals = new Map<string, number>();
  private resourceTimings: ResourceTiming[] = [];
  private readonly thresholds: PerformanceThresholds;
  private observer: PerformanceObserver | null = null;
  private vitalsObserver: PerformanceObserver | null = null;

  constructor() {
    this.thresholds = {
      pageLoad: 3000, // 3 seconds
      firstContentfulPaint: 1800, // 1.8 seconds
      largestContentfulPaint: 2500, // 2.5 seconds  
      firstInputDelay: 100, // 100ms
      cumulativeLayoutShift: 0.1, // 0.1 score
      timeToInteractive: 3800 // 3.8 seconds
    };

    if (typeof window !== 'undefined' && 'performance' in window) {
      this.initializeObservers();
      this.monitorWebVitals();
      this.scheduleResourceAnalysis();
    }
  }

  private initializeObservers(): void {
    try {
      // Performance entries observer
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      this.observer.observe({ 
        type: 'navigation',
        buffered: true 
      });

      this.observer.observe({ 
        type: 'resource',
        buffered: true 
      });

      this.observer.observe({ 
        type: 'measure',
        buffered: true 
      });

      // Web Vitals observer
      this.vitalsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processWebVitalEntry(entry);
        }
      });

      // Observe Core Web Vitals
      this.vitalsObserver.observe({ 
        type: 'largest-contentful-paint',
        buffered: true 
      });

      this.vitalsObserver.observe({ 
        type: 'first-input',
        buffered: true 
      });

      this.vitalsObserver.observe({ 
        type: 'layout-shift',
        buffered: true 
      });

    } catch (error) {
      logger.error('Failed to initialize performance observers', {
        action: 'performance_observer_init_failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    const perfEntry: PerformanceEntry = {
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration,
      type: entry.entryType as any,
      details: this.extractEntryDetails(entry)
    };

    if (!this.measurements.has(entry.entryType)) {
      this.measurements.set(entry.entryType, []);
    }

    this.measurements.get(entry.entryType)!.push(perfEntry);

    // Analyze critical performance issues
    this.analyzeCriticalPerformance(perfEntry);
  }

  private processWebVitalEntry(entry: PerformanceEntry): void {
    const metricName = entry.entryType;
    let value = 0;

    if (entry.entryType === 'largest-contentful-paint') {
      value = entry.startTime;
      this.webVitals.set('LCP', value);
    } else if (entry.entryType === 'first-input') {
      value = (entry as any).processingStart - entry.startTime;
      this.webVitals.set('FID', value);
    } else if (entry.entryType === 'layout-shift') {
      const currentCLS = this.webVitals.get('CLS') || 0;
      this.webVitals.set('CLS', currentCLS + (entry as any).value);
      return; // CLS is cumulative, don't log individual shifts
    }

    // Check if metric exceeds threshold
    const thresholdMap = {
      'LCP': this.thresholds.largestContentfulPaint,
      'FID': this.thresholds.firstInputDelay,
      'CLS': this.thresholds.cumulativeLayoutShift
    };

    const threshold = thresholdMap[metricName as keyof typeof thresholdMap];
    if (threshold && value > threshold) {
      logger.warn(`Web Vital threshold exceeded: ${metricName}`, {
        action: 'web_vital_threshold_exceeded',
        metric: metricName,
        value,
        threshold,
        exceedanceRatio: value / threshold
      });
    }
  }

  private extractEntryDetails(entry: PerformanceEntry): Record<string, unknown> {
    const details: Record<string, unknown> = {};

    if (entry.entryType === 'navigation') {
      const navEntry = entry as PerformanceNavigationTiming;
      details.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart;
      details.loadComplete = navEntry.loadEventEnd - navEntry.loadEventStart;
      details.redirectTime = navEntry.redirectEnd - navEntry.redirectStart;
      details.dnsTime = navEntry.domainLookupEnd - navEntry.domainLookupStart;
      details.connectTime = navEntry.connectEnd - navEntry.connectStart;
      details.responseTime = navEntry.responseEnd - navEntry.responseStart;
      details.renderTime = navEntry.domComplete - navEntry.domLoading;
    } else if (entry.entryType === 'resource') {
      const resourceEntry = entry as PerformanceResourceTiming;
      details.transferSize = resourceEntry.transferSize;
      details.encodedSize = resourceEntry.encodedBodySize;
      details.decodedSize = resourceEntry.decodedBodySize;
      details.initiatorType = resourceEntry.initiatorType;
      details.compressionRatio = resourceEntry.encodedBodySize / Math.max(resourceEntry.decodedBodySize, 1);
    }

    return details;
  }

  private analyzeCriticalPerformance(entry: PerformanceEntry): void {
    if (entry.type === 'navigation' && entry.duration > this.thresholds.pageLoad) {
      logger.warn('Page load performance issue detected', {
        action: 'performance_issue_page_load',
        duration: entry.duration,
        threshold: this.thresholds.pageLoad,
        details: entry.details
      });

      this.generatePerformanceSuggestions('page_load', entry);
    }

    if (entry.type === 'resource' && entry.duration > 1000) { // Resources taking > 1s
      const resourceType = this.classifyResource(entry.name);
      
      logger.warn('Slow resource loading detected', {
        action: 'performance_issue_resource',
        resource: entry.name,
        type: resourceType,
        duration: entry.duration,
        details: entry.details
      });

      this.generatePerformanceSuggestions('resource_load', entry);
    }
  }

  private classifyResource(url: string): ResourceTiming['type'] {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
    return 'other';
  }

  private generatePerformanceSuggestions(issueType: string, entry: PerformanceEntry): void {
    const suggestions = [];

    if (issueType === 'page_load') {
      if (entry.details?.renderTime && (entry.details.renderTime as number) > 2000) {
        suggestions.push('Consider lazy loading non-critical components');
        suggestions.push('Optimize React component render cycles');
      }

      if (entry.details?.responseTime && (entry.details.responseTime as number) > 500) {
        suggestions.push('Implement server-side caching');
        suggestions.push('Consider CDN for static assets');
      }

      suggestions.push('Enable code splitting for better initial bundle size');
    }

    if (issueType === 'resource_load') {
      const resourceType = this.classifyResource(entry.name);
      
      if (resourceType === 'script' && entry.duration > 1000) {
        suggestions.push('Consider async/defer loading for non-critical scripts');
        suggestions.push('Implement script chunking and lazy loading');
      }

      if (resourceType === 'image' && entry.duration > 800) {
        suggestions.push('Implement image lazy loading and WebP format');
        suggestions.push('Consider responsive images with srcset');
      }
    }

    if (suggestions.length > 0) {
      logger.info('Performance optimization suggestions', {
        action: 'performance_suggestions',
        issue: issueType,
        resource: entry.name,
        suggestions
      });
    }
  }

  private monitorWebVitals(): void {
    // Monitor Core Web Vitals using the web-vitals library pattern
    if (typeof window !== 'undefined') {
      // FCP (First Contentful Paint)
      this.observeWebVital('first-contentful-paint', 'FCP');
      
      // TTI (Time to Interactive) estimation
      this.estimateTimeToInteractive();
    }
  }

  private observeWebVital(entryType: string, metricName: string): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const value = entry.startTime;
          this.webVitals.set(metricName, value);
          
          logger.info(`Web Vital measured: ${metricName}`, {
            action: 'web_vital_measured',
            metric: metricName,
            value,
            timestamp: Date.now()
          });
        }
      });

      observer.observe({ type: entryType, buffered: true });
    } catch (error) {
      logger.warn(`Failed to observe ${metricName}`, {
        action: 'web_vital_observer_failed',
        metric: metricName,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private estimateTimeToInteractive(): void {
    // Simple TTI estimation based on main thread quiet period
    let lastLongTask = 0;
    
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Long task threshold
              lastLongTask = entry.startTime + entry.duration;
            }
          }
        });

        observer.observe({ type: 'longtask', buffered: true });

        // Estimate TTI after a period of main thread quiet
        setTimeout(() => {
          const estimatedTTI = Math.max(lastLongTask, this.webVitals.get('FCP') || 0);
          this.webVitals.set('TTI', estimatedTTI);
          
          if (estimatedTTI > this.thresholds.timeToInteractive) {
            logger.warn('Time to Interactive threshold exceeded', {
              action: 'tti_threshold_exceeded',
              value: estimatedTTI,
              threshold: this.thresholds.timeToInteractive
            });
          }
        }, 5000);
      } catch (error) {
        logger.warn('Failed to set up TTI estimation', {
          action: 'tti_estimation_failed',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private scheduleResourceAnalysis(): void {
    // Analyze resource loading patterns after page load
    setTimeout(() => {
      this.analyzeResourcePerformance();
      this.generateOptimizationReport();
    }, 3000);
  }

  private analyzeResourcePerformance(): void {
    if (!performance.getEntriesByType) return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    this.resourceTimings = [];

    for (const resource of resources) {
      const timing: ResourceTiming = {
        name: resource.name,
        size: resource.transferSize,
        loadTime: resource.duration,
        type: this.classifyResource(resource.name),
        critical: this.isCriticalResource(resource.name)
      };

      this.resourceTimings.push(timing);
    }

    // Identify performance bottlenecks
    this.identifyBottlenecks();
  }

  private isCriticalResource(url: string): boolean {
    // Define critical resource patterns
    const criticalPatterns = [
      /main\.|index\.|app\./,  // Main app files
      /critical\.|inline\./,    // Critical CSS/JS
      /font.*\.(woff|woff2)$/,  // Font files
      /\/api\//                 // API calls
    ];

    return criticalPatterns.some(pattern => pattern.test(url));
  }

  private identifyBottlenecks(): void {
    // Sort resources by load time
    const slowResources = this.resourceTimings
      .filter(r => r.loadTime > 1000)
      .sort((a, b) => b.loadTime - a.loadTime);

    if (slowResources.length > 0) {
      logger.warn('Performance bottlenecks identified', {
        action: 'performance_bottlenecks',
        bottlenecks: slowResources.slice(0, 5).map(r => ({
          name: r.name,
          type: r.type,
          loadTime: r.loadTime,
          size: r.size,
          critical: r.critical
        }))
      });
    }
  }

  public generateOptimizationReport(): void {
    const report = {
      webVitals: Object.fromEntries(this.webVitals),
      resourceSummary: {
        totalResources: this.resourceTimings.length,
        totalSize: this.resourceTimings.reduce((sum, r) => sum + r.size, 0),
        averageLoadTime: this.resourceTimings.reduce((sum, r) => sum + r.loadTime, 0) / this.resourceTimings.length || 0,
        criticalResources: this.resourceTimings.filter(r => r.critical).length
      },
      recommendations: this.generateRecommendations()
    };

    logger.info('Performance optimization report generated', {
      action: 'performance_report',
      report
    });

    return report;
  }

  private generateRecommendations(): string[] {
    const recommendations = [];

    // Web Vitals recommendations
    const lcp = this.webVitals.get('LCP');
    if (lcp && lcp > this.thresholds.largestContentfulPaint) {
      recommendations.push('Optimize Largest Contentful Paint by lazy loading images and improving server response times');
    }

    const fid = this.webVitals.get('FID');
    if (fid && fid > this.thresholds.firstInputDelay) {
      recommendations.push('Reduce First Input Delay by optimizing JavaScript execution and reducing main thread blocking');
    }

    const cls = this.webVitals.get('CLS');
    if (cls && cls > this.thresholds.cumulativeLayoutShift) {
      recommendations.push('Improve Cumulative Layout Shift by setting dimensions on images and avoiding content insertion above existing elements');
    }

    // Resource-based recommendations
    const largeScripts = this.resourceTimings.filter(r => r.type === 'script' && r.size > 100000);
    if (largeScripts.length > 0) {
      recommendations.push('Consider code splitting for large JavaScript bundles');
    }

    const unoptimizedImages = this.resourceTimings.filter(r => r.type === 'image' && r.size > 200000);
    if (unoptimizedImages.length > 0) {
      recommendations.push('Optimize images with modern formats (WebP, AVIF) and appropriate sizing');
    }

    return recommendations;
  }

  public measure(name: string, startMark: string, endMark: string): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (error) {
        logger.warn('Failed to create performance measure', {
          action: 'performance_measure_failed',
          name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  public mark(name: string): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        performance.mark(name);
      } catch (error) {
        logger.warn('Failed to create performance mark', {
          action: 'performance_mark_failed',
          name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  public getMetrics(): Record<string, number> {
    return Object.fromEntries(this.webVitals);
  }

  public cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.vitalsObserver) {
      this.vitalsObserver.disconnect();
    }
  }
}

// Global performance optimizer instance
export const performanceOptimizer = new PerformanceOptimizer();

// React hook for performance monitoring
export function usePerformanceMonitoring(componentName: string) {
  if (typeof window !== 'undefined') {
    performanceOptimizer.mark(`${componentName}-start`);
    
    return () => {
      performanceOptimizer.mark(`${componentName}-end`);
      performanceOptimizer.measure(`${componentName}-render`, `${componentName}-start`, `${componentName}-end`);
    };
  }
  
  return () => {}; // No-op for SSR
}

export { PerformanceOptimizer };