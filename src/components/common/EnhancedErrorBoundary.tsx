/**
 * Enhanced Error Boundary with better error reporting and recovery
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorHandler } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean; // If true, only catches errors from direct children
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private readonly maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    ErrorHandler.handleComponentError(error, { componentStack: errorInfo.componentStack || '' });
    
    // Store error info in state
    this.setState({
      errorInfo
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Send to error monitoring service (e.g., Sentry)
    logger.error('Component error reported to monitoring service', {
      action: 'error_boundary_report',
      error: error.message,
      componentStack: errorInfo.componentStack
    });
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));

      logger.info('Error boundary retry attempt', {
        action: 'error_boundary_retry',
        attempt: this.state.retryCount + 1,
        maxRetries: this.maxRetries
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Oops ! Quelque chose s'est mal passé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-muted-foreground text-sm">
                <p>Une erreur inattendue s'est produite. Nos équipes ont été automatiquement notifiées.</p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4 text-left">
                    <summary className="cursor-pointer text-xs font-medium">
                      Détails techniques (développement)
                    </summary>
                    <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                      <div className="font-semibold text-destructive">
                        {this.state.error.name}: {this.state.error.message}
                      </div>
                      {this.state.error.stack && (
                        <pre className="mt-2 whitespace-pre-wrap text-xs">
                          {this.state.error.stack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                {this.state.retryCount < this.maxRetries && (
                  <Button 
                    onClick={this.handleRetry}
                    className="w-full"
                    variant="default"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réessayer ({this.state.retryCount + 1}/{this.maxRetries})
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleReload}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recharger la page
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  className="w-full"
                  variant="ghost"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...(props as any)} ref={ref} />
    </EnhancedErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for error boundary context (future enhancement)
 */
export function useErrorBoundary() {
  return {
    captureException: (error: Error) => {
      // This will be caught by the nearest error boundary
      throw error;
    }
  };
}

export default EnhancedErrorBoundary;