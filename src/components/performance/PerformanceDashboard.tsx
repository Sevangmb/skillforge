"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Clock, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Database,
  Monitor,
  Cpu,
  HardDrive
} from 'lucide-react';
import { cacheManager } from '@/lib/cache-manager';
import { performanceMonitor } from '@/lib/firebase-optimizer';
import { useMemoryMonitor, usePerformanceTiming } from '@/hooks/usePerformanceOptimized';

interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay  
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
  
  // Bundle metrics
  bundleSize?: number;
  initialLoad?: number;
  
  // Cache metrics
  cacheHitRate?: number;
  cacheSize?: number;
  
  // Memory metrics
  jsHeapSize?: number;
  totalJSHeapSize?: number;
  
  // Network metrics
  connectionType?: string;
  effectiveType?: string;
}

const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isLoading, setIsLoading] = useState(true);
  const memoryInfo = useMemoryMonitor();
  const { start: startTiming, end: endTiming } = usePerformanceTiming('dashboard-render');

  useEffect(() => {
    startTiming();
    return () => {
      endTiming();
    };
  }, [startTiming, endTiming]);

  useEffect(() => {
    const collectMetrics = async () => {
      const newMetrics: PerformanceMetrics = {};

      // Core Web Vitals
      if ('PerformanceObserver' in window) {
        try {
          // LCP
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            if (lastEntry) {
              newMetrics.LCP = lastEntry.startTime;
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // FCP
          const fcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            if (lastEntry) {
              newMetrics.FCP = lastEntry.startTime;
            }
          });
          fcpObserver.observe({ entryTypes: ['paint'] });

          // CLS
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            newMetrics.CLS = clsValue;
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

        } catch (error) {
          console.warn('Performance Observer not fully supported:', error);
        }
      }

      // Navigation timing
      if (performance.getEntriesByType) {
        const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navEntries.length > 0) {
          const nav = navEntries[0];
          newMetrics.TTFB = nav.responseStart - nav.requestStart;
          newMetrics.initialLoad = nav.loadEventEnd - nav.fetchStart;
        }
      }

      // Memory info
      if (memoryInfo) {
        newMetrics.jsHeapSize = memoryInfo.used;
        newMetrics.totalJSHeapSize = memoryInfo.total;
      }

      // Cache metrics
      const cacheStats = cacheManager.getStats();
      newMetrics.cacheHitRate = cacheStats.hitRate;
      newMetrics.cacheSize = cacheStats.memoryUsage;

      // Network info
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        newMetrics.connectionType = connection.type;
        newMetrics.effectiveType = connection.effectiveType;
      }

      setMetrics(newMetrics);
      setIsLoading(false);
    };

    collectMetrics();

    // Update metrics periodically
    const interval = setInterval(collectMetrics, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [memoryInfo]);

  const getScoreColor = (score: number, thresholds: { good: number; needs: number }): string => {
    if (score <= thresholds.good) return 'text-green-600';
    if (score <= thresholds.needs) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number, thresholds: { good: number; needs: number }): string => {
    if (score <= thresholds.good) return 'Good';
    if (score <= thresholds.needs) return 'Needs Improvement';
    return 'Poor';
  };

  const getScoreVariant = (score: number, thresholds: { good: number; needs: number }): "default" | "secondary" | "destructive" => {
    if (score <= thresholds.good) return 'default';
    if (score <= thresholds.needs) return 'secondary';
    return 'destructive';
  };

  const coreWebVitals = useMemo(() => [
    {
      name: 'Largest Contentful Paint',
      value: metrics.LCP,
      unit: 'ms',
      thresholds: { good: 2500, needs: 4000 },
      icon: <Monitor className="h-4 w-4" />,
      description: 'Loading performance'
    },
    {
      name: 'First Input Delay',
      value: metrics.FID,
      unit: 'ms',
      thresholds: { good: 100, needs: 300 },
      icon: <Zap className="h-4 w-4" />,
      description: 'Interactivity'
    },
    {
      name: 'Cumulative Layout Shift',
      value: metrics.CLS,
      unit: '',
      thresholds: { good: 0.1, needs: 0.25 },
      icon: <Activity className="h-4 w-4" />,
      description: 'Visual stability'
    }
  ], [metrics]);

  const additionalMetrics = useMemo(() => [
    {
      name: 'First Contentful Paint',
      value: metrics.FCP,
      unit: 'ms',
      thresholds: { good: 1800, needs: 3000 },
      icon: <Clock className="h-4 w-4" />
    },
    {
      name: 'Time to First Byte',
      value: metrics.TTFB,
      unit: 'ms',
      thresholds: { good: 800, needs: 1800 },
      icon: <TrendingUp className="h-4 w-4" />
    }
  ], [metrics]);

  const resourceMetrics = useMemo(() => [
    {
      name: 'Cache Hit Rate',
      value: metrics.cacheHitRate,
      unit: '%',
      icon: <Database className="h-4 w-4" />,
      isGood: (metrics.cacheHitRate || 0) > 80
    },
    {
      name: 'JS Heap Size',
      value: metrics.jsHeapSize ? Math.round(metrics.jsHeapSize / 1024 / 1024) : undefined,
      unit: 'MB',
      icon: <Cpu className="h-4 w-4" />,
      isGood: (metrics.jsHeapSize || 0) < 50 * 1024 * 1024
    },
    {
      name: 'Cache Size',
      value: metrics.cacheSize ? Math.round(metrics.cacheSize / 1024) : undefined,
      unit: 'KB',
      icon: <HardDrive className="h-4 w-4" />,
      isGood: (metrics.cacheSize || 0) < 5 * 1024 * 1024
    }
  ], [metrics]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Activity className="h-6 w-6 animate-spin mr-2" />
            <span>Collecting performance metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Dashboard
          </CardTitle>
          <CardDescription>
            Real-time performance metrics and optimization insights
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="vitals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coreWebVitals.map((vital) => (
              <Card key={vital.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {vital.icon}
                    {vital.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {vital.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {vital.value !== undefined 
                          ? `${Math.round(vital.value * 100) / 100}${vital.unit}`
                          : 'N/A'
                        }
                      </span>
                      {vital.value !== undefined && (
                        <Badge variant={getScoreVariant(vital.value, vital.thresholds)}>
                          {getScoreBadge(vital.value, vital.thresholds)}
                        </Badge>
                      )}
                    </div>
                    {vital.value !== undefined && (
                      <Progress 
                        value={Math.min((vital.value / vital.thresholds.needs) * 100, 100)} 
                        className="h-2"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {additionalMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {metric.icon}
                      <span className="font-medium">{metric.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {metric.value !== undefined 
                          ? `${Math.round(metric.value * 100) / 100}${metric.unit}`
                          : 'N/A'
                        }
                      </div>
                      {metric.value !== undefined && (
                        <Badge 
                          size="sm"
                          variant={getScoreVariant(metric.value, metric.thresholds)}
                        >
                          {getScoreBadge(metric.value, metric.thresholds)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resourceMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {metric.icon}
                      <span className="font-medium">{metric.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {metric.value !== undefined 
                          ? `${metric.value}${metric.unit}`
                          : 'N/A'
                        }
                      </div>
                      {metric.value !== undefined && (
                        <Badge 
                          size="sm"
                          variant={metric.isGood ? 'default' : 'secondary'}
                        >
                          {metric.isGood ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          {metric.isGood ? 'Good' : 'Needs Attention'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {memoryInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Used</span>
                    <span>{Math.round(memoryInfo.used / 1024 / 1024)} MB</span>
                  </div>
                  <Progress value={memoryInfo.percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0 MB</span>
                    <span>{Math.round(memoryInfo.total / 1024 / 1024)} MB</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Connection Type</span>
                  <Badge variant="outline">
                    {metrics.connectionType || 'Unknown'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Effective Type</span>
                  <Badge variant="outline">
                    {metrics.effectiveType || 'Unknown'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {metrics.initialLoad && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Initial Load Time</span>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {Math.round(metrics.initialLoad)} ms
                    </div>
                    <Badge 
                      size="sm"
                      variant={metrics.initialLoad < 3000 ? 'default' : 'secondary'}
                    >
                      {metrics.initialLoad < 3000 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Performance recommendations */}
      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertDescription>
          <strong>Performance Optimizations Active:</strong> Dynamic imports, caching, and bundle splitting are improving your app performance.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default PerformanceMetrics;