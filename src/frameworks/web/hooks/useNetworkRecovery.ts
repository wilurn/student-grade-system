import { useState, useEffect, useCallback } from 'react';
import { ErrorLogger } from '../../utils/ErrorLogger';
import { DomainException, ErrorCode } from '../../../shared/types';

export interface NetworkRecoveryState {
  isOnline: boolean;
  isRecovering: boolean;
  lastError: Error | null;
  retryCount: number;
}

export interface NetworkRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRecovery?: () => void;
  onFailure?: (error: Error) => void;
}

export const useNetworkRecovery = (options: NetworkRecoveryOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRecovery,
    onFailure,
  } = options;

  const [state, setState] = useState<NetworkRecoveryState>({
    isOnline: navigator.onLine,
    isRecovering: false,
    lastError: null,
    retryCount: 0,
  });

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      if (onRecovery) {
        onRecovery();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onRecovery]);

  const executeWithRecovery = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T> => {
    setState(prev => ({ ...prev, isRecovering: true, lastError: null }));

    try {
      const result = await ErrorLogger.retryWithBackoff(
        operation,
        maxRetries,
        retryDelay
      );

      setState(prev => ({
        ...prev,
        isRecovering: false,
        lastError: null,
        retryCount: 0,
      }));

      return result;
    } catch (error) {
      const err = error as Error;
      
      setState(prev => ({
        ...prev,
        isRecovering: false,
        lastError: err,
        retryCount: maxRetries,
      }));

      // Log the error with context
      ErrorLogger.logError(err, {
        operationName,
        networkRecovery: true,
        maxRetries,
        finalFailure: true,
      });

      if (onFailure) {
        onFailure(err);
      }

      throw err;
    }
  }, [maxRetries, retryDelay, onFailure]);

  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T> => {
    if (!state.isOnline) {
      throw new DomainException({
        code: ErrorCode.NETWORK_ERROR,
        message: 'No internet connection. Please check your network and try again.',
      });
    }

    return executeWithRecovery(operation, operationName);
  }, [state.isOnline, executeWithRecovery]);

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const isConnected = await ErrorLogger.checkConnectivity();
      setState(prev => ({ ...prev, isOnline: isConnected }));
      return isConnected;
    } catch {
      setState(prev => ({ ...prev, isOnline: false }));
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRecovering: false,
      lastError: null,
      retryCount: 0,
    }));
  }, []);

  return {
    ...state,
    executeWithRecovery,
    retry,
    checkConnectivity,
    reset,
  };
};