import {
  Student,
  RegisterData,
  AuthResult,
  ValidationResult,
  StudentValidator,
} from '../entities/Student';
import { DomainError, ErrorCode, DomainException } from '../shared/types';

export interface AuthUseCase {
  login(email: string, password: string): Promise<AuthResult>;
  register(studentData: RegisterData): Promise<AuthResult>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<Student | null>;
  validateLoginData(email: string, password: string): ValidationResult;
  validateRegistrationData(data: RegisterData): ValidationResult;
  refreshToken(): Promise<AuthResult>;
  isAuthenticated(): boolean;
}

// Authentication gateway interface for dependency injection
export interface AuthGateway {
  authenticate(
    email: string,
    password: string
  ): Promise<{ student: Student; token: string }>;
  registerStudent(
    studentData: RegisterData
  ): Promise<{ student: Student; token: string }>;
  validateToken(token: string): Promise<Student>;
  refreshToken(token: string): Promise<{ student: Student; token: string }>;
  revokeToken(token: string): Promise<void>;
}

// Token storage interface for dependency injection
export interface TokenStorage {
  getToken(): string | null;
  setToken(token: string): void;
  removeToken(): void;
  isTokenExpired(token: string): boolean;
}

// Authentication-specific error types
export interface AuthError extends DomainError {
  code:
    | ErrorCode.INVALID_CREDENTIALS
    | ErrorCode.USER_EXISTS
    | ErrorCode.TOKEN_EXPIRED
    | ErrorCode.TOKEN_INVALID
    | ErrorCode.REGISTRATION_FAILED;
}

// Extended auth result with more detailed information
export interface DetailedAuthResult extends AuthResult {
  expiresAt?: Date;
  refreshToken?: string;
  permissions?: string[];
}

// Login attempt tracking (for security)
export interface LoginAttempt {
  email: string;
  timestamp: Date;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}

// Session information
export interface UserSession {
  student: Student;
  token: string;
  expiresAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

// Concrete implementation of AuthUseCase
export class AuthUseCaseImpl implements AuthUseCase {
  constructor(
    private authGateway: AuthGateway,
    private tokenStorage: TokenStorage
  ) {}

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      // Validate input data
      const validation = this.validateLoginData(email, password);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }

      // Authenticate with gateway
      const result = await this.authGateway.authenticate(
        email.trim().toLowerCase(),
        password
      );

      // Store token
      this.tokenStorage.setToken(result.token);

      return {
        success: true,
        student: result.student,
        token: result.token,
      };
    } catch (error) {
      if (error instanceof DomainException) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'Login failed. Please check your credentials and try again.',
      };
    }
  }

  async register(studentData: RegisterData): Promise<AuthResult> {
    try {
      // Validate registration data
      const validation = this.validateRegistrationData(studentData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }

      // Register with gateway
      const result = await this.authGateway.registerStudent(studentData);

      // Store token
      this.tokenStorage.setToken(result.token);

      return {
        success: true,
        student: result.student,
        token: result.token,
      };
    } catch (error) {
      if (error instanceof DomainException) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'Registration failed. Please try again.',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      const token = this.tokenStorage.getToken();
      if (token) {
        await this.authGateway.revokeToken(token);
      }
    } catch (error) {
      // Log error but don't throw - logout should always succeed locally
      console.warn('Failed to revoke token on server:', error);
    } finally {
      // Always remove token locally
      this.tokenStorage.removeToken();
    }
  }

  async getCurrentUser(): Promise<Student | null> {
    try {
      const token = this.tokenStorage.getToken();
      if (!token) {
        return null;
      }

      if (this.tokenStorage.isTokenExpired(token)) {
        this.tokenStorage.removeToken();
        return null;
      }

      const student = await this.authGateway.validateToken(token);
      return student;
    } catch (error) {
      // Token is invalid, remove it
      this.tokenStorage.removeToken();
      return null;
    }
  }

  validateLoginData(email: string, password: string): ValidationResult {
    return StudentValidator.validateLoginData(email, password);
  }

  validateRegistrationData(data: RegisterData): ValidationResult {
    return StudentValidator.validateRegistrationData(data);
  }

  async refreshToken(): Promise<AuthResult> {
    try {
      const currentToken = this.tokenStorage.getToken();
      if (!currentToken) {
        return {
          success: false,
          error: 'No token available to refresh',
        };
      }

      const result = await this.authGateway.refreshToken(currentToken);

      // Store new token
      this.tokenStorage.setToken(result.token);

      return {
        success: true,
        student: result.student,
        token: result.token,
      };
    } catch (error) {
      // Remove invalid token
      this.tokenStorage.removeToken();

      return {
        success: false,
        error: 'Token refresh failed. Please log in again.',
      };
    }
  }

  isAuthenticated(): boolean {
    const token = this.tokenStorage.getToken();
    return token !== null && !this.tokenStorage.isTokenExpired(token);
  }
}
