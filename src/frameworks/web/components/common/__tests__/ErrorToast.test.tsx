import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorToast } from '../ErrorToast';
import { ErrorProvider, useErrorContext } from '../../contexts/ErrorContext';

// Test component to trigger errors
const ErrorTrigger: React.FC = () => {
  const { addError, showSuccess, showWarning, showInfo } = useErrorContext();

  return (
    <div>
      <button
        onClick={() => addError('Test error message')}
        data-testid="add-error"
      >
        Add Error
      </button>
      <button
        onClick={() => showSuccess('Success message')}
        data-testid="add-success"
      >
        Add Success
      </button>
      <button
        onClick={() => showWarning('Warning message')}
        data-testid="add-warning"
      >
        Add Warning
      </button>
      <button
        onClick={() => showInfo('Info message')}
        data-testid="add-info"
      >
        Add Info
      </button>
      <button
        onClick={() => addError('Error with action', {
          action: {
            label: 'Retry',
            handler: () => console.log('Retry clicked'),
          },
        })}
        data-testid="add-error-with-action"
      >
        Add Error with Action
      </button>
    </div>
  );
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorProvider>
    {children}
    <ErrorToast />
  </ErrorProvider>
);

describe('ErrorToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when there are no errors', () => {
    render(
      <TestWrapper>
        <div>No errors</div>
      </TestWrapper>
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('displays error toast when error is added', () => {
    render(
      <TestWrapper>
        <ErrorTrigger />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('add-error'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('displays success toast with correct styling', () => {
    render(
      <TestWrapper>
        <ErrorTrigger />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('add-success'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('displays warning toast with correct styling', () => {
    render(
      <TestWrapper>
        <ErrorTrigger />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('add-warning'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('displays info toast with correct styling', () => {
    render(
      <TestWrapper>
        <ErrorTrigger />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('add-info'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('allows dismissing error toast', async () => {
    render(
      <TestWrapper>
        <ErrorTrigger />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('add-error'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Dismiss notification'));

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('shows action button when error has action', () => {
    render(
      <TestWrapper>
        <ErrorTrigger />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('add-error-with-action'));

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('shows report button for error type toasts', () => {
    render(
      <TestWrapper>
        <ErrorTrigger />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('add-error'));

    expect(screen.getByTitle('Report this error')).toBeInTheDocument();
  });

  it('does not show report button for non-error type toasts', () => {
    render(
      <TestWrapper>
        <ErrorTrigger />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('add-success'));

    expect(screen.queryByTitle('Report this error')).not.toBeInTheDocument();
  });

  it('displays multiple toasts simultaneously', () => {
    render(
      <TestWrapper>
        <ErrorTrigger />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('add-error'));
    fireEvent.click(screen.getByTestId('add-warning'));
    fireEvent.click(screen.getByTestId('add-info'));

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(3);
  });

  it('auto-hides non-error toasts after duration', async () => {
    jest.useFakeTimers();

    render(
      <TestWrapper>
        <ErrorTrigger />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('add-success'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Fast-forward time
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('does not auto-hide error toasts', async () => {
    jest.useFakeTimers();

    render(
      <TestWrapper>
        <ErrorTrigger />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('add-error'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Fast-forward time
    jest.advanceTimersByTime(10000);

    // Error should still be visible
    expect(screen.getByRole('alert')).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('handles action button clicks', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    render(
      <TestWrapper>
        <ErrorTrigger />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('add-error-with-action'));
    fireEvent.click(screen.getByText('Retry'));

    expect(consoleSpy).toHaveBeenCalledWith('Retry clicked');

    consoleSpy.mockRestore();
  });
});