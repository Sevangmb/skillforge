/**
 * Bundle Analyzer and Optimization System
 * Analyzes bundle composition, identifies optimization opportunities, and provides actionable insights
 */

import { logger } from './logger';

interface BundleAnalysis {
  totalSize: number;
  chunkSizes: Record<string, number>;
  duplicateDependencies: string[];
  unusedExports: string[];
  heavyDependencies: Array<{ name: string; size: number; alternatives?: string[] }>;
  optimizationOpportunities: Array<{ type: string; description: string; impact: 'high' | 'medium' | 'low' }>;
}

interface ModuleInfo {
  name: string;
  size: number;
  chunks: string[];
  dependencies: string[];
  isVendor: boolean;
  isAsync: boolean;
}

class BundleAnalyzer {
  private modules = new Map<string, ModuleInfo>();
  private chunks = new Map<string, number>();
  private webpackWarnings: string[] = [];
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeBundleAnalysis();
      this.monitorWebpackWarnings();
    }
  }

  private initializeBundleAnalysis(): void {
    // Analyze current bundle using webpack stats if available
    if ((window as any).__WEBPACK_BUILD_INFO__) {
      const buildInfo = (window as any).__WEBPACK_BUILD_INFO__;
      this.analyzeBuildInfo(buildInfo);
    }

    // Monitor dynamic imports and code splitting
    this.monitorDynamicImports();
    
    // Schedule periodic bundle analysis
    setTimeout(() => {
      this.performBundleAnalysis();
    }, 2000);
  }

  private monitorWebpackWarnings(): void {
    // Capture webpack warnings from console
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      
      if (this.isWebpackWarning(message)) {
        this.webpackWarnings.push(message);
        this.analyzeWebpackWarning(message);
      }
      
      originalWarn.apply(console, args);
    };
  }

  private isWebpackWarning(message: string): boolean {
    const webpackWarningPatterns = [
      /require\.extensions/,
      /Module not found/,
      /Can't resolve/,
      /Critical dependency/,
      /the request of a dependency is an expression/,
      /handlebars.*loader/i,
      /@genkit-ai/i
    ];

    return webpackWarningPatterns.some(pattern => pattern.test(message));
  }

  private analyzeWebpackWarning(warning: string): void {
    let analysis = { type: 'unknown', severity: 'medium' as const, solution: '' };

    if (/require\.extensions/.test(warning)) {
      analysis = {
        type: 'compatibility_issue',
        severity: 'low',
        solution: 'Add webpack configuration to handle require.extensions or use dynamic imports'
      };
    } else if (/Module not found.*@genkit-ai\/firebase/.test(warning)) {
      analysis = {
        type: 'missing_dependency',
        severity: 'medium', 
        solution: 'Install @genkit-ai/firebase or configure webpack to ignore optional dependencies'
      };
    } else if (/handlebars/.test(warning)) {
      analysis = {
        type: 'loader_issue',
        severity: 'low',
        solution: 'Configure handlebars-loader or exclude from bundle using webpack externals'
      };
    }

    logger.warn('Webpack warning analyzed', {
      action: 'webpack_warning_analysis',
      warning: warning.substring(0, 200),
      analysis
    });
  }

  private monitorDynamicImports(): void {
    // Monitor dynamic imports for code splitting effectiveness
    const originalImport = (window as any).__webpack_require__.e;
    
    if (originalImport) {
      (window as any).__webpack_require__.e = (chunkId: string) => {
        const startTime = performance.now();
        
        return originalImport(chunkId).then(
          (result: any) => {
            const loadTime = performance.now() - startTime;
            this.recordChunkLoad(chunkId, loadTime, true);
            return result;
          },
          (error: any) => {
            const loadTime = performance.now() - startTime;
            this.recordChunkLoad(chunkId, loadTime, false);
            throw error;
          }
        );
      };
    }
  }

  private recordChunkLoad(chunkId: string, loadTime: number, success: boolean): void {
    logger.info('Dynamic chunk loaded', {
      action: 'chunk_load',
      chunkId,
      loadTime,
      success
    });

    if (loadTime > 1000) {
      logger.warn('Slow chunk loading detected', {
        action: 'slow_chunk_load',
        chunkId,
        loadTime,
        recommendation: 'Consider preloading critical chunks or optimizing chunk size'
      });
    }
  }

  private analyzeBuildInfo(buildInfo: any): void {
    if (buildInfo.modules) {
      for (const moduleInfo of buildInfo.modules) {
        this.modules.set(moduleInfo.name, {
          name: moduleInfo.name,
          size: moduleInfo.size || 0,
          chunks: moduleInfo.chunks || [],
          dependencies: moduleInfo.dependencies || [],
          isVendor: moduleInfo.name.includes('node_modules'),
          isAsync: moduleInfo.async || false
        });
      }
    }

    if (buildInfo.chunks) {
      for (const chunk of buildInfo.chunks) {
        this.chunks.set(chunk.name, chunk.size);
      }
    }
  }

  public performBundleAnalysis(): BundleAnalysis {
    const analysis: BundleAnalysis = {
      totalSize: this.calculateTotalSize(),
      chunkSizes: Object.fromEntries(this.chunks),
      duplicateDependencies: this.findDuplicateDependencies(),
      unusedExports: this.findUnusedExports(),
      heavyDependencies: this.identifyHeavyDependencies(),
      optimizationOpportunities: this.generateOptimizationOpportunities()
    };

    logger.info('Bundle analysis completed', {
      action: 'bundle_analysis',
      totalSize: analysis.totalSize,
      chunkCount: Object.keys(analysis.chunkSizes).length,
      optimizationCount: analysis.optimizationOpportunities.length
    });

    return analysis;
  }

  private calculateTotalSize(): number {
    return Array.from(this.chunks.values()).reduce((sum, size) => sum + size, 0);
  }

  private findDuplicateDependencies(): string[] {
    const dependencies = new Map<string, string[]>();
    
    for (const [moduleName, moduleInfo] of this.modules) {
      for (const dep of moduleInfo.dependencies) {
        if (!dependencies.has(dep)) {
          dependencies.set(dep, []);
        }
        dependencies.get(dep)!.push(moduleName);
      }
    }

    return Array.from(dependencies.entries())
      .filter(([, modules]) => modules.length > 1)
      .map(([dep]) => dep);
  }

  private findUnusedExports(): string[] {
    // Simplified unused export detection
    // In a real implementation, this would require AST analysis
    const exports = new Set<string>();
    const imports = new Set<string>();

    for (const moduleInfo of this.modules.values()) {
      // This is a simplified heuristic
      if (moduleInfo.name.includes('unused') || moduleInfo.size === 0) {
        exports.add(moduleInfo.name);
      }
    }

    return Array.from(exports);
  }

  private identifyHeavyDependencies(): Array<{ name: string; size: number; alternatives?: string[] }> {
    const heavyDeps = Array.from(this.modules.values())
      .filter(module => module.isVendor && module.size > 100000) // > 100KB
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .map(module => ({
        name: this.extractPackageName(module.name),
        size: module.size,
        alternatives: this.suggestAlternatives(module.name)
      }));

    return heavyDeps;
  }

  private extractPackageName(modulePath: string): string {
    const match = modulePath.match(/node_modules\/(@?[^\/]+(?:\/[^\/]+)?)/);
    return match ? match[1] : modulePath;
  }

  private suggestAlternatives(moduleName: string): string[] {
    const alternatives: Record<string, string[]> = {
      'moment': ['date-fns', 'dayjs'],
      'lodash': ['ramda', 'native ES6 methods'],
      'axios': ['fetch API', 'ky'],
      'react-router': ['reach-router', 'next/router'],
      'material-ui': ['react-bootstrap', 'tailwind-ui'],
      'antd': ['chakra-ui', 'mantine'],
      'handlebars': ['mustache', 'template literals'],
      '@genkit-ai': ['custom implementation', 'openai SDK']
    };

    for (const [key, alts] of Object.entries(alternatives)) {
      if (moduleName.includes(key)) {
        return alts;
      }
    }

    return [];
  }

  private generateOptimizationOpportunities(): Array<{ type: string; description: string; impact: 'high' | 'medium' | 'low' }> {
    const opportunities = [];

    // Large bundle size
    const totalSize = this.calculateTotalSize();
    if (totalSize > 1024 * 1024) { // > 1MB
      opportunities.push({
        type: 'bundle_size',
        description: `Bundle size is ${Math.round(totalSize / 1024)}KB. Consider code splitting and lazy loading.`,
        impact: 'high' as const
      });
    }

    // Multiple large chunks
    const largeChunks = Array.from(this.chunks.entries()).filter(([, size]) => size > 500000);
    if (largeChunks.length > 0) {
      opportunities.push({
        type: 'chunk_size',
        description: `${largeChunks.length} chunks are larger than 500KB. Consider further splitting.`,
        impact: 'medium' as const
      });
    }

    // Webpack warnings
    if (this.webpackWarnings.length > 0) {
      opportunities.push({
        type: 'webpack_warnings',
        description: `${this.webpackWarnings.length} webpack warnings detected. These may indicate bundling issues.`,
        impact: 'low' as const
      });
    }

    // Duplicate dependencies
    const duplicates = this.findDuplicateDependencies();
    if (duplicates.length > 0) {
      opportunities.push({
        type: 'duplicate_dependencies',
        description: `${duplicates.length} dependencies appear to be duplicated across chunks.`,
        impact: 'medium' as const
      });
    }

    // Heavy dependencies
    const heavyDeps = this.identifyHeavyDependencies();
    const criticalHeavyDeps = heavyDeps.filter(dep => dep.size > 200000);
    if (criticalHeavyDeps.length > 0) {
      opportunities.push({
        type: 'heavy_dependencies',
        description: `${criticalHeavyDeps.length} dependencies are larger than 200KB. Consider alternatives or lazy loading.`,
        impact: 'high' as const
      });
    }

    return opportunities;
  }

  public generateWebpackConfig(): Record<string, any> {
    const config: Record<string, any> = {
      resolve: {
        fallback: {},
        alias: {}
      },
      externals: {},
      optimization: {
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              minChunks: 2,
              priority: -10,
              reuseExistingChunk: true
            }
          }
        }
      },
      ignoreWarnings: []
    };

    // Handle specific warnings
    for (const warning of this.webpackWarnings) {
      if (/require\.extensions/.test(warning)) {
        config.ignoreWarnings.push(/require\.extensions/);
      }
      
      if (/@genkit-ai\/firebase/.test(warning)) {
        config.resolve.fallback['@genkit-ai/firebase'] = false;
      }
      
      if (/handlebars/.test(warning)) {
        config.resolve.fallback['handlebars'] = false;
        config.externals['handlebars'] = 'handlebars';
      }
    }

    return config;
  }

  public getOptimizationSuggestions(): string[] {
    const suggestions = [];
    const analysis = this.performBundleAnalysis();

    // Bundle size optimizations
    if (analysis.totalSize > 1024 * 1024) {
      suggestions.push('Implement dynamic imports for route-based code splitting');
      suggestions.push('Use React.lazy() for component-level code splitting');
      suggestions.push('Consider removing unused dependencies');
    }

    // Webpack warning fixes
    if (this.webpackWarnings.length > 0) {
      suggestions.push('Update webpack configuration to handle compatibility issues');
      suggestions.push('Consider using dynamic imports instead of require() statements');
      suggestions.push('Add proper fallbacks for Node.js modules in browser environment');
    }

    // Performance optimizations
    suggestions.push('Enable gzip compression for static assets');
    suggestions.push('Implement service worker for asset caching');
    suggestions.push('Use webpack-bundle-analyzer for detailed analysis');

    return suggestions;
  }

  public cleanup(): void {
    // Restore console.warn
    if (typeof console.warn === 'function') {
      // This is simplified - in production, you'd need to properly restore
      console.warn = console.warn;
    }
  }
}

export const bundleAnalyzer = new BundleAnalyzer();
export { BundleAnalyzer };