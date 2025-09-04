import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorMessage } from './ErrorMessage';
import { ErrorLogger } from '../../../utils/ErrorLogger';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: ErrorLogger.generateErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    const errorId = ErrorLogger.logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    this.setState({ errorId });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  handleReportError = () => {
    if (this.state.errorId) {
      ErrorLogger.reportError(this.state.errorId);
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <div className="error-boundary__container">
            <div className="error-boundary__icon">💥</div>
            <h1 className="error-boundary__title">Something went wrong</h1>
            <p className="error-boundary__description">
              We're sorry, but something unexpected happened. The error has been
              logged and our team has been notified.
            </p>
            
            {this.state.errorId && (
              <div className="error-boundary__error-id">
                <strong>Error ID:</strong> {this.state.errorId}
              </div>
            )}

            <div className="error-boundary__actions">
              <button
                className="error-boundary__button error-boundary__button--primary"
                onClick={this.handleRetry}
                type="button"
              >
                Try Again
              </button>
              <button
                className="error-boundary__button error-boundary__button--secondary"
                onClick={() => window.location.reload()}
                type="button"
              >
                Reload Page
              </button>
              <button
                className="error-boundary__button error-boundary__button--tertiary"
                onClick={this.handleReportError}
                type="button"
              >
                Report Issue
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary__details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-boundary__stack">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    const errorId = ErrorLogger.logError(error, errorInfo);
    
    // In a real app, you might want to show a toast notification
    // or update some global error state here
    console.error('Error caught by error handler:', error);
    
    return errorId;
  }, []);

  return { handleError };
};

export default ErrorBoundary;