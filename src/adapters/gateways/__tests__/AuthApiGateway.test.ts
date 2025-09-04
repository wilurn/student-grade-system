import { AuthApiGateway } from '../AuthApiGateway';
import { HttpClient } from '../../../frameworks/api/HttpClient';
import { Student, RegisterData } from '../../../entities/Student';
import { ErrorCode, DomainException } from '../../../shared/types';

// Mock HttpClient
const mockHttpClient: jest.Mocked<HttpClient> = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  setAuthToken: jest.fn(),
  removeAuthToken: jest.fn(),
};

describe('AuthApiGateway', () => {
  let authGateway: AuthApiGateway;

  const mockStudent: Student = {
    id: '1',
    studentId: 'STU123456',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHVkZW50SWQiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.signature';

  beforeEach(() => {
    authGateway = new AuthApiGateway(mockHttpClient);
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate user successfully', async () => {
      const mockResponse = {
        student: mockStudent,
        token: mockToken,
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await authGateway.authenticate(
        'test@example.com',
        'password123'
      );

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockHttpClient.setAuthToken).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual({
        student: mockStudent,
        token: mockToken,
      });
    });

    it('should normalize email to lowercase', async () => {
      const mockResponse = {
        student: mockStudent,
        token: mockToken,
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      await authGateway.authenticate('TEST@EXAMPLE.COM', 'password123');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle invalid credentials error', async () => {
      mockHttpClient.post.mockRejectedValue(
        new DomainException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid credentials',
        })
      );

      await expect(
        authGateway.authenticate('test@example.com', 'wrong')
      ).rejects.toThrow(DomainException);
      await expect(
        authGateway.authenticate('test@example.com', 'wrong')
      ).rejects.toMatchObject({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    });

    it('should handle missing response data', async () => {
      mockHttpClient.post.mockResolvedValue({
        student: null,
        token: mockToken,
      });

      await expect(
        authGateway.authenticate('test@example.com', 'password')
      ).rejects.toThrow(DomainException);
      await expect(
        authGateway.authenticate('test@example.com', 'password')
      ).rejects.toMatchObject({
        code: ErrorCode.AUTHENTICATION_ERROR,
        message: 'Invalid response from authentication server',
      });
    });

    it('should handle network errors', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Network error'));

      await expect(
        authGateway.authenticate('test@example.com', 'password')
      ).rejects.toThrow(DomainException);
      await expect(
        authGateway.authenticate('test@example.com', 'password')
      ).rejects.toMatchObject({
        code: ErrorCode.AUTHENTICATION_ERROR,
        message: 'Authentication failed. Please try again.',
      });
    });
  });

  describe('registerStudent', () => {
    const registerData: RegisterData = {
      studentId: 'STU123456',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register student successfully', async () => {
      const mockResponse = {
        student: mockStudent,
        token: mockToken,
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await authGateway.registerStudent(registerData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/auth/register', {
        studentId: 'STU123456',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(mockHttpClient.setAuthToken).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual({
        student: mockStudent,
        token: mockToken,
      });
    });

    it('should normalize email and trim fields', async () => {
      const mockResponse = {
        student: mockStudent,
        token: mockToken,
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const dataWithSpaces = {
        ...registerData,
        email: '  TEST@EXAMPLE.COM  ',
        firstName: '  John  ',
        lastName: '  Doe  ',
      };

      await authGateway.registerStudent(dataWithSpaces);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/auth/register', {
        studentId: 'STU123456',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should handle duplicate user error', async () => {
      mockHttpClient.post.mockRejectedValue(
        new DomainException({
          code: ErrorCode.DUPLICATE_ERROR,
          message: 'User already exists',
        })
      );

      await expect(authGateway.registerStudent(registerData)).rejects.toThrow(
        DomainException
      );
      await expect(
        authGateway.registerStudent(registerData)
      ).rejects.toMatchObject({
        code: ErrorCode.USER_EXISTS,
        message: 'A user with this email or student ID already exists',
      });
    });

    it('should handle validation errors', async () => {
      mockHttpClient.post.mockRejectedValue(
        new DomainException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid email format',
        })
      );

      await expect(authGateway.registerStudent(registerData)).rejects.toThrow(
        DomainException
      );
      await expect(
        authGateway.registerStudent(registerData)
      ).rejects.toMatchObject({
        code: ErrorCode.REGISTRATION_FAILED,
        message: 'Invalid email format',
      });
    });

    it('should handle missing response data', async () => {
      mockHttpClient.post.mockResolvedValue({
        student: mockStudent,
        token: null,
      });

      await expect(authGateway.registerStudent(registerData)).rejects.toThrow(
        DomainException
      );
      await expect(
        authGateway.registerStudent(registerData)
      ).rejects.toMatchObject({
        code: ErrorCode.REGISTRATION_FAILED,
        message: 'Invalid response from registration server',
      });
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      const mockResponse = {
        student: mockStudent,
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await authGateway.validateToken(mockToken);

      expect(mockHttpClient.setAuthToken).toHaveBeenCalledWith(mockToken);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/auth/me');
      expect(result).toEqual(mockStudent);
    });

    it('should handle invalid token', async () => {
      mockHttpClient.get.mockRejectedValue(
        new DomainException({
          code: ErrorCode.AUTHENTICATION_ERROR,
          message: 'Invalid token',
        })
      );

      await expect(authGateway.validateToken('invalid-token')).rejects.toThrow(
        DomainException
      );
      await expect(
        authGateway.validateToken('invalid-token')
      ).rejects.toMatchObject({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Invalid or expired token',
      });
    });

    it('should handle missing student in response', async () => {
      mockHttpClient.get.mockResolvedValue({
        student: null,
      });

      await expect(authGateway.validateToken(mockToken)).rejects.toThrow(
        DomainException
      );
      await expect(authGateway.validateToken(mockToken)).rejects.toMatchObject({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Invalid token response',
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const newToken = 'new-token';
      const mockResponse = {
        student: mockStudent,
        token: newToken,
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await authGateway.refreshToken(mockToken);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/auth/refresh', {
        token: mockToken,
      });
      expect(mockHttpClient.setAuthToken).toHaveBeenCalledWith(newToken);
      expect(result).toEqual({
        student: mockStudent,
        token: newToken,
      });
    });

    it('should handle expired refresh token', async () => {
      mockHttpClient.post.mockRejectedValue(
        new DomainException({
          code: ErrorCode.AUTHENTICATION_ERROR,
          message: 'Token expired',
        })
      );

      await expect(authGateway.refreshToken(mockToken)).rejects.toThrow(
        DomainException
      );
      await expect(authGateway.refreshToken(mockToken)).rejects.toMatchObject({
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Token has expired. Please log in again.',
      });
    });

    it('should handle missing response data', async () => {
      mockHttpClient.post.mockResolvedValue({
        student: null,
        token: 'new-token',
      });

      await expect(authGateway.refreshToken(mockToken)).rejects.toThrow(
        DomainException
      );
      await expect(authGateway.refreshToken(mockToken)).rejects.toMatchObject({
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Invalid refresh response',
      });
    });
  });

  describe('revokeToken', () => {
    it('should revoke token successfully', async () => {
      mockHttpClient.post.mockResolvedValue({});

      await authGateway.revokeToken(mockToken);

      expect(mockHttpClient.setAuthToken).toHaveBeenCalledWith(mockToken);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/auth/logout');
      expect(mockHttpClient.removeAuthToken).toHaveBeenCalled();
    });

    it('should handle server errors gracefully', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Server error'));

      // Should not throw
      await expect(authGateway.revokeToken(mockToken)).resolves.toBeUndefined();

      expect(mockHttpClient.removeAuthToken).toHaveBeenCalled();
    });

    it('should always remove token from client', async () => {
      mockHttpClient.post.mockRejectedValue(
        new DomainException({
          code: ErrorCode.SERVER_ERROR,
          message: 'Server error',
        })
      );

      await authGateway.revokeToken(mockToken);

      expect(mockHttpClient.removeAuthToken).toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    it('should check if gateway is configured', () => {
      expect(authGateway.isConfigured()).toBe(true);
    });

    it('should clear auth state', () => {
      authGateway.clearAuthState();

      expect(mockHttpClient.removeAuthToken).toHaveBeenCalled();
    });
  });
});
