export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export type AsyncState<T> = LoadingState & {
  data: T | null;
};

// Domain-specific error types
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  DUPLICATE_ERROR = 'DUPLICATE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  BUSINESS_RULE_ERROR = 'BUSINESS_RULE_ERROR',
  // Auth-specific errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_EXISTS = 'USER_EXISTS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  REGISTRATION_FAILED = 'REGISTRATION_FAILED',
  // Grade-specific errors
  GRADE_NOT_FOUND = 'GRADE_NOT_FOUND',
  CORRECTION_NOT_ALLOWED = 'CORRECTION_NOT_ALLOWED',
  MAX_CORRECTIONS_REACHED = 'MAX_CORRECTIONS_REACHED',
  DUPLICATE_CORRECTION = 'DUPLICATE_CORRECTION',
  INVALID_GRADE_DATA = 'INVALID_GRADE_DATA',
}

export interface DomainError {
  code: ErrorCode;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export class DomainException extends Error {
  public readonly code: ErrorCode;
  public readonly field?: string;
  public readonly details?: Record<string, unknown>;

  constructor(error: DomainError) {
    super(error.message);
    this.name = 'DomainException';
    this.code = error.code;
    this.field = error.field;
    this.details = error.details;
  }
}

// Common validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Pagination types for lists
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter types for grade queries
export interface GradeFilters {
  semester?: string;
  courseCode?: string;
  minGrade?: string;
  maxGrade?: string;
}

export interface CorrectionFilters {
  status?: 'pending' | 'approved' | 'rejected';
  semester?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Common UI state types
export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Authentication token payload
export interface TokenPayload {
  studentId: string;
  email: string;
  iat: number;
  exp: number;
}

// Common constants
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Utility type for making properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Utility type for creating update payloads (generic version)
export type UpdatePayload<T> = Partial<T>;

// Event types for domain events (future use)
export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  data: Record<string, unknown>;
  timestamp: Date;
  version: number;
}
