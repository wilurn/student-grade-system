import React from 'react';
import { useErrorContext, AppError } from '../../contexts/ErrorContext';
import './ErrorToast.css';

export const ErrorToast: React.FC = () => {
  const { state, removeError, reportError } = useErrorContext();

  if (state.errors.length === 0) {
    return null;
  }

  return (
    <div className="error-toast-container">
      {state.errors.map((error) => (
        <ErrorToastItem
          key={error.id}
          error={error}
          onDismiss={() => removeError(error.id)}
          onReport={() => reportError(error.id)}
          isReporting={state.isReporting}
        />
      ))}
    </div>
  );
};

interface ErrorToastItemProps {
  error: AppError;
  onDismiss: () => void;
  onReport: () => void;
  isReporting: boolean;
}

const ErrorToastItem: React.FC<ErrorToastItemProps> = ({
  error,
  onDismiss,
  onReport,
  isReporting,
}) => {
  const getIcon = () => {
    switch (error.type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  const getTitle = () => {
    switch (error.type) {
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Info';
      default:
        return 'Error';
    }
  };

  return (
    <div
      className={`error-toast error-toast--${error.type}`}
      role="alert"
      aria-live="polite"
    >
      <div className="error-toast__content">
        <div className="error-toast__icon" aria-hidden="true">
          {getIcon()}
        </div>
        <div className="error-toast__text">
          <div className="error-toast__title">{getTitle()}</div>
          <div className="error-toast__message">{error.message}</div>
        </div>
      </div>

      <div className="error-toast__actions">
        {error.action && (
          <button
            className="error-toast__action-button"
            onClick={error.action.handler}
            type="button"
          >
            {error.action.label}
          </button>
        )}
        
        {error.type === 'error' && (
          <button
            className="error-toast__report-button"
            onClick={onReport}
            disabled={isReporting}
            type="button"
            title="Report this error"
          >
            {isReporting ? '⏳' : '📤'}
          </button>
        )}

        {error.dismissible && (
          <button
            className="error-toast__dismiss-button"
            onClick={onDismiss}
            type="button"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorToast;