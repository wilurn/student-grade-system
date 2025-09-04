import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ErrorProvider, useErrorContext } from '../ErrorContext';
import { DomainException, ErrorCode } from '../../../../shared/types';
import { ErrorLogger } from '../../../utils/ErrorLogger';

// Mock ErrorLogger
jest.mock('../../../utils/ErrorLogger', () => ({
  ErrorLogger: {
    logError: jest.fn(() => 'test-error-id'),
    reportError: jest.fn(() => Promise.resolve()),
  },
}));

// Test component to interact with ErrorContext
const ErrorContextTest: React.FC = () => {
  const {
    state,
    addError,
    removeError,
    clearErrors,
    reportError,
    showSuccess,
    showWarning,
    showInfo,
  } = useErrorContext();

  return (
    <div>
      <div data-testid="error-count">{state.errors.length}</div>
      <div data-testid="is-reporting">{state.isReporting.toString()}</div>
      
      <button
        onClick={() => addError('Test error')}
        data-testid="add-string-error"
      >
        Add String Error
      </button>
      
      <button
        onClick={() => addError(new Error('Test JS error'))}
        data-testid="add-js-error"
      >
        Add JS Error
      </button>
      
      <button
        onClick={() => addError(new DomainException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Test domain error',
        }))}
        data-testid="add-domain-error"
      >
        Add Domain Error
      </button>
      
      <button
        onClick={() => showSuccess('Success message')}
        data-testid="show-success"
      >
        Show Success
      </button>
      
      <button
        onClick={() => showWarning('Warning message')}
        data-testid="show-warning"
      >
        Show Warning
      </button>
      
      <button
        onClick={() => showInfo('Info message')}
        data-testid="show-info"
      >
        Show Info
      </button>
      
      <button
        onClick={clearErrors}
        data-testid="clear-errors"
      >
        Clear Errors
      </button>
      
      {state.errors.map((error) => (
        <div key={error.id} data-testid={`error-${error.id}`}>
          <span data-testid={`error-message-${error.id}`}>{error.message}</span>
          <span data-testid={`error-type-${error.id}`}>{error.type}</span>
          <button
            onClick={() => removeError(error.id)}
            data-testid={`remove-${error.id}`}
          >
            Remove
          </button>
          <button
            onClick={() => reportError(error.id)}
            data-testid={`report-${error.id}`}
          >
            Report
          </button>
        </div>
      ))}
    </div>
  );
};

describe('ErrorContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('provides initial state', () => {
    render(
      <ErrorProvider>
        <ErrorContextTest />
      </ErrorProvider>
    );

    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
    expect(screen.getByTestId('is-reporting')).toHaveTextContent('false');
  });

  it('adds string error', () => {
    render(
      <ErrorProvider>
        <ErrorContextTest />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByTestId('add-string-error'));

    expect(screen.getByTestId('error-count')).toHaveTextContent('1');
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('adds JavaScript error', () => {
    render(
      <ErrorProvider>
        <ErrorContextTest />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByTestId('add-js-error'));

    expect(screen.getByTestId('error-count')).toHaveTextContent('1');
    expect(screen.getByText('Test JS error')).toBeInTheDocument();
    expect(ErrorLogger.logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        errorContext: 'ErrorProvider',
        userFacing: true,
      })
    );
  });

  it('adds domain error with user-friendly message', () => {
    render(
      <ErrorProvider>
        <ErrorContextTest />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByTestId('add-domain-error'));

    expect(screen.getByTestId('error-count')).toHaveTextContent('1');
    expect(screen.getByText('Please check your input and try again.')).toBeInTheDocument();
  });

  it('maps domain error to correct type', () => {
    render(
      <ErrorProvider>
        <ErrorContextTest />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByTestId('add-domain-error'));

    const errorId = screen.getByTestId('error-count').textContent === '1' 
      ? screen.getByText('Please check your input and try again.').closest('[data-testid^="error-"]')?.getAttribute('data-testid')?.replace('error-', '')
      : null;

    if (errorId) {
      expect(screen.getByTestId(`error-type-${errorId}`)).toHaveTextContent('warning');
    }
  });

  it('removes specific error', () => {
    render(
      <ErrorProvider>
        <ErrorContextTest />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByTestId('add-string-error'));
    expect(screen.getByTestId('error-count')).toHaveTextContent('1');

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
  });

  it('clears all errors', () => {
    render(
      <ErrorProvider>
        <ErrorContextTest />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByTestId('add-string-error'));
    fireEvent.click(screen.getByTestId('add-js-error'));
    expect(screen.getByTestId('error-count')).toHaveTextContent('2');

    fireEvent.click(screen.getByTestId('clear-errors'));
    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
  });

  it('shows success message', () => {
    render(
      <ErrorProvider>
        <ErrorContextTest />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByTestId('show-success'));

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByTestId('error-count')).toHaveTextContent('1');
  });

  it('shows warning message', () => {
    render(
      <ErrorProvider>
        <ErrorContextTest />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByTestId('show-warning'));

    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByTestId('error-count')).toHaveTextContent('1');
  });

  it('shows info message', () => {
    render(
      <ErrorProvider>
        <ErrorContextTest />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByTestId('show-info'));

    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByTestId('error-count')).toHaveTextContent('1');
  });

  it('auto-hides non-error messages', async () => {
    render(
      <ErrorProvider>
        <ErrorContextTest />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByTestId('show-success'));
    expect(screen.getByTestId('error-count')).toHaveTextContent('1');

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
    });
  });

  it('does not auto-hide error messages', async () => {
    render(
      <ErrorProvider>
        <ErrorContextTest />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByTestId('add-string-error'));
    expect(screen.getByTestId('error-count')).toHaveTextContent('1');

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Error should still be there
    expect(screen.getByTestId('error-count')).toHaveTextContent('1');
  });

  it('reports error successfully', async () => {
    render(
      <ErrorProvider>
        <ErrorContextTest />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByTestId('add-string-error'));
    
    const reportButton = screen.getByText('Report');
    fireEvent.click(reportButton);

    expect(screen.getByTestId('is-reporting')).toHaveTextContent('true');

    await waitFor(() => {
      expect(screen.getByTestId('is-reporting')).toHaveTextContent('false');
    });

    expect(ErrorLogger.reportError).toHaveBeenCalled();
  });

  it('handles error reporting failure', async () => {
    (ErrorLogger.reportError as jest.Mock).mockRejectedValueOnce(new Error('Report failed'));

    render(
      <ErrorProvider>
        <ErrorContextTest />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByTestId('add-string-error'));
    
    const reportButton = screen.getByText('Report');
    fireEvent.click(reportButton);

    await waitFor(() => {
      expect(screen.getByTestId('is-reporting')).toHaveTextContent('false');
    });

    // Should show error about failed reporting
    expect(screen.getByText('Failed to send error report. Please try again later.')).toBeInTheDocument();
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      render(<ErrorContextTest />);
    }).toThrow('useErrorContext must be used within an ErrorProvider');

    consoleSpy.mockRestore();
  });
});