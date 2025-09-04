import { renderHook, act, waitFor } from '@testing-library/react';
import { useNetworkRecovery } from '../useNetworkRecovery';
import { ErrorLogger } from '../../../utils/ErrorLogger';
import { DomainException, ErrorCode } from '../../../../shared/types';

// Mock ErrorLogger
jest.mock('../../../utils/ErrorLogger', () => ({
  ErrorLogger: {
    retryWithBackoff: jest.fn(),
    checkConnectivity: jest.fn(),
    logError: jest.fn(),
  },
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('useNetworkRecovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    navigator.onLine = true;
  });

  afterEach(() => {
    // Clean up event listeners
    window.removeEventListener('online', jest.fn());
    window.removeEventListener('offline', jest.fn());
  });

  it('initializes with correct online state', () => {
    const { result } = renderHook(() => useNetworkRecovery());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isRecovering).toBe(false);
    expect(result.current.lastError).toBe(null);
    expect(result.current.retryCount).toBe(0);
  });

  it('initializes with offline state when navigator is offline', () => {
    navigator.onLine = false;

    const { result } = renderHook(() => useNetworkRecovery());

    expect(result.current.isOnline).toBe(false);
  });

  it('handles online event', () => {
    navigator.onLine = false;
    const onRecovery = jest.fn();
    
    const { result } = renderHook(() => useNetworkRecovery({ onRecovery }));

    expect(result.current.isOnline).toBe(false);

    act(() => {
      navigator.onLine = true;
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
    expect(onRecovery).toHaveBeenCalled();
  });

  it('handles offline event', () => {
    const { result } = renderHook(() => useNetworkRecovery());

    expect(result.current.isOnline).toBe(true);

    act(() => {
      navigator.onLine = false;
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
  });

  describe('executeWithRecovery', () => {
    it('executes operation successfully', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      (ErrorLogger.retryWithBackoff as jest.Mock).mockResolvedValue('success');

      const { result } = renderHook(() => useNetworkRecovery());

      let operationResult: string;
      await act(async () => {
        operationResult = await result.current.executeWithRecovery(operation, 'test-operation');
      });

      expect(operationResult!).toBe('success');
      expect(result.current.isRecovering).toBe(false);
      expect(result.current.lastError).toBe(null);
      expect(result.current.retryCount).toBe(0);
    });

    it('handles operation failure', async () => {
      const error = new Error('Operation failed');
      const operation = jest.fn().mockRejectedValue(error);
      (ErrorLogger.retryWithBackoff as jest.Mock).mockRejectedValue(error);
      
      const onFailure = jest.fn();
      const { result } = renderHook(() => useNetworkRecovery({ onFailure }));

      await act(async () => {
        try {
          await result.current.executeWithRecovery(operation, 'test-operation');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.isRecovering).toBe(false);
      expect(result.current.lastError).toBe(error);
      expect(result.current.retryCount).toBe(3); // Default maxRetries
      expect(onFailure).toHaveBeenCalledWith(error);
      expect(ErrorLogger.logError).toHaveBeenCalledWith(error, {
        operationName: 'test-operation',
        networkRecovery: true,
        maxRetries: 3,
        finalFailure: true,
      });
    });

    it('sets recovering state during operation', async () => {
      const operation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('success'), 100))
      );
      (ErrorLogger.retryWithBackoff as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('success'), 100))
      );

      const { result } = renderHook(() => useNetworkRecovery());

      act(() => {
        result.current.executeWithRecovery(operation);
      });

      expect(result.current.isRecovering).toBe(true);

      await waitFor(() => {
        expect(result.current.isRecovering).toBe(false);
      });
    });
  });

  describe('retry', () => {
    it('executes operation when online', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      (ErrorLogger.retryWithBackoff as jest.Mock).mockResolvedValue('success');

      const { result } = renderHook(() => useNetworkRecovery());

      let operationResult: string;
      await act(async () => {
        operationResult = await result.current.retry(operation, 'test-operation');
      });

      expect(operationResult!).toBe('success');
    });

    it('throws network error when offline', async () => {
      const operation = jest.fn();
      const { result } = renderHook(() => useNetworkRecovery());

      act(() => {
        navigator.onLine = false;
        window.dispatchEvent(new Event('offline'));
      });

      await act(async () => {
        try {
          await result.current.retry(operation);
          fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(DomainException);
          expect((error as DomainException).code).toBe(ErrorCode.NETWORK_ERROR);
        }
      });

      expect(operation).not.toHaveBeenCalled();
    });
  });

  describe('checkConnectivity', () => {
    it('updates online state based on connectivity check', async () => {
      (ErrorLogger.checkConnectivity as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useNetworkRecovery());

      let connectivityResult: boolean;
      await act(async () => {
        connectivityResult = await result.current.checkConnectivity();
      });

      expect(connectivityResult!).toBe(true);
      expect(result.current.isOnline).toBe(true);
    });

    it('sets offline state when connectivity check fails', async () => {
      (ErrorLogger.checkConnectivity as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useNetworkRecovery());

      let connectivityResult: boolean;
      await act(async () => {
        connectivityResult = await result.current.checkConnectivity();
      });

      expect(connectivityResult!).toBe(false);
      expect(result.current.isOnline).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets error state', async () => {
      const error = new Error('Test error');
      const operation = jest.fn().mockRejectedValue(error);
      (ErrorLogger.retryWithBackoff as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useNetworkRecovery());

      // Cause an error
      await act(async () => {
        try {
          await result.current.executeWithRecovery(operation);
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.lastError).toBe(error);
      expect(result.current.retryCount).toBe(3);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.lastError).toBe(null);
      expect(result.current.retryCount).toBe(0);
      expect(result.current.isRecovering).toBe(false);
    });
  });

  describe('custom options', () => {
    it('uses custom maxRetries', async () => {
      const error = new Error('Test error');
      const operation = jest.fn().mockRejectedValue(error);
      (ErrorLogger.retryWithBackoff as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useNetworkRecovery({ maxRetries: 5 }));

      await act(async () => {
        try {
          await result.current.executeWithRecovery(operation);
        } catch (e) {
          // Expected
        }
      });

      expect(ErrorLogger.retryWithBackoff).toHaveBeenCalledWith(
        operation,
        5,
        1000
      );
      expect(result.current.retryCount).toBe(5);
    });

    it('uses custom retryDelay', async () => {
      const error = new Error('Test error');
      const operation = jest.fn().mockRejectedValue(error);
      (ErrorLogger.retryWithBackoff as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useNetworkRecovery({ retryDelay: 2000 }));

      await act(async () => {
        try {
          await result.current.executeWithRecovery(operation);
        } catch (e) {
          // Expected
        }
      });

      expect(ErrorLogger.retryWithBackoff).toHaveBeenCalledWith(
        operation,
        3,
        2000
      );
    });
  });
});