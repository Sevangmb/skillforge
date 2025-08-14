"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';

export function ClientPerformanceMonitor() {
  const [showMonitor, setShowMonitor] = useState(false);
  const [PerformanceMonitor, setPerformanceMonitor] = useState<React.ComponentType<any> | null>(null);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const loadMonitor = async () => {
    try {
      const performanceModule = await import('./PerformanceMonitor');
      setPerformanceMonitor(() => performanceModule.PerformanceMonitor);
      setShowMonitor(true);
    } catch (error) {
      console.warn('Failed to load PerformanceMonitor:', error);
    }
  };

  if (!showMonitor) {
    return (
      <Button
        onClick={loadMonitor}
        className="fixed bottom-4 right-4 z-50"
        size="sm"
        variant="outline"
      >
        <Activity className="w-4 h-4" />
      </Button>
    );
  }

  return PerformanceMonitor ? <PerformanceMonitor /> : null;
}