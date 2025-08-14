/**
 * Performance Metrics API
 * Collects and aggregates performance metrics from the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface MetricData {
  type: string;
  name: string;
  duration?: number;
  value?: number;
  success?: boolean;
  timestamp: number;
  userAgent?: string;
  url?: string;
}

// In-memory storage for metrics (in production, use Redis/Database)
const metricsStorage = new Map<string, MetricData[]>();
const metricsAggregation = new Map<string, {
  count: number;
  totalDuration: number;
  avgDuration: number;
  successRate: number;
  failures: number;
  lastUpdated: number;
}>();

export async function POST(request: NextRequest) {
  try {
    const metric: MetricData = await request.json();
    
    // Validate metric data
    if (!metric.type || !metric.name || !metric.timestamp) {
      return NextResponse.json(
        { error: 'Missing required metric fields: type, name, timestamp' },
        { status: 400 }
      );
    }

    // Add user agent and URL for context
    metric.userAgent = request.headers.get('user-agent') || undefined;
    metric.url = request.headers.get('referer') || undefined;

    // Store raw metric
    const metricKey = `${metric.type}:${metric.name}`;
    if (!metricsStorage.has(metricKey)) {
      metricsStorage.set(metricKey, []);
    }
    
    const metrics = metricsStorage.get(metricKey)!;
    metrics.push(metric);
    
    // Keep only last 1000 metrics per type for memory efficiency
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }

    // Update aggregations
    updateAggregations(metricKey, metric);

    // Log interesting metrics
    if (metric.type === 'ai_operation' && metric.duration && metric.duration > 1000) {
      logger.warn('Slow AI operation detected', {
        action: 'slow_ai_operation',
        name: metric.name,
        duration: metric.duration,
        success: metric.success
      });
    }

    if (metric.type === 'web_vital' && metric.value) {
      logger.info('Web Vital recorded', {
        action: 'web_vital_metric',
        name: metric.name,
        value: metric.value
      });
    }

    return NextResponse.json({ status: 'received' });

  } catch (error) {
    logger.error('Failed to process metric', {
      action: 'metrics_processing_error',
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: 'Failed to process metric' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metricType = searchParams.get('type');
    const format = searchParams.get('format') || 'summary';

    if (format === 'aggregated') {
      // Return aggregated metrics
      const aggregatedData = Object.fromEntries(metricsAggregation.entries());
      
      if (metricType) {
        const filteredData = Object.fromEntries(
          Object.entries(aggregatedData).filter(([key]) => key.startsWith(metricType))
        );
        return NextResponse.json(filteredData);
      }
      
      return NextResponse.json(aggregatedData);
    }

    if (format === 'summary') {
      // Return performance summary
      const summary = generatePerformanceSummary();
      return NextResponse.json(summary);
    }

    // Return raw metrics (limited)
    if (metricType) {
      const rawMetrics: MetricData[] = [];
      for (const [key, metrics] of metricsStorage.entries()) {
        if (key.startsWith(metricType)) {
          rawMetrics.push(...metrics.slice(-100)); // Last 100 metrics
        }
      }
      return NextResponse.json(rawMetrics);
    }

    return NextResponse.json({ 
      message: 'Specify type parameter or use format=summary' 
    });

  } catch (error) {
    logger.error('Failed to retrieve metrics', {
      action: 'metrics_retrieval_error',
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    );
  }
}

function updateAggregations(metricKey: string, metric: MetricData) {
  if (!metricsAggregation.has(metricKey)) {
    metricsAggregation.set(metricKey, {
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      successRate: 0,
      failures: 0,
      lastUpdated: Date.now()
    });
  }

  const agg = metricsAggregation.get(metricKey)!;
  agg.count++;
  
  if (metric.duration) {
    agg.totalDuration += metric.duration;
    agg.avgDuration = agg.totalDuration / agg.count;
  }
  
  if (metric.success === false) {
    agg.failures++;
  }
  
  agg.successRate = ((agg.count - agg.failures) / agg.count) * 100;
  agg.lastUpdated = Date.now();
}

function generatePerformanceSummary() {
  const summary = {
    totalMetrics: 0,
    aiOperations: {
      count: 0,
      avgDuration: 0,
      successRate: 0
    },
    webVitals: {
      lcp: { count: 0, avgValue: 0 },
      fid: { count: 0, avgValue: 0 },
      cls: { count: 0, avgValue: 0 }
    },
    requestOptimization: {
      batchedRequests: 0,
      cacheHits: 0,
      avgResponseTime: 0
    },
    topSlowOperations: [] as Array<{
      name: string;
      avgDuration: number;
      count: number;
      successRate: number;
    }>
  };

  // Calculate totals and aggregations
  for (const [key, agg] of metricsAggregation.entries()) {
    summary.totalMetrics += agg.count;

    if (key.startsWith('ai_operation:')) {
      summary.aiOperations.count += agg.count;
      summary.aiOperations.avgDuration += agg.avgDuration * agg.count;
      summary.aiOperations.successRate += agg.successRate * agg.count;
    }

    if (key.includes('web_vital:')) {
      const vitalName = key.split(':')[1];
      if (vitalName === 'LCP') {
        summary.webVitals.lcp.count += agg.count;
        summary.webVitals.lcp.avgValue += agg.avgDuration * agg.count;
      } else if (vitalName === 'FID') {
        summary.webVitals.fid.count += agg.count;
        summary.webVitals.fid.avgValue += agg.avgDuration * agg.count;
      } else if (vitalName === 'CLS') {
        summary.webVitals.cls.count += agg.count;
        summary.webVitals.cls.avgValue += agg.avgDuration * agg.count;
      }
    }

    // Top slow operations
    if (agg.avgDuration > 500) {
      summary.topSlowOperations.push({
        name: key,
        avgDuration: agg.avgDuration,
        count: agg.count,
        successRate: agg.successRate
      });
    }
  }

  // Calculate averages
  if (summary.aiOperations.count > 0) {
    summary.aiOperations.avgDuration /= summary.aiOperations.count;
    summary.aiOperations.successRate /= summary.aiOperations.count;
  }

  if (summary.webVitals.lcp.count > 0) {
    summary.webVitals.lcp.avgValue /= summary.webVitals.lcp.count;
  }
  if (summary.webVitals.fid.count > 0) {
    summary.webVitals.fid.avgValue /= summary.webVitals.fid.count;
  }
  if (summary.webVitals.cls.count > 0) {
    summary.webVitals.cls.avgValue /= summary.webVitals.cls.count;
  }

  // Sort slow operations
  summary.topSlowOperations.sort((a, b) => b.avgDuration - a.avgDuration);
  summary.topSlowOperations = summary.topSlowOperations.slice(0, 10);

  return summary;
}