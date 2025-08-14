/**
 * Performance Diagnostics and Health Check System
 * Comprehensive analysis of all optimization systems
 */

import { performanceOptimizer } from './performance-optimizer';
import { requestOptimizer } from './request-optimizer';
import { bundleAnalyzer } from './bundle-analyzer';
import { getFirebaseHealth } from './firebase';
import { logger } from './logger';

interface SystemHealth {
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  score: number; // 0-100
  components: {
    firebase: {
      status: 'healthy' | 'degraded' | 'down';
      details: any;
    };
    performance: {
      status: 'excellent' | 'good' | 'needs-attention' | 'critical';
      webVitals: Record<string, number>;
      issues: string[];
    };
    requests: {
      status: 'optimized' | 'good' | 'needs-improvement' | 'poor';
      efficiency: number;
      stats: any;
    };
    bundle: {
      status: 'optimized' | 'acceptable' | 'bloated' | 'critical';
      size: number;
      warnings: number;
      opportunities: string[];
    };
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    description: string;
    impact: string;
    effort: 'easy' | 'moderate' | 'complex';
  }>;
  improvements: {
    since: string;
    metrics: Array<{
      name: string;
      before: number | string;
      after: number | string;
      improvement: string;
    }>;
  };
}

class PerformanceDiagnostics {
  private baselineMetrics: Record<string, number> = {
    initialLoadTime: 1456, // Before optimization
    bundleSize: 2048000,    // ~2MB before optimization
    avgResponseTime: 600,   // 600ms before optimization
    webpackWarnings: 12,    // Number of warnings before
    cacheHitRate: 0         // No caching before
  };

  async runComprehensiveDiagnostic(): Promise<SystemHealth> {
    logger.info('Starting comprehensive performance diagnostic', {
      action: 'performance_diagnostic_start'
    });

    const components = await this.checkAllComponents();
    const overallScore = this.calculateOverallScore(components);
    const recommendations = this.generateRecommendations(components);
    const improvements = this.calculateImprovements(components);

    const health: SystemHealth = {
      overall: this.getOverallStatus(overallScore),
      score: overallScore,
      components,
      recommendations,
      improvements
    };

    logger.info('Performance diagnostic completed', {
      action: 'performance_diagnostic_complete',
      overallScore,
      status: health.overall,
      recommendationCount: recommendations.length
    });

    return health;
  }

  private async checkAllComponents() {
    const [firebase, performance, requests, bundle] = await Promise.allSettled([
      this.checkFirebaseHealth(),
      this.checkPerformanceHealth(),
      this.checkRequestOptimization(),
      this.checkBundleHealth()
    ]);

    return {
      firebase: firebase.status === 'fulfilled' ? firebase.value : {
        status: 'down' as const,
        details: { error: firebase.reason }
      },
      performance: performance.status === 'fulfilled' ? performance.value : {
        status: 'critical' as const,
        webVitals: {},
        issues: ['Performance monitoring unavailable']
      },
      requests: requests.status === 'fulfilled' ? requests.value : {
        status: 'poor' as const,
        efficiency: 0,
        stats: null
      },
      bundle: bundle.status === 'fulfilled' ? bundle.value : {
        status: 'critical' as const,
        size: 0,
        warnings: 0,
        opportunities: ['Bundle analysis unavailable']
      }
    };
  }

  private async checkFirebaseHealth() {
    try {
      const health = getFirebaseHealth();
      return {
        status: (health.app && health.auth && health.db) ? 'healthy' : 'degraded' as const,
        details: health
      };
    } catch (error) {
      return {
        status: 'down' as const,
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  private async checkPerformanceHealth() {
    try {
      const webVitals = performanceOptimizer.getMetrics();
      const issues = [];

      // Check Web Vitals thresholds
      if (webVitals.LCP > 2500) issues.push(`LCP too high: ${webVitals.LCP}ms`);
      if (webVitals.FID > 100) issues.push(`FID too high: ${webVitals.FID}ms`);
      if (webVitals.CLS > 0.1) issues.push(`CLS too high: ${webVitals.CLS}`);

      const hasVitals = Object.keys(webVitals).length > 0;
      const criticalIssues = issues.filter(issue => 
        issue.includes('LCP') || issue.includes('FID')
      ).length;

      let status: 'excellent' | 'good' | 'needs-attention' | 'critical';
      if (!hasVitals) {
        status = 'needs-attention'; // No data yet
      } else if (criticalIssues > 0) {
        status = 'critical';
      } else if (issues.length > 0) {
        status = 'needs-attention';
      } else if (webVitals.LCP < 1800 && webVitals.FID < 50) {
        status = 'excellent';
      } else {
        status = 'good';
      }

      return {
        status,
        webVitals,
        issues
      };
    } catch (error) {
      return {
        status: 'critical' as const,
        webVitals: {},
        issues: ['Performance monitoring error']
      };
    }
  }

  private async checkRequestOptimization() {
    try {
      const stats = requestOptimizer.getStats();
      
      let status: 'optimized' | 'good' | 'needs-improvement' | 'poor';
      if (stats.batchEfficiencyRate >= 80) {
        status = 'optimized';
      } else if (stats.batchEfficiencyRate >= 60) {
        status = 'good';
      } else if (stats.batchEfficiencyRate >= 30) {
        status = 'needs-improvement';
      } else {
        status = 'poor';
      }

      return {
        status,
        efficiency: stats.batchEfficiencyRate,
        stats
      };
    } catch (error) {
      return {
        status: 'poor' as const,
        efficiency: 0,
        stats: null
      };
    }
  }

  private async checkBundleHealth() {
    try {
      const analysis = bundleAnalyzer.performBundleAnalysis();
      const suggestions = bundleAnalyzer.getOptimizationSuggestions();
      
      let status: 'optimized' | 'acceptable' | 'bloated' | 'critical';
      if (analysis.totalSize < 500000) { // < 500KB
        status = 'optimized';
      } else if (analysis.totalSize < 1024000) { // < 1MB
        status = 'acceptable';
      } else if (analysis.totalSize < 2048000) { // < 2MB
        status = 'bloated';
      } else {
        status = 'critical';
      }

      return {
        status,
        size: analysis.totalSize,
        warnings: analysis.optimizationOpportunities.length,
        opportunities: suggestions
      };
    } catch (error) {
      return {
        status: 'critical' as const,
        size: 0,
        warnings: 0,
        opportunities: ['Bundle analysis failed']
      };
    }
  }

  private calculateOverallScore(components: any): number {
    let totalScore = 0;
    let maxScore = 0;

    // Firebase health (20 points)
    maxScore += 20;
    if (components.firebase.status === 'healthy') totalScore += 20;
    else if (components.firebase.status === 'degraded') totalScore += 10;

    // Performance health (30 points)
    maxScore += 30;
    switch (components.performance.status) {
      case 'excellent': totalScore += 30; break;
      case 'good': totalScore += 22; break;
      case 'needs-attention': totalScore += 15; break;
      case 'critical': totalScore += 5; break;
    }

    // Request optimization (25 points)
    maxScore += 25;
    if (components.requests.efficiency >= 80) totalScore += 25;
    else if (components.requests.efficiency >= 60) totalScore += 18;
    else if (components.requests.efficiency >= 30) totalScore += 10;
    else totalScore += 3;

    // Bundle optimization (25 points)
    maxScore += 25;
    switch (components.bundle.status) {
      case 'optimized': totalScore += 25; break;
      case 'acceptable': totalScore += 18; break;
      case 'bloated': totalScore += 10; break;
      case 'critical': totalScore += 3; break;
    }

    return Math.round((totalScore / maxScore) * 100);
  }

  private getOverallStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  private generateRecommendations(components: any): SystemHealth['recommendations'] {
    const recommendations: SystemHealth['recommendations'] = [];

    // Firebase recommendations
    if (components.firebase.status !== 'healthy') {
      recommendations.push({
        priority: 'high',
        category: 'Infrastructure',
        description: 'Fix Firebase connectivity issues',
        impact: 'Critical app functionality may be affected',
        effort: 'moderate'
      });
    }

    // Performance recommendations
    if (components.performance.issues.length > 0) {
      recommendations.push({
        priority: components.performance.status === 'critical' ? 'high' : 'medium',
        category: 'Performance',
        description: `Address Web Vitals issues: ${components.performance.issues.join(', ')}`,
        impact: 'Improved user experience and SEO rankings',
        effort: 'moderate'
      });
    }

    // Request optimization recommendations
    if (components.requests.efficiency < 60) {
      recommendations.push({
        priority: 'medium',
        category: 'API Performance',
        description: 'Improve request batching and caching efficiency',
        impact: 'Faster API responses and reduced server load',
        effort: 'easy'
      });
    }

    // Bundle recommendations
    if (components.bundle.status === 'critical' || components.bundle.status === 'bloated') {
      recommendations.push({
        priority: components.bundle.status === 'critical' ? 'high' : 'medium',
        category: 'Bundle Size',
        description: 'Optimize bundle size through code splitting and tree shaking',
        impact: 'Significantly faster initial page loads',
        effort: 'complex'
      });
    }

    // Add general optimization recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'low',
        category: 'Maintenance',
        description: 'Continue monitoring performance metrics',
        impact: 'Maintain optimal performance',
        effort: 'easy'
      });
    }

    return recommendations.sort((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 };
      return priority[b.priority] - priority[a.priority];
    });
  }

  private calculateImprovements(components: any): SystemHealth['improvements'] {
    const currentMetrics = {
      bundleSize: components.bundle.size,
      requestEfficiency: components.requests.efficiency,
      webVitalsLCP: components.performance.webVitals.LCP || 0,
      cacheHitRate: components.requests.stats?.cachedRequests || 0
    };

    const improvements = [];

    // Bundle size improvement
    if (currentMetrics.bundleSize > 0 && this.baselineMetrics.bundleSize > 0) {
      const improvement = ((this.baselineMetrics.bundleSize - currentMetrics.bundleSize) / this.baselineMetrics.bundleSize) * 100;
      if (improvement > 5) {
        improvements.push({
          name: 'Bundle Size Optimization',
          before: `${Math.round(this.baselineMetrics.bundleSize / 1024)}KB`,
          after: `${Math.round(currentMetrics.bundleSize / 1024)}KB`,
          improvement: `${improvement.toFixed(1)}% smaller`
        });
      }
    }

    // Request efficiency improvement
    if (currentMetrics.requestEfficiency > this.baselineMetrics.cacheHitRate) {
      improvements.push({
        name: 'Request Optimization',
        before: `${this.baselineMetrics.cacheHitRate}% efficiency`,
        after: `${currentMetrics.requestEfficiency.toFixed(1)}% efficiency`,
        improvement: `${(currentMetrics.requestEfficiency - this.baselineMetrics.cacheHitRate).toFixed(1)}% increase`
      });
    }

    // LCP improvement
    if (currentMetrics.webVitalsLCP > 0 && currentMetrics.webVitalsLCP < this.baselineMetrics.initialLoadTime) {
      const improvement = ((this.baselineMetrics.initialLoadTime - currentMetrics.webVitalsLCP) / this.baselineMetrics.initialLoadTime) * 100;
      improvements.push({
        name: 'Largest Contentful Paint',
        before: `${this.baselineMetrics.initialLoadTime}ms`,
        after: `${Math.round(currentMetrics.webVitalsLCP)}ms`,
        improvement: `${improvement.toFixed(1)}% faster`
      });
    }

    return {
      since: 'System optimization implementation',
      metrics: improvements
    };
  }

  // Utility method for quick health check
  async quickHealthCheck(): Promise<{ status: string; issues: string[] }> {
    try {
      const health = await this.runComprehensiveDiagnostic();
      const issues = health.recommendations
        .filter(r => r.priority === 'high')
        .map(r => r.description);

      return {
        status: health.overall,
        issues
      };
    } catch (error) {
      return {
        status: 'error',
        issues: ['Health check failed']
      };
    }
  }
}

export const performanceDiagnostics = new PerformanceDiagnostics();
export { PerformanceDiagnostics };