import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ErrorMessage,
  ErrorType,
  ErrorMessageFromDomain,
  mapErrorCodeToType,
  createUserFriendlyMessage,
} from '../ErrorMessage';
import { ErrorCode, DomainException } from '../../../../../shared/types';

describe('ErrorMessage', () => {
  const defaultProps = {
    message: 'Test error message',
  };

  it('renders with default props', () => {
    render(<ErrorMessage {...defaultProps} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('renders without icon when showIcon is false', () => {
    render(<ErrorMessage {...defaultProps} showIcon={false} />);

    expect(screen.queryByText('❌')).not.toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ErrorMessage {...defaultProps} className="custom-class" />);

    const errorElement = screen.getByRole('alert');
    expect(errorElement).toHaveClass(
      'error-message',
      'error-message--generic',
      'custom-class'
    );
  });

  describe('Error Types', () => {
    const errorTypes: Array<{ type: ErrorType; title: string; icon: string }> =
      [
        { type: 'network', title: 'Connection Error', icon: '🌐' },
        { type: 'validation', title: 'Validation Error', icon: '⚠️' },
        {
          type: 'authentication',
          title: 'Authentication Required',
          icon: '🔒',
        },
        { type: 'authorization', title: 'Access Denied', icon: '🚫' },
        { type: 'server', title: 'Server Error', icon: '🔧' },
        { type: 'generic', title: 'Error', icon: '❌' },
      ];

    errorTypes.forEach(({ type, title, icon }) => {
      it(`renders ${type} error type correctly`, () => {
        render(<ErrorMessage {...defaultProps} type={type} />);

        expect(screen.getByText(title)).toBeInTheDocument();
        expect(screen.getByText(icon)).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveClass(`error-message--${type}`);
      });
    });
  });

  describe('Retry functionality', () => {
    it('renders retry button when onRetry is provided', () => {
      const mockRetry = jest.fn();
      render(<ErrorMessage {...defaultProps} onRetry={mockRetry} />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const mockRetry = jest.fn();
      render(<ErrorMessage {...defaultProps} onRetry={mockRetry} />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('does not render retry button when onRetry is not provided', () => {
      render(<ErrorMessage {...defaultProps} />);

      expect(
        screen.queryByRole('button', { name: /try again/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Dismiss functionality', () => {
    it('renders dismiss button when dismissible is true and onDismiss is provided', () => {
      const mockDismiss = jest.fn();
      render(
        <ErrorMessage
          {...defaultProps}
          dismissible={true}
          onDismiss={mockDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', {
        name: /dismiss error message/i,
      });
      expect(dismissButton).toBeInTheDocument();
      expect(dismissButton).toHaveTextContent('×');
    });

    it('calls onDismiss when dismiss button is clicked', () => {
      const mockDismiss = jest.fn();
      render(
        <ErrorMessage
          {...defaultProps}
          dismissible={true}
          onDismiss={mockDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', {
        name: /dismiss error message/i,
      });
      fireEvent.click(dismissButton);

      expect(mockDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not render dismiss button when dismissible is false', () => {
      const mockDismiss = jest.fn();
      render(
        <ErrorMessage
          {...defaultProps}
          dismissible={false}
          onDismiss={mockDismiss}
        />
      );

      expect(
        screen.queryByRole('button', { name: /dismiss error message/i })
      ).not.toBeInTheDocument();
    });

    it('does not render dismiss button when onDismiss is not provided', () => {
      render(<ErrorMessage {...defaultProps} dismissible={true} />);

      expect(
        screen.queryByRole('button', { name: /dismiss error message/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ErrorMessage {...defaultProps} />);

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-hidden on icon', () => {
      render(<ErrorMessage {...defaultProps} />);

      const iconElement = screen.getByText('❌');
      expect(iconElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('has proper aria-label on dismiss button', () => {
      const mockDismiss = jest.fn();
      render(
        <ErrorMessage
          {...defaultProps}
          dismissible={true}
          onDismiss={mockDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', {
        name: /dismiss error message/i,
      });
      expect(dismissButton).toHaveAttribute(
        'aria-label',
        'Dismiss error message'
      );
    });
  });

  describe('Combined functionality', () => {
    it('renders both retry and dismiss buttons when both are provided', () => {
      const mockRetry = jest.fn();
      const mockDismiss = jest.fn();
      render(
        <ErrorMessage
          {...defaultProps}
          onRetry={mockRetry}
          dismissible={true}
          onDismiss={mockDismiss}
        />
      );

      expect(
        screen.getByRole('button', { name: /try again/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /dismiss error message/i })
      ).toBeInTheDocument();
    });

    it('works with network error type and retry functionality', () => {
      const mockRetry = jest.fn();
      render(
        <ErrorMessage
          message="Failed to load data. Please check your connection."
          type="network"
          onRetry={mockRetry}
        />
      );

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('🌐')).toBeInTheDocument();
      expect(
        screen.getByText('Failed to load data. Please check your connection.')
      ).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('handles empty message', () => {
      render(<ErrorMessage message="" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('handles long error messages', () => {
      const longMessage =
        'This is a very long error message that should still be displayed properly and maintain good readability even when it spans multiple lines in the error component.';
      render(<ErrorMessage message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });
});

describe('mapErrorCodeToType', () => {
  it('maps network error codes correctly', () => {
    expect(mapErrorCodeToType(ErrorCode.NETWORK_ERROR)).toBe('network');
  });

  it('maps validation error codes correctly', () => {
    expect(mapErrorCodeToType(ErrorCode.VALIDATION_ERROR)).toBe('validation');
    expect(mapErrorCodeToType(ErrorCode.INVALID_GRADE_DATA)).toBe('validation');
  });

  it('maps authentication error codes correctly', () => {
    expect(mapErrorCodeToType(ErrorCode.AUTHENTICATION_ERROR)).toBe(
      'authentication'
    );
    expect(mapErrorCodeToType(ErrorCode.INVALID_CREDENTIALS)).toBe(
      'authentication'
    );
    expect(mapErrorCodeToType(ErrorCode.TOKEN_EXPIRED)).toBe('authentication');
    expect(mapErrorCodeToType(ErrorCode.TOKEN_INVALID)).toBe('authentication');
  });

  it('maps authorization error codes correctly', () => {
    expect(mapErrorCodeToType(ErrorCode.AUTHORIZATION_ERROR)).toBe(
      'authorization'
    );
  });

  it('maps server error codes correctly', () => {
    expect(mapErrorCodeToType(ErrorCode.SERVER_ERROR)).toBe('server');
  });

  it('maps unknown error codes to generic', () => {
    expect(mapErrorCodeToType(ErrorCode.NOT_FOUND_ERROR)).toBe('generic');
    expect(mapErrorCodeToType(ErrorCode.DUPLICATE_ERROR)).toBe('generic');
  });
});

describe('createUserFriendlyMessage', () => {
  it('returns string messages as-is', () => {
    const message = 'Simple error message';
    expect(createUserFriendlyMessage(message)).toBe(message);
  });

  it('creates user-friendly messages for domain exceptions', () => {
    const networkError = new DomainException({
      code: ErrorCode.NETWORK_ERROR,
      message: 'Network failed',
    });

    expect(createUserFriendlyMessage(networkError)).toBe(
      'Unable to connect to the server. Please check your internet connection and try again.'
    );
  });

  it('creates user-friendly messages for authentication errors', () => {
    const authError = new DomainException({
      code: ErrorCode.INVALID_CREDENTIALS,
      message: 'Invalid login',
    });

    expect(createUserFriendlyMessage(authError)).toBe(
      'Invalid email or password. Please check your credentials and try again.'
    );
  });

  it('creates user-friendly messages for grade-specific errors', () => {
    const gradeError = new DomainException({
      code: ErrorCode.GRADE_NOT_FOUND,
      message: 'Grade not found',
    });

    expect(createUserFriendlyMessage(gradeError)).toBe(
      'The requested grade could not be found.'
    );
  });

  it('falls back to original message for validation errors', () => {
    const validationError = new DomainException({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Email is required',
    });

    expect(createUserFriendlyMessage(validationError)).toBe(
      'Email is required'
    );
  });

  it('handles regular Error objects', () => {
    const error = new Error('Regular error message');
    expect(createUserFriendlyMessage(error)).toBe('Regular error message');
  });

  it('handles errors without messages', () => {
    const error = new Error();
    expect(createUserFriendlyMessage(error)).toBe(
      'An unexpected error occurred. Please try again.'
    );
  });
});

describe('ErrorMessageFromDomain', () => {
  it('renders with domain exception', () => {
    const error = new DomainException({
      code: ErrorCode.NETWORK_ERROR,
      message: 'Network failed',
    });

    render(<ErrorMessageFromDomain error={error} />);

    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Unable to connect to the server. Please check your internet connection and try again.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('error-message--network');
  });

  it('renders with string error', () => {
    render(<ErrorMessageFromDomain error="Simple error message" />);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Simple error message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('error-message--generic');
  });

  it('renders with regular Error object', () => {
    const error = new Error('Regular error');
    render(<ErrorMessageFromDomain error={error} />);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Regular error')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('error-message--generic');
  });

  it('passes through additional props', () => {
    const mockRetry = jest.fn();
    const error = new DomainException({
      code: ErrorCode.NETWORK_ERROR,
      message: 'Network failed',
    });

    render(<ErrorMessageFromDomain error={error} onRetry={mockRetry} />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });
});
