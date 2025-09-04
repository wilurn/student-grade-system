import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary, useErrorHandler } from '../ErrorBoundary';
import { ErrorLogger } from '../../../utils/ErrorLogger';

// Mock ErrorLogger
jest.mock('../../../utils/ErrorLogger', () => ({
  ErrorLogger: {
    generateErrorId: jest.fn(() => 'test-error-id'),
    logError: jest.fn(() => 'test-error-id'),
    reportError: jest.fn(() => Promise.resolve()),
  },
}));

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Test component for useErrorHandler hook
const ErrorHandlerTest: React.FC = () => {
  const { handleError } = useErrorHandler();
  
  const throwError = () => {
    try {
      throw new Error('Hook test error');
    } catch (error) {
      handleError(error as Error);
    }
  };

  return (
    <button onClick={throwError} data-testid="throw-error">
      Throw Error
    </button>
  );
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for these tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument();
    expect(screen.getByText('Error ID: test-error-id')).toBeInTheDocument();
  });

  it('logs error when component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(ErrorLogger.logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
        errorBoundary: true,
      })
    );
  });

  it('calls custom onError handler when provided', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('allows retry after error', async () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click try again
    fireEvent.click(screen.getByText('Try Again'));

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  it('allows page reload', () => {
    // Mock window.location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Reload Page'));
    expect(mockReload).toHaveBeenCalled();
  });

  it('allows error reporting', async () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Report Issue'));
    
    await waitFor(() => {
      expect(ErrorLogger.reportError).toHaveBeenCalledWith('test-error-id');
    });
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs errors when handleError is called', () => {
    render(<ErrorHandlerTest />);

    fireEvent.click(screen.getByTestId('throw-error'));

    expect(ErrorLogger.logError).toHaveBeenCalledWith(
      expect.any(Error),
      undefined
    );
  });

  it('returns error ID when handling error', () => {
    const TestComponent: React.FC = () => {
      const { handleError } = useErrorHandler();
      const [errorId, setErrorId] = React.useState<string>('');
      
      const throwError = () => {
        const id = handleError(new Error('Test error'));
        setErrorId(id);
      };

      return (
        <div>
          <button onClick={throwError} data-testid="throw-error">
            Throw Error
          </button>
          <div data-testid="error-id">{errorId}</div>
        </div>
      );
    };

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('throw-error'));

    expect(screen.getByTestId('error-id')).toHaveTextContent('test-error-id');
  });
});