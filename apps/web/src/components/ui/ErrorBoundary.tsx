import React, { Component, type ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service in production
    if (import.meta.env.PROD) {
      // TODO: Send to Sentry or other error tracking service
      console.error('Production error:', {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                Something went wrong
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
              </p>

              {/* Show error details in development */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Error details (Development only)
                  </summary>
                  <div className="mt-2 p-4 bg-red-50 rounded-md">
                    <p className="text-xs font-mono text-red-800 break-all">
                      {this.state.error.toString()}
                    </p>
                    {this.state.error.stack && (
                      <pre className="mt-2 text-xs text-red-700 overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <pre className="mt-2 text-xs text-red-700 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <ArrowPathIcon className="mr-2 h-4 w-4" />
                  Try again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Go to homepage
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specific error boundary for async components
export function AsyncErrorBoundary({
  children,
  message = 'Failed to load this section'
}: {
  children: ReactNode;
  message?: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                {message}
              </h3>
              <p className="mt-2 text-sm text-yellow-700">
                Please refresh the page to try again.
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// Widget-level error boundary for dashboard components
export function WidgetErrorBoundary({
  children,
  widgetName = 'Widget'
}: {
  children: ReactNode;
  widgetName?: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-sm text-gray-600">
              {widgetName} temporarily unavailable
            </p>
          </div>
        </div>
      }
      onError={(error) => {
        console.error(`Error in ${widgetName}:`, error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Page-level error boundary
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to error tracking service
        console.error('Page error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Hook for error handling in functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    console.error('Error handled by useErrorHandler:', error, errorInfo);

    // In production, send to error tracking
    if (import.meta.env.PROD) {
      // TODO: Send to Sentry or other error tracking service
    }

    // Optionally show a toast notification
    // toast.error('An error occurred. Please try again.');
  };
}