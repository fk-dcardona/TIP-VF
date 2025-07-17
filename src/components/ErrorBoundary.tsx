'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isHydrationError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isHydrationError: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a hydration error
    const isHydrationError = error.message.includes('hydration') || 
                            error.message.includes('originalFactory.call') ||
                            error.message.includes('react-server-dom');
    
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      isHydrationError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
      isHydrationError: error.message.includes('hydration') || 
                       error.message.includes('originalFactory.call') ||
                       error.message.includes('react-server-dom')
    });
    
    // In production, send to error tracking service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      // window.Sentry?.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isHydrationError: false
    });
  };

  handleHardRefresh = () => {
    // Force a complete page refresh for hydration errors
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Special handling for hydration errors
      if (this.state.isHydrationError) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-2xl w-full space-y-8">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800 text-lg">
                  Page Loading Issue
                </AlertTitle>
                <AlertDescription className="text-orange-700 mt-4">
                  <p className="mb-4">
                    We detected a loading issue with this page. This is usually a temporary problem that can be resolved by refreshing.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button
                      onClick={this.handleHardRefresh}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Page
                    </Button>
                    
                    <Button
                      onClick={() => window.location.href = '/'}
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Go to Home
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        );
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-2xl w-full space-y-8">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800 text-lg">
                Something went wrong
              </AlertTitle>
              <AlertDescription className="text-red-700 mt-4">
                <p className="mb-4">
                  We're sorry, but something unexpected happened. This error has been logged and we'll look into it.
                </p>
                
                {/* Error details in development */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4 p-4 bg-red-100 rounded-lg">
                    <summary className="font-medium cursor-pointer mb-2">
                      Error Details (Development Only)
                    </summary>
                    <pre className="text-xs overflow-auto">
                      <code>
                        {this.state.error.toString()}
                        {this.state.errorInfo && (
                          <>
                            {'\n\nComponent Stack:'}
                            {this.state.errorInfo.componentStack}
                          </>
                        )}
                      </code>
                    </pre>
                  </details>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button
                    onClick={this.handleReset}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  
                  <Button
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Go to Home
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
            
            {/* Additional help text */}
            <div className="text-center text-sm text-gray-600">
              <p>
                If this problem persists, please contact support or try refreshing the page.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Async Error Boundary for handling errors in async components
export function AsyncErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: ReactNode; 
  fallback?: ReactNode 
}) {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}

// Component-specific error boundary with custom UI
export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">
              Dashboard Error
            </AlertTitle>
            <AlertDescription className="text-orange-700">
              <p className="mb-4">
                We couldn't load this dashboard section. This might be due to a connection issue or invalid data.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Dashboard
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;