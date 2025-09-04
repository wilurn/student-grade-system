import React from 'react';
import './ErrorMessage.css';
import { ErrorCode, DomainException } from '../../../../shared/types';

export type ErrorType =
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'server'
  | 'generic';

export interface ErrorMessageProps {
  message: string;
  type?: ErrorType;
  onRetry?: () => void;
  className?: string;
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

// Utility function to map ErrorCode to ErrorType
export const mapErrorCodeToType = (errorCode: ErrorCode): ErrorType => {
  switch (errorCode) {
    case ErrorCode.NETWORK_ERROR:
      return 'network';
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_GRADE_DATA:
      return 'validation';
    case ErrorCode.AUTHENTICATION_ERROR:
    case ErrorCode.INVALID_CREDENTIALS:
    case ErrorCode.TOKEN_EXPIRED:
    case ErrorCode.TOKEN_INVALID:
      return 'authentication';
    case ErrorCode.AUTHORIZATION_ERROR:
      return 'authorization';
    case ErrorCode.SERVER_ERROR:
      return 'server';
    default:
      return 'generic';
  }
};

// Utility function to create user-friendly error messages
export const createUserFriendlyMessage = (
  error: DomainException | Error | string
): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof DomainException) {
    switch (error.code) {
      case ErrorCode.NETWORK_ERROR:
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      case ErrorCode.AUTHENTICATION_ERROR:
      case ErrorCode.INVALID_CREDENTIALS:
        return 'Invalid email or password. Please check your credentials and try again.';
      case ErrorCode.TOKEN_EXPIRED:
        return 'Your session has expired. Please log in again to continue.';
      case ErrorCode.AUTHORIZATION_ERROR:
        return 'You do not have permission to access this resource.';
      case ErrorCode.GRADE_NOT_FOUND:
        return 'The requested grade could not be found.';
      case ErrorCode.CORRECTION_NOT_ALLOWED:
        return 'Grade correction is not allowed for this grade at this time.';
      case ErrorCode.MAX_CORRECTIONS_REACHED:
        return 'You have reached the maximum number of correction requests for this grade.';
      case ErrorCode.DUPLICATE_CORRECTION:
        return 'A correction request for this grade is already pending.';
      case ErrorCode.USER_EXISTS:
        return 'An account with this email or student ID already exists.';
      case ErrorCode.REGISTRATION_FAILED:
        return 'Registration failed. Please check your information and try again.';
      case ErrorCode.SERVER_ERROR:
        return 'A server error occurred. Please try again later or contact support if the problem persists.';
      case ErrorCode.VALIDATION_ERROR:
        return error.message || 'Please check your input and try again.';
      default:
        return (
          error.message || 'An unexpected error occurred. Please try again.'
        );
    }
  }

  return error.message || 'An unexpected error occurred. Please try again.';
};

// Props for creating ErrorMessage from domain errors
export interface ErrorMessageFromDomainProps
  extends Omit<ErrorMessageProps, 'message' | 'type'> {
  error: DomainException | Error | string;
}

// Component variant that accepts domain errors
export const ErrorMessageFromDomain: React.FC<ErrorMessageFromDomainProps> = ({
  error,
  ...props
}) => {
  const message = createUserFriendlyMessage(error);
  const type =
    error instanceof DomainException
      ? mapErrorCodeToType(error.code)
      : 'generic';

  return <ErrorMessage message={message} type={type} {...props} />;
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  type = 'generic',
  onRetry,
  className = '',
  showIcon = true,
  dismissible = false,
  onDismiss,
}) => {
  const errorClasses = ['error-message', `error-message--${type}`, className]
    .filter(Boolean)
    .join(' ');

  const getErrorIcon = () => {
    switch (type) {
      case 'network':
        return '🌐';
      case 'validation':
        return '⚠️';
      case 'authentication':
        return '🔒';
      case 'authorization':
        return '🚫';
      case 'server':
        return '🔧';
      default:
        return '❌';
    }
  };

  const getErrorTitle = () => {
    switch (type) {
      case 'network':
        return 'Connection Error';
      case 'validation':
        return 'Validation Error';
      case 'authentication':
        return 'Authentication Required';
      case 'authorization':
        return 'Access Denied';
      case 'server':
        return 'Server Error';
      default:
        return 'Error';
    }
  };

  return (
    <div className={errorClasses} role="alert" aria-live="polite">
      <div className="error-message__content">
        {showIcon && (
          <span className="error-message__icon" aria-hidden="true">
            {getErrorIcon()}
          </span>
        )}
        <div className="error-message__text">
          <div className="error-message__title">{getErrorTitle()}</div>
          <div className="error-message__description">{message}</div>
        </div>
      </div>

      <div className="error-message__actions">
        {onRetry && (
          <button
            className="error-message__retry-button"
            onClick={onRetry}
            type="button"
          >
            Try Again
          </button>
        )}
        {dismissible && onDismiss && (
          <button
            className="error-message__dismiss-button"
            onClick={onDismiss}
            type="button"
            aria-label="Dismiss error message"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
