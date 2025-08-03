"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// Error severity classification
export enum ErrorSeverity {
  LOW = 'low',         // Non-critical, user can continue
  MEDIUM = 'medium',   // Degraded experience, fallback available
  HIGH = 'high',       // Feature unavailable, user notification needed
  CRITICAL = 'critical' // System failure, immediate attention required
}

export interface SystemError {
  id: string;
  type: string;
  severity: ErrorSeverity;
  message: string;
  context: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level: 'component' | 'feature' | 'page' | 'app';
  onError?: (error: SystemError) => void;
  resetKeys?: Array<string | number>;
  isolate?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
  lastResetKeyString?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    const { resetKeys } = props;
    const resetKeyString = resetKeys?.join(',');
    
    if (state.lastResetKeyString !== resetKeyString && state.hasError) {
      return {
        hasError: false,
        error: undefined,
        errorId: undefined,
        lastResetKeyString: resetKeyString
      };
    }
    
    return { ...state, lastResetKeyString: resetKeyString };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    const systemError: SystemError = {
      id: this.state.errorId!,
      type: error.name || 'UnknownError',
      severity: this.determineSeverity(error),
      message: error.message,
      context: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        level: this.props.level,
        retryCount: this.retryCount,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      },
      timestamp: new Date(),
      sessionId: this.getSessionId()
    };

    // Report to parent component
    this.props.onError?.(systemError);

    // Log to console for development
    console.error('ErrorBoundary caught an error:', systemError);

    // Report to error tracking service
    this.reportToErrorService(systemError);
  };

  private determineSeverity = (error: Error): ErrorSeverity => {
    // AI/Network related errors - medium severity with fallbacks
    if (error.message.includes('AI') || error.message.includes('network') || error.message.includes('fetch')) {
      return ErrorSeverity.MEDIUM;
    }
    
    // Component level errors - low to medium
    if (this.props.level === 'component') {
      return ErrorSeverity.LOW;
    }
    
    // Page level errors - high severity
    if (this.props.level === 'page' || this.props.level === 'app') {
      return ErrorSeverity.HIGH;
    }
    
    return ErrorSeverity.MEDIUM;
  };

  private getSessionId = (): string => {
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('skillforge_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('skillforge_session_id', sessionId);
    }
    return sessionId;
  };

  private reportToErrorService = async (error: SystemError) => {
    try {
      // Only report in production or when explicitly enabled
      if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ERROR_REPORTING === 'true') {
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(error)
        });
      }
    } catch (reportingError) {
      console.warn('Failed to report error:', reportingError);
      // Store locally for later reporting
      try {
        const storedErrors = localStorage.getItem('pending_errors');
        const errors = storedErrors ? JSON.parse(storedErrors) : [];
        errors.push(error);
        localStorage.setItem('pending_errors', JSON.stringify(errors.slice(-10))); // Keep last 10 errors
      } catch (storageError) {
        console.warn('Failed to store error locally:', storageError);
      }
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorId: undefined });
    }
  };

  private handleReset = () => {
    this.retryCount = 0;
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  private renderErrorUI = () => {
    const { error } = this.state;
    const { level } = this.props;
    const canRetry = this.retryCount < this.maxRetries;

    // Custom fallback from props
    if (this.props.fallback) {
      return this.props.fallback;
    }

    // Component-level errors: minimal disruption
    if (level === 'component') {
      return (
        <div className="p-2 border border-red-200 rounded bg-red-50 text-red-800 text-sm">
          <p>Component temporarily unavailable</p>
          {canRetry && (
            <Button size="sm" variant="outline" onClick={this.handleRetry} className="mt-1">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      );
    }

    // Feature-level errors: user-friendly message with actions
    if (level === 'feature') {
      return (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Feature Unavailable
            </CardTitle>
            <CardDescription>
              This feature is temporarily experiencing issues. You can try again or continue using other parts of the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {canRetry && (
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again ({this.maxRetries - this.retryCount} attempts left)
              </Button>
            )}
            <Button variant="outline" onClick={this.handleReset} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Reset Component
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Page/App level errors: comprehensive error page
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-6 w-6 mr-2" />
              Something went wrong
            </CardTitle>
            <CardDescription>
              We've encountered an unexpected error. Our team has been notified and is working on a fix.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NODE_ENV === 'development' && error && (
              <details className="text-sm bg-gray-100 p-3 rounded">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 text-xs overflow-auto">{error.stack}</pre>
              </details>
            )}
            <div className="flex flex-col space-y-2">
              {canRetry && (
                <Button onClick={this.handleRetry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again ({this.maxRetries - this.retryCount} attempts left)
                </Button>
              )}
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

// Convenience wrapper components for different levels
export const ComponentErrorBoundary: React.FC<{ children: ReactNode; onError?: (error: SystemError) => void }> = ({ children, onError }) => (
  <ErrorBoundary level="component" onError={onError}>
    {children}
  </ErrorBoundary>
);

export const FeatureErrorBoundary: React.FC<{ children: ReactNode; onError?: (error: SystemError) => void }> = ({ children, onError }) => (
  <ErrorBoundary level="feature" onError={onError}>
    {children}
  </ErrorBoundary>
);

export const PageErrorBoundary: React.FC<{ children: ReactNode; onError?: (error: SystemError) => void }> = ({ children, onError }) => (
  <ErrorBoundary level="page" onError={onError}>
    {children}
  </ErrorBoundary>
);

export const AppErrorBoundary: React.FC<{ children: ReactNode; onError?: (error: SystemError) => void }> = ({ children, onError }) => (
  <ErrorBoundary level="app" onError={onError}>
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;