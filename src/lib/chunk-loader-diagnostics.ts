/**
 * Chunk Loader Diagnostics
 * Helps identify and resolve ChunkLoadError issues in Next.js applications
 */

export class ChunkLoaderDiagnostics {
  private static instance: ChunkLoaderDiagnostics;
  private chunkFailures = new Map<string, number>();
  private totalChunkLoads = 0;
  private successfulChunkLoads = 0;

  static getInstance(): ChunkLoaderDiagnostics {
    if (!this.instance) {
      this.instance = new ChunkLoaderDiagnostics();
    }
    return this.instance;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.setupErrorHandling();
      this.monitorChunkLoading();
    }
  }

  private setupErrorHandling(): void {
    // Monitor unhandled errors that might be chunk-related
    window.addEventListener('error', (event) => {
      if (event.filename && event.filename.includes('_next/static/chunks/')) {
        console.warn('Chunk loading error detected:', {
          filename: event.filename,
          message: event.message,
          lineno: event.lineno,
          colno: event.colno
        });
        
        const chunkName = this.extractChunkName(event.filename);
        this.recordChunkFailure(chunkName);
      }
    });

    // Monitor unhandled promise rejections (common with dynamic imports)
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      if (reason && reason.name === 'ChunkLoadError') {
        console.warn('ChunkLoadError detected:', reason);
        this.recordChunkFailure(reason.message || 'unknown-chunk');
        
        // Try to provide helpful diagnosis
        this.diagnoseChunkError(reason);
      }
    });
  }

  private monitorChunkLoading(): void {
    // Override webpack's chunk loading function if available
    if (typeof window !== 'undefined' && (window as any).__webpack_require__) {
      const webpackRequire = (window as any).__webpack_require__;
      
      if (webpackRequire.e) {
        const originalEnsure = webpackRequire.e;
        webpackRequire.e = (chunkId: string) => {
          this.totalChunkLoads++;
          console.debug(`Loading chunk: ${chunkId}`);
          
          return originalEnsure(chunkId)
            .then((result: any) => {
              this.successfulChunkLoads++;
              console.debug(`Successfully loaded chunk: ${chunkId}`);
              return result;
            })
            .catch((error: any) => {
              console.error(`Failed to load chunk: ${chunkId}`, error);
              this.recordChunkFailure(chunkId);
              throw error;
            });
        };
      }
    }
  }

  private extractChunkName(filename: string): string {
    const match = filename.match(/chunks\/([^\/]+)\./);
    return match ? match[1] : 'unknown';
  }

  private recordChunkFailure(chunkName: string): void {
    const currentFailures = this.chunkFailures.get(chunkName) || 0;
    this.chunkFailures.set(chunkName, currentFailures + 1);
  }

  private diagnoseChunkError(error: any): void {
    const diagnosis = {
      errorType: error.name,
      message: error.message,
      possibleCauses: [],
      recommendations: []
    };

    // Common causes and solutions
    if (error.message?.includes('Loading chunk') || error.message?.includes('Loading CSS chunk')) {
      diagnosis.possibleCauses.push(
        'Network connectivity issues',
        'CDN or static asset server problems', 
        'Browser cache corruption',
        'Webpack configuration issues'
      );
      
      diagnosis.recommendations.push(
        'Refresh the page and try again',
        'Clear browser cache and cookies',
        'Check network connectivity',
        'Verify static assets are being served correctly'
      );
    }

    if (error.message?.includes('dynamic import')) {
      diagnosis.possibleCauses.push(
        'Circular dependency in dynamic imports',
        'Import path resolution issues',
        'Module not found in chunk'
      );
      
      diagnosis.recommendations.push(
        'Check for circular dependencies in imports',
        'Verify import paths are correct',
        'Use React.lazy() for component imports'
      );
    }

    console.group('🔍 Chunk Load Error Diagnosis');
    console.table(diagnosis);
    console.groupEnd();
  }

  // Public API for getting diagnostics
  getStats() {
    return {
      totalChunkLoads: this.totalChunkLoads,
      successfulChunkLoads: this.successfulChunkLoads,
      failedChunkLoads: this.totalChunkLoads - this.successfulChunkLoads,
      successRate: this.totalChunkLoads > 0 ? 
        (this.successfulChunkLoads / this.totalChunkLoads) * 100 : 100,
      failuresByChunk: Object.fromEntries(this.chunkFailures),
      mostProblematicChunks: this.getMostProblematicChunks()
    };
  }

  private getMostProblematicChunks(): Array<{chunk: string, failures: number}> {
    return Array.from(this.chunkFailures.entries())
      .map(([chunk, failures]) => ({chunk, failures}))
      .sort((a, b) => b.failures - a.failures)
      .slice(0, 5);
  }

  // Method to test chunk loading health
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    report: any;
  }> {
    const stats = this.getStats();
    
    let status: 'healthy' | 'degraded' | 'critical';
    if (stats.successRate >= 95) {
      status = 'healthy';
    } else if (stats.successRate >= 85) {
      status = 'degraded';
    } else {
      status = 'critical';
    }

    return {
      status,
      report: {
        ...stats,
        timestamp: new Date().toISOString(),
        recommendations: this.generateRecommendations(stats)
      }
    };
  }

  private generateRecommendations(stats: any): string[] {
    const recommendations = [];

    if (stats.successRate < 95) {
      recommendations.push('Monitor network connectivity and CDN performance');
    }

    if (stats.failedChunkLoads > 0) {
      recommendations.push('Consider implementing chunk retry mechanism');
      recommendations.push('Add fallback for critical chunks');
    }

    if (stats.mostProblematicChunks.length > 0) {
      recommendations.push(`Focus on fixing chunks: ${stats.mostProblematicChunks.map((c: any) => c.chunk).join(', ')}`);
    }

    return recommendations;
  }

  // Utility to retry failed chunk loads
  async retryChunkLoad(chunkId: string, maxRetries: number = 3): Promise<any> {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        if (typeof window !== 'undefined' && (window as any).__webpack_require__) {
          const result = await (window as any).__webpack_require__.e(chunkId);
          console.log(`Successfully retried chunk ${chunkId} on attempt ${i + 1}`);
          return result;
        }
      } catch (error) {
        lastError = error;
        console.warn(`Retry ${i + 1}/${maxRetries} failed for chunk ${chunkId}:`, error);
        
        // Wait with exponential backoff before retry
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw lastError;
  }
}

// Global instance
export const chunkLoaderDiagnostics = ChunkLoaderDiagnostics.getInstance();

// React hook for monitoring chunks in components
export function useChunkLoadingStats() {
  if (typeof window === 'undefined') {
    return {
      stats: null,
      healthCheck: async () => ({ status: 'healthy' as const, report: null })
    };
  }

  return {
    stats: chunkLoaderDiagnostics.getStats(),
    healthCheck: () => chunkLoaderDiagnostics.performHealthCheck(),
    retryChunk: (chunkId: string) => chunkLoaderDiagnostics.retryChunkLoad(chunkId)
  };
}