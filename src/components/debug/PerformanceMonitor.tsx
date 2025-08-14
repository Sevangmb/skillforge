// @ts-nocheck
/**
 * Performance Monitor Component
 * Real-time performance monitoring and optimization insights
 */

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Clock, Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { performanceOptimizer } from '@/lib/performance-optimizer';
import { useOptimizedRequest } from '@/lib/request-optimizer';

interface PerformanceStats {
  webVitals: Record<string, number>;
  resourceSummary: {
    totalResources: number;
    totalSize: number;
    averageLoadTime: number;
    criticalResources: number;
  };
  recommendations: string[];
}

interface RequestStats {
  totalRequests: number;
  batchedRequests: number;
  cachedRequests: number;
  duplicatesAvoided: number;
  averageResponseTime: number;
  batchEfficiencyRate: number;
  cacheSize: number;
  pendingBatches: number;
}

export function PerformanceMonitor() {
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [requestStats, setRequestStats] = useState<RequestStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const optimizedRequest = useOptimizedRequest();

  useEffect(() => {
    if (!autoRefresh) return;

    const updateStats = () => {
      try {
        // Get performance stats
        const perfReport = performanceOptimizer.generateOptimizationReport();
        if (perfReport) {
          setPerformanceStats(perfReport);
        }

        // Get request optimization stats
        const reqStats = optimizedRequest.getStats();
        setRequestStats(reqStats);
      } catch (error) {
        console.warn('Failed to update performance stats:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, optimizedRequest]);

  // Show monitor only in development or when explicitly enabled
  if (!isVisible && process.env.NODE_ENV === 'production') {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
        size="sm"
        variant="outline"
      >
        <Activity className="w-4 h-4" />
      </Button>
    );
  }

  if (!isVisible) return null;

  const getWebVitalStatus = (metric: string, value: number) => {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTI: { good: 3800, poor: 7300 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'neutral';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed top-4 right-4 w-96 max-h-[80vh] overflow-y-auto z-50 bg-background border border-border rounded-lg shadow-lg">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-lg">Performance Monitor</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                size="sm"
                variant={autoRefresh ? "default" : "outline"}
              >
                {autoRefresh ? <Zap className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="ghost"
              >
                ×
              </Button>
            </div>
          </div>
          <CardDescription>
            Real-time performance metrics and optimizations
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="web-vitals" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="web-vitals">Web Vitals</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="web-vitals" className="mt-4 space-y-4">
              {performanceStats?.webVitals && Object.keys(performanceStats.webVitals).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(performanceStats.webVitals).map(([metric, value]) => {
                    const status = getWebVitalStatus(metric, value);
                    return (
                      <div key={metric} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{metric}</Badge>
                          <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                            {value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(2)}s`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {status === 'good' && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {status === 'needs-improvement' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                          {status === 'poor' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        </div>
                      </div>
                    );
                  })}

                  {performanceStats.resourceSummary && (
                    <div className="mt-4 p-3 bg-muted rounded">
                      <h4 className="font-medium mb-2">Resource Summary</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>Resources: {performanceStats.resourceSummary.totalResources}</div>
                        <div>Total Size: {Math.round(performanceStats.resourceSummary.totalSize / 1024)}KB</div>
                        <div>Avg Load: {Math.round(performanceStats.resourceSummary.averageLoadTime)}ms</div>
                        <div>Critical: {performanceStats.resourceSummary.criticalResources}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No Web Vitals data available yet</p>
                  <p className="text-xs">Refresh the page to collect metrics</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="mt-4 space-y-4">
              {requestStats ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-muted rounded text-center">
                      <div className="text-2xl font-bold text-blue-600">{requestStats.totalRequests}</div>
                      <div className="text-xs text-muted-foreground">Total Requests</div>
                    </div>
                    <div className="p-2 bg-muted rounded text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(requestStats.batchEfficiencyRate)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Efficiency</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Batched Requests</span>
                      <span className="font-medium">{requestStats.batchedRequests}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cached Requests</span>
                      <span className="font-medium">{requestStats.cachedRequests}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Duplicates Avoided</span>
                      <span className="font-medium text-green-600">{requestStats.duplicatesAvoided}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Response Time</span>
                      <span className="font-medium">
                        {Math.round(requestStats.averageResponseTime)}ms
                      </span>
                    </div>
                  </div>

                  <Progress 
                    value={requestStats.batchEfficiencyRate} 
                    className="w-full"
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Cache Size: {requestStats.cacheSize}</span>
                    <span>Pending: {requestStats.pendingBatches}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No request optimization data</p>
                  <p className="text-xs">Make some API calls to see metrics</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="mt-4 space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Performance Recommendations</h4>
                {performanceStats?.recommendations && performanceStats.recommendations.length > 0 ? (
                  <div className="space-y-2">
                    {performanceStats.recommendations.map((rec, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No specific recommendations at this time.</p>
                )}

                <h4 className="font-medium mt-4">Request Optimization</h4>
                {requestStats && optimizedRequest.getRecommendations().length > 0 ? (
                  <div className="space-y-2">
                    {optimizedRequest.getRecommendations().map((rec, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <div className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Request optimization is working well!
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}