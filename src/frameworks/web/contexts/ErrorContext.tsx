import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { DomainException, ErrorCode } from '../../../shared/types';
import { ErrorLogger } from '../../utils/ErrorLogger';

export interface ErrorState {
  errors: AppError[];
  isReporting: boolean;
}

export interface AppError {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  dismissible: boolean;
  autoHide: boolean;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

type ErrorAction =
  | { type: 'ADD_ERROR'; payload: AppError }
  | { type: 'REMOVE_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_REPORTING'; payload: boolean };

const initialState: ErrorState = {
  errors: [],
  isReporting: false,
};

function errorReducer(state: ErrorState, action: ErrorAction): ErrorState {
  switch (action.type) {
    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.payload],
      };
    case 'REMOVE_ERROR':
      return {
        ...state,
        errors: state.errors.filter(error => error.id !== action.payload),
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
      };
    case 'SET_REPORTING':
      return {
        ...state,
        isReporting: action.payload,
      };
    default:
      return state;
  }
}

interface ErrorContextValue {
  state: ErrorState;
  addError: (error: Error | DomainException | string, options?: Partial<AppError>) => string;
  removeError: (id: string) => void;
  clearErrors: () => void;
  reportError: (errorId: string) => Promise<void>;
  showSuccess: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  const addError = useCallback((
    error: Error | DomainException | string,
    options: Partial<AppError> = {}
  ): string => {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let message: string;
    let type: 'error' | 'warning' | 'info' = 'error';

    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof DomainException) {
      message = getUserFriendlyMessage(error);
      
      // Determine type based on error code
      if ([ErrorCode.VALIDATION_ERROR].includes(error.code)) {
        type = 'warning';
      }
    } else {
      message = error.message || 'An unexpected error occurred';
    }

    const appError: AppError = {
      id: errorId,
      message,
      type,
      dismissible: true,
      autoHide: type !== 'error',
      duration: type === 'error' ? undefined : 5000,
      ...options,
    };

    dispatch({ type: 'ADD_ERROR', payload: appError });

    // Log the error if it's not just a string message
    if (typeof error !== 'string') {
      ErrorLogger.logError(error instanceof Error ? error : new Error(message), {
        errorContext: 'ErrorProvider',
        userFacing: true,
      });
    }

    // Auto-remove error after duration
    if (appError.autoHide && appError.duration) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_ERROR', payload: errorId });
      }, appError.duration);
    }

    return errorId;
  }, []);

  const removeError = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ERROR', payload: id });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const reportError = useCallback(async (errorId: string) => {
    dispatch({ type: 'SET_REPORTING', payload: true });
    
    try {
      await ErrorLogger.reportError(errorId);
      addError('Error report sent successfully. Thank you for helping us improve!', {
        type: 'info',
        autoHide: true,
        duration: 3000,
      });
    } catch (reportingError) {
      addError('Failed to send error report. Please try again later.', {
        type: 'warning',
        autoHide: true,
        duration: 5000,
      });
    } finally {
      dispatch({ type: 'SET_REPORTING', payload: false });
    }
  }, [addError]);

  const showSuccess = useCallback((message: string, duration = 3000) => {
    addError(message, {
      type: 'info',
      autoHide: true,
      duration,
    });
  }, [addError]);

  const showWarning = useCallback((message: string, duration = 5000) => {
    addError(message, {
      type: 'warning',
      autoHide: true,
      duration,
    });
  }, [addError]);

  const showInfo = useCallback((message: string, duration = 4000) => {
    addError(message, {
      type: 'info',
      autoHide: true,
      duration,
    });
  }, [addError]);

  const value: ErrorContextValue = {
    state,
    addError,
    removeError,
    clearErrors,
    reportError,
    showSuccess,
    showWarning,
    showInfo,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useErrorContext = (): ErrorContextValue => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
};

// Helper function to create user-friendly messages
function getUserFriendlyMessage(error: DomainException): string {
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
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}