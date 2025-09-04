import { ErrorLogger } from '../ErrorLogger';
import { DomainException, ErrorCode } from '../../../shared/types';

// Mock fetch for testing
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-user-agent',
  },
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/test',
  },
});

describe('ErrorLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'group').mockImplementation();
    jest.spyOn(console, 'groupEnd').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    ErrorLogger.clearErrorLogs();
  });

  describe('generateErrorId', () => {
    it('generates unique error IDs', () => {
      const id1 = ErrorLogger.generateErrorId();
      const id2 = ErrorLogger.generateErrorId();

      expect(id1).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('logError', () => {
    it('logs basic error', () => {
      const error = new Error('Test error');
      const errorId = ErrorLogger.logError(error);

      expect(errorId).toMatch(/^err_\d+_[a-z0-9]+$/);
      
      const logEntry = ErrorLogger.getErrorLog(errorId);
      expect(logEntry).toBeDefined();
      expect(logEntry?.error).toBe(error);
      expect(logEntry?.severity).toBe('medium');
    });

    it('logs error with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      const errorId = ErrorLogger.logError(error, context);

      const logEntry = ErrorLogger.getErrorLog(errorId);
      expect(logEntry?.context).toEqual(context);
    });

    it('determines correct severity for domain exceptions', () => {
      const authError = new DomainException({
        code: ErrorCode.AUTHENTICATION_ERROR,
        message: 'Auth failed',
      });
      const serverError = new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Server failed',
      });
      const validationError = new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
      });

      const authId = ErrorLogger.logError(authError);
      const serverId = ErrorLogger.logError(serverError);
      const validationId = ErrorLogger.logError(validationError);

      expect(ErrorLogger.getErrorLog(authId)?.severity).toBe('medium');
      expect(ErrorLogger.getErrorLog(serverId)?.severity).toBe('high');
      expect(ErrorLogger.getErrorLog(validationId)?.severity).toBe('low');
    });

    it('determines correct severity for JavaScript errors', () => {
      const typeError = new TypeError('Type error');
      const referenceError = new ReferenceError('Reference error');
      const genericError = new Error('Generic error');

      const typeId = ErrorLogger.logError(typeError);
      const refId = ErrorLogger.logError(referenceError);
      const genericId = ErrorLogger.logError(genericError);

      expect(ErrorLogger.getErrorLog(typeId)?.severity).toBe('high');
      expect(ErrorLogger.getErrorLog(refId)?.severity).toBe('high');
      expect(ErrorLogger.getErrorLog(genericId)?.severity).toBe('medium');
    });

    it('persists error to localStorage', () => {
      const error = new Error('Test error');
      ErrorLogger.logError(error);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'errorLogs',
        expect.stringContaining('Test error')
      );
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      const error = new Error('Test error');
      expect(() => ErrorLogger.logError(error)).not.toThrow();
    });
  });

  describe('reportError', () => {
    it('reports error successfully', async () => {
      const error = new Error('Test error');
      const errorId = ErrorLogger.logError(error);

      const result = await ErrorLogger.reportError(errorId);

      expect(result).toBe(true);
      
      const logEntry = ErrorLogger.getErrorLog(errorId);
      expect(logEntry?.reported).toBe(true);
    });

    it('returns false for non-existent error ID', async () => {
      const result = await ErrorLogger.reportError('non-existent-id');
      expect(result).toBe(false);
    });

    it('returns false for already reported error', async () => {
      const error = new Error('Test error');
      const errorId = ErrorLogger.logError(error);

      await ErrorLogger.reportError(errorId);
      const result = await ErrorLogger.reportError(errorId);

      expect(result).toBe(false);
    });

    it('handles reporting failure gracefully', async () => {
      // Mock console.error to suppress error output
      jest.spyOn(console, 'error').mockImplementation();

      const error = new Error('Test error');
      const errorId = ErrorLogger.logError(error);

      // Mock a failed report
      jest.spyOn(ErrorLogger as any, 'sendErrorReport').mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await ErrorLogger.reportError(errorId);
      expect(result).toBe(false);
    });
  });

  describe('retryWithBackoff', () => {
    it('succeeds on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await ErrorLogger.retryWithBackoff(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually succeeds', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const result = await ErrorLogger.retryWithBackoff(operation, 3);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('fails after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(ErrorLogger.retryWithBackoff(operation, 2)).rejects.toThrow('Always fails');
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('does not retry on authentication errors', async () => {
      const authError = new DomainException({
        code: ErrorCode.AUTHENTICATION_ERROR,
        message: 'Auth failed',
      });
      const operation = jest.fn().mockRejectedValue(authError);

      await expect(ErrorLogger.retryWithBackoff(operation, 3)).rejects.toThrow('Auth failed');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkConnectivity', () => {
    it('returns true when health check succeeds', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await ErrorLogger.checkConnectivity();

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });
    });

    it('returns false when health check fails', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await ErrorLogger.checkConnectivity();

      expect(result).toBe(false);
    });
  });

  describe('setupGlobalErrorHandlers', () => {
    it('sets up global error handlers', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      ErrorLogger.setupGlobalErrorHandlers();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'error',
        expect.any(Function),
        true
      );
    });
  });

  describe('error log management', () => {
    it('returns all error logs sorted by timestamp', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      const id1 = ErrorLogger.logError(error1);
      const id2 = ErrorLogger.logError(error2);

      const logs = ErrorLogger.getAllErrorLogs();

      expect(logs).toHaveLength(2);
      expect(logs[0].id).toBe(id2); // Most recent first
      expect(logs[1].id).toBe(id1);
    });

    it('returns unreported errors', async () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      const id1 = ErrorLogger.logError(error1);
      const id2 = ErrorLogger.logError(error2);

      await ErrorLogger.reportError(id1);

      const unreported = ErrorLogger.getUnreportedErrors();

      expect(unreported).toHaveLength(1);
      expect(unreported[0].id).toBe(id2);
    });

    it('clears all error logs', () => {
      ErrorLogger.logError(new Error('Error 1'));
      ErrorLogger.logError(new Error('Error 2'));

      expect(ErrorLogger.getAllErrorLogs()).toHaveLength(2);

      ErrorLogger.clearErrorLogs();

      expect(ErrorLogger.getAllErrorLogs()).toHaveLength(0);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('errorLogs');
    });

    it('limits stored errors to maximum count', () => {
      // Log more than the maximum number of errors
      for (let i = 0; i < 105; i++) {
        ErrorLogger.logError(new Error(`Error ${i}`));
      }

      const logs = ErrorLogger.getAllErrorLogs();
      expect(logs.length).toBeLessThanOrEqual(100);
    });
  });
});