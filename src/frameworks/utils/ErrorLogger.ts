import { DomainException, ErrorCode } from '../../shared/types';

export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  error: Error;
  context?: Record<string, any>;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reported: boolean;
}

export interface ErrorReportPayload {
  errorId: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userAgent: string;
  url: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  severity: string;
}

class ErrorLoggerService {
  private logs: Map<string, ErrorLogEntry> = new Map();
  private maxLogs = 100; // Keep only the last 100 errors in memory
  private reportingEndpoint = '/api/errors/report';

  generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  logError(error: Error, context?: Record<string, any>): string {
    const errorId = this.generateErrorId();
    const severity = this.determineSeverity(error);
    
    const logEntry: ErrorLogEntry = {
      id: errorId,
      timestamp: new Date(),
      error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      severity,
      reported: false,
    };

    // Store in memory
    this.logs.set(errorId, logEntry);
    
    // Clean up old logs if we exceed the limit
    if (this.logs.size > this.maxLogs) {
      const oldestKey = this.logs.keys().next().value;
      this.logs.delete(oldestKey);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Logged: ${errorId}`);
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Severity:', severity);
      console.groupEnd();
    }

    // Auto-report critical errors
    if (severity === 'critical') {
      this.reportError(errorId);
    }

    // Store in localStorage for persistence across sessions
    this.persistError(logEntry);

    return errorId;
  }

  async reportError(errorId: string): Promise<boolean> {
    const logEntry = this.logs.get(errorId);
    if (!logEntry || logEntry.reported) {
      return false;
    }

    try {
      const payload: ErrorReportPayload = {
        errorId: logEntry.id,
        message: logEntry.error.message,
        stack: logEntry.error.stack,
        context: logEntry.context,
        userAgent: logEntry.userAgent,
        url: logEntry.url,
        timestamp: logEntry.timestamp.toISOString(),
        userId: logEntry.userId,
        sessionId: logEntry.sessionId,
        severity: logEntry.severity,
      };

      // In a real application, this would send to your error reporting service
      // For now, we'll simulate the API call
      await this.sendErrorReport(payload);

      // Mark as reported
      logEntry.reported = true;
      this.logs.set(errorId, logEntry);

      console.log(`✅ Error ${errorId} reported successfully`);
      return true;
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
      return false;
    }
  }

  private async sendErrorReport(payload: ErrorReportPayload): Promise<void> {
    // Simulate API call - in a real app, this would be an actual HTTP request
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate simulation
          resolve();
        } else {
          reject(new Error('Failed to send error report'));
        }
      }, 1000);
    });
  }

  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof DomainException) {
      switch (error.code) {
        case ErrorCode.AUTHENTICATION_ERROR:
        case ErrorCode.AUTHORIZATION_ERROR:
          return 'medium';
        case ErrorCode.VALIDATION_ERROR:
          return 'low';
        case ErrorCode.NETWORK_ERROR:
          return 'medium';
        case ErrorCode.SERVER_ERROR:
          return 'high';
        default:
          return 'medium';
      }
    }

    // Check for critical JavaScript errors
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      return 'high';
    }

    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'high';
    }

    return 'medium';
  }

  private getCurrentUserId(): string | undefined {
    // In a real app, this would get the current user ID from your auth system
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.studentId;
      }
    } catch {
      // Ignore errors when parsing token
    }
    return undefined;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  private persistError(logEntry: ErrorLogEntry): void {
    try {
      const persistedErrors = this.getPersistedErrors();
      persistedErrors.push({
        id: logEntry.id,
        timestamp: logEntry.timestamp.toISOString(),
        message: logEntry.error.message,
        stack: logEntry.error.stack,
        severity: logEntry.severity,
        reported: logEntry.reported,
      });

      // Keep only the last 50 errors in localStorage
      if (persistedErrors.length > 50) {
        persistedErrors.splice(0, persistedErrors.length - 50);
      }

      localStorage.setItem('errorLogs', JSON.stringify(persistedErrors));
    } catch {
      // Ignore localStorage errors
    }
  }

  private getPersistedErrors(): any[] {
    try {
      const stored = localStorage.getItem('errorLogs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Public methods for accessing error logs
  getErrorLog(errorId: string): ErrorLogEntry | undefined {
    return this.logs.get(errorId);
  }

  getAllErrorLogs(): ErrorLogEntry[] {
    return Array.from(this.logs.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  getUnreportedErrors(): ErrorLogEntry[] {
    return this.getAllErrorLogs().filter(log => !log.reported);
  }

  clearErrorLogs(): void {
    this.logs.clear();
    localStorage.removeItem('errorLogs');
  }

  // Network error recovery mechanisms
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors
        if (error instanceof DomainException) {
          const nonRetryableCodes = [
            ErrorCode.AUTHENTICATION_ERROR,
            ErrorCode.AUTHORIZATION_ERROR,
            ErrorCode.VALIDATION_ERROR,
            ErrorCode.NOT_FOUND_ERROR,
          ];
          
          if (nonRetryableCodes.includes(error.code)) {
            throw error;
          }
        }

        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Log the final failure
    this.logError(lastError!, {
      operation: 'retryWithBackoff',
      maxRetries,
      finalAttempt: true,
    });

    throw lastError!;
  }

  // Check network connectivity
  async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Setup global error handlers
  setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      this.logError(error, {
        type: 'unhandledPromiseRejection',
        promise: event.promise,
      });
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError(event.error || new Error(event.message), {
        type: 'globalError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        this.logError(new Error(`Resource failed to load: ${target.tagName}`), {
          type: 'resourceError',
          tagName: target.tagName,
          src: (target as any).src || (target as any).href,
        });
      }
    }, true);
  }
}

export const ErrorLogger = new ErrorLoggerService();