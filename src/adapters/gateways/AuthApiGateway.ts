import { AuthGateway } from '../../usecases/AuthUseCase';
import { Student, RegisterData } from '../../entities/Student';
import { IHttpClient } from '../../frameworks/api/HttpClient';
import { ErrorCode, DomainException } from '../../shared/types';

export interface AuthApiResponse {
  student: Student;
  token: string;
  expiresAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends RegisterData {}

export interface RefreshTokenRequest {
  token: string;
}

export class AuthApiGateway implements AuthGateway {
  constructor(private httpClient: IHttpClient) {}

  async authenticate(
    email: string,
    password: string
  ): Promise<{ student: Student; token: string }> {
    try {
      const loginData: LoginRequest = {
        email: email.trim().toLowerCase(),
        password,
      };

      const response = await this.httpClient.post<AuthApiResponse>(
        '/api/auth/login',
        loginData
      );

      if (!response.student || !response.token) {
        throw new DomainException({
          code: ErrorCode.AUTHENTICATION_ERROR,
          message: 'Invalid response from authentication server',
        });
      }

      // Set the token in the HTTP client for subsequent requests
      this.httpClient.setAuthToken(response.token);

      return {
        student: response.student,
        token: response.token,
      };
    } catch (error) {
      if (error instanceof DomainException) {
        // Re-map specific authentication errors
        if (error.code === ErrorCode.VALIDATION_ERROR) {
          throw new DomainException({
            code: ErrorCode.INVALID_CREDENTIALS,
            message: 'Invalid email or password',
          });
        }
        throw error;
      }

      throw new DomainException({
        code: ErrorCode.AUTHENTICATION_ERROR,
        message: 'Authentication failed. Please try again.',
      });
    }
  }

  async registerStudent(
    studentData: RegisterData
  ): Promise<{ student: Student; token: string }> {
    try {
      const registerData: RegisterRequest = {
        studentId: studentData.studentId.trim(),
        email: studentData.email.trim().toLowerCase(),
        password: studentData.password,
        firstName: studentData.firstName.trim(),
        lastName: studentData.lastName.trim(),
      };

      const response = await this.httpClient.post<AuthApiResponse>(
        '/api/auth/register',
        registerData
      );

      if (!response.student || !response.token) {
        throw new DomainException({
          code: ErrorCode.REGISTRATION_FAILED,
          message: 'Invalid response from registration server',
        });
      }

      // Set the token in the HTTP client for subsequent requests
      this.httpClient.setAuthToken(response.token);

      return {
        student: response.student,
        token: response.token,
      };
    } catch (error) {
      if (error instanceof DomainException) {
        // Re-map specific registration errors
        if (error.code === ErrorCode.DUPLICATE_ERROR) {
          throw new DomainException({
            code: ErrorCode.USER_EXISTS,
            message: 'A user with this email or student ID already exists',
          });
        }
        if (error.code === ErrorCode.VALIDATION_ERROR) {
          throw new DomainException({
            code: ErrorCode.REGISTRATION_FAILED,
            message: error.message,
          });
        }
        throw error;
      }

      throw new DomainException({
        code: ErrorCode.REGISTRATION_FAILED,
        message: 'Registration failed. Please try again.',
      });
    }
  }

  async validateToken(token: string): Promise<Student> {
    try {
      // Set the token for this request
      this.httpClient.setAuthToken(token);

      const response = await this.httpClient.get<{ student: Student }>(
        '/api/auth/me'
      );

      if (!response.student) {
        throw new DomainException({
          code: ErrorCode.TOKEN_INVALID,
          message: 'Invalid token response',
        });
      }

      return response.student;
    } catch (error) {
      if (error instanceof DomainException) {
        // Re-map authentication errors to token-specific errors
        if (error.code === ErrorCode.AUTHENTICATION_ERROR) {
          throw new DomainException({
            code: ErrorCode.TOKEN_INVALID,
            message: 'Invalid or expired token',
          });
        }
        throw error;
      }

      throw new DomainException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Token validation failed',
      });
    }
  }

  async refreshToken(
    token: string
  ): Promise<{ student: Student; token: string }> {
    try {
      const refreshData: RefreshTokenRequest = { token };

      const response = await this.httpClient.post<AuthApiResponse>(
        '/api/auth/refresh',
        refreshData
      );

      if (!response.student || !response.token) {
        throw new DomainException({
          code: ErrorCode.TOKEN_EXPIRED,
          message: 'Invalid refresh response',
        });
      }

      // Update the token in the HTTP client
      this.httpClient.setAuthToken(response.token);

      return {
        student: response.student,
        token: response.token,
      };
    } catch (error) {
      if (error instanceof DomainException) {
        // Re-map errors to token-specific errors
        if (
          [
            ErrorCode.AUTHENTICATION_ERROR,
            ErrorCode.AUTHORIZATION_ERROR,
          ].includes(error.code)
        ) {
          throw new DomainException({
            code: ErrorCode.TOKEN_EXPIRED,
            message: 'Token has expired. Please log in again.',
          });
        }
        throw error;
      }

      throw new DomainException({
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Token refresh failed. Please log in again.',
      });
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
      // Set the token for this request
      this.httpClient.setAuthToken(token);

      await this.httpClient.post('/api/auth/logout');

      // Remove the token from the HTTP client
      this.httpClient.removeAuthToken();
    } catch (error) {
      // Log the error but don't throw - logout should be graceful
      console.warn('Failed to revoke token on server:', error);

      // Still remove the token from the HTTP client
      this.httpClient.removeAuthToken();
    }
  }

  // Utility method to check if the gateway is properly configured
  isConfigured(): boolean {
    return this.httpClient !== null;
  }

  // Method to clear authentication state
  clearAuthState(): void {
    this.httpClient.removeAuthToken();
  }
}
