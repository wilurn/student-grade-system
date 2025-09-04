import { AuthUseCaseImpl, AuthGateway, TokenStorage } from '../AuthUseCase';
import { Student, RegisterData } from '../../entities/Student';
import { DomainException, ErrorCode } from '../../shared/types';

// Mock implementations
class MockAuthGateway implements AuthGateway {
  private students: Map<string, { student: Student; password: string }> =
    new Map();
  private tokens: Map<string, Student> = new Map();

  async authenticate(
    email: string,
    password: string
  ): Promise<{ student: Student; token: string }> {
    const studentData = this.students.get(email);
    if (!studentData || studentData.password !== password) {
      throw new DomainException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    const token = `token_${Date.now()}_${Math.random()}`;
    this.tokens.set(token, studentData.student);

    return {
      student: studentData.student,
      token,
    };
  }

  async registerStudent(
    studentData: RegisterData
  ): Promise<{ student: Student; token: string }> {
    if (this.students.has(studentData.email)) {
      throw new DomainException({
        code: ErrorCode.USER_EXISTS,
        message: 'A user with this email already exists',
      });
    }

    const student: Student = {
      id: `student_${Date.now()}`,
      studentId: studentData.studentId,
      email: studentData.email,
      firstName: studentData.firstName,
      lastName: studentData.lastName,
    };

    this.students.set(studentData.email, {
      student,
      password: studentData.password,
    });

    const token = `token_${Date.now()}_${Math.random()}`;
    this.tokens.set(token, student);

    return { student, token };
  }

  async validateToken(token: string): Promise<Student> {
    const student = this.tokens.get(token);
    if (!student) {
      throw new DomainException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Invalid token',
      });
    }
    return student;
  }

  async refreshToken(
    token: string
  ): Promise<{ student: Student; token: string }> {
    const student = await this.validateToken(token);
    const newToken = `token_${Date.now()}_${Math.random()}`;
    this.tokens.delete(token);
    this.tokens.set(newToken, student);

    return { student, token: newToken };
  }

  async revokeToken(token: string): Promise<void> {
    this.tokens.delete(token);
  }

  // Test helper methods
  addStudent(email: string, password: string, student: Student) {
    this.students.set(email, { student, password });
  }

  clear() {
    this.students.clear();
    this.tokens.clear();
  }
}

class MockTokenStorage implements TokenStorage {
  private token: string | null = null;
  private expiredTokens: Set<string> = new Set();

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
  }

  removeToken(): void {
    this.token = null;
  }

  isTokenExpired(token: string): boolean {
    return this.expiredTokens.has(token);
  }

  // Test helper methods
  setExpiredToken(token: string) {
    this.expiredTokens.add(token);
  }

  clear() {
    this.token = null;
    this.expiredTokens.clear();
  }
}

describe('AuthUseCaseImpl', () => {
  let authUseCase: AuthUseCaseImpl;
  let mockAuthGateway: MockAuthGateway;
  let mockTokenStorage: MockTokenStorage;

  const validStudent: Student = {
    id: 'student_123',
    studentId: 'STU123456',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  const validRegisterData: RegisterData = {
    studentId: 'STU123456',
    email: 'john.doe@example.com',
    password: 'Password123',
    firstName: 'John',
    lastName: 'Doe',
  };

  beforeEach(() => {
    mockAuthGateway = new MockAuthGateway();
    mockTokenStorage = new MockTokenStorage();
    authUseCase = new AuthUseCaseImpl(mockAuthGateway, mockTokenStorage);
  });

  afterEach(() => {
    mockAuthGateway.clear();
    mockTokenStorage.clear();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      mockAuthGateway.addStudent(
        'john.doe@example.com',
        'Password123',
        validStudent
      );

      // Act
      const result = await authUseCase.login(
        'john.doe@example.com',
        'Password123'
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.student).toEqual(validStudent);
      expect(result.token).toBeDefined();
      expect(mockTokenStorage.getToken()).toBe(result.token);
    });

    it('should fail login with invalid credentials', async () => {
      // Arrange
      mockAuthGateway.addStudent(
        'john.doe@example.com',
        'Password123',
        validStudent
      );

      // Act
      const result = await authUseCase.login(
        'john.doe@example.com',
        'WrongPassword'
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
      expect(result.student).toBeUndefined();
      expect(mockTokenStorage.getToken()).toBeNull();
    });

    it('should fail login with empty email', async () => {
      // Act
      const result = await authUseCase.login('', 'Password123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Email is required');
    });

    it('should fail login with empty password', async () => {
      // Act
      const result = await authUseCase.login('john.doe@example.com', '');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Password is required');
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      mockAuthGateway.addStudent(
        'john.doe@example.com',
        'Password123',
        validStudent
      );

      // Act
      const result = await authUseCase.login(
        'JOHN.DOE@EXAMPLE.COM',
        'Password123'
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.student).toEqual(validStudent);
    });
  });

  describe('register', () => {
    it('should successfully register with valid data', async () => {
      // Act
      const result = await authUseCase.register(validRegisterData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.student).toBeDefined();
      expect(result.student?.email).toBe(validRegisterData.email);
      expect(result.token).toBeDefined();
      expect(mockTokenStorage.getToken()).toBe(result.token);
    });

    it('should fail registration with existing email', async () => {
      // Arrange
      await authUseCase.register(validRegisterData);

      // Act
      const result = await authUseCase.register(validRegisterData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('A user with this email already exists');
    });

    it('should fail registration with invalid email', async () => {
      // Arrange
      const invalidData = { ...validRegisterData, email: 'invalid-email' };

      // Act
      const result = await authUseCase.register(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Email format is invalid');
    });

    it('should fail registration with weak password', async () => {
      // Arrange
      const invalidData = { ...validRegisterData, password: '123' };

      // Act
      const result = await authUseCase.register(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Password must be at least 8 characters long'
      );
    });

    it('should fail registration with invalid student ID', async () => {
      // Arrange
      const invalidData = { ...validRegisterData, studentId: '123' };

      // Act
      const result = await authUseCase.register(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Student ID must be 6-20 alphanumeric characters'
      );
    });

    it('should fail registration with empty first name', async () => {
      // Arrange
      const invalidData = { ...validRegisterData, firstName: '' };

      // Act
      const result = await authUseCase.register(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('First name is required');
    });

    it('should fail registration with empty last name', async () => {
      // Arrange
      const invalidData = { ...validRegisterData, lastName: '' };

      // Act
      const result = await authUseCase.register(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Last name is required');
    });
  });

  describe('logout', () => {
    it('should successfully logout and remove token', async () => {
      // Arrange
      await authUseCase.register(validRegisterData);
      expect(mockTokenStorage.getToken()).not.toBeNull();

      // Act
      await authUseCase.logout();

      // Assert
      expect(mockTokenStorage.getToken()).toBeNull();
    });

    it('should handle logout when no token exists', async () => {
      // Act & Assert - should not throw
      await expect(authUseCase.logout()).resolves.toBeUndefined();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when valid token exists', async () => {
      // Arrange
      const registerResult = await authUseCase.register(validRegisterData);
      expect(registerResult.success).toBe(true);

      // Act
      const currentUser = await authUseCase.getCurrentUser();

      // Assert
      expect(currentUser).toEqual(registerResult.student);
    });

    it('should return null when no token exists', async () => {
      // Act
      const currentUser = await authUseCase.getCurrentUser();

      // Assert
      expect(currentUser).toBeNull();
    });

    it('should return null and remove token when token is expired', async () => {
      // Arrange
      const registerResult = await authUseCase.register(validRegisterData);
      const token = registerResult.token!;
      mockTokenStorage.setExpiredToken(token);

      // Act
      const currentUser = await authUseCase.getCurrentUser();

      // Assert
      expect(currentUser).toBeNull();
      expect(mockTokenStorage.getToken()).toBeNull();
    });

    it('should return null and remove token when token is invalid', async () => {
      // Arrange
      mockTokenStorage.setToken('invalid_token');

      // Act
      const currentUser = await authUseCase.getCurrentUser();

      // Assert
      expect(currentUser).toBeNull();
      expect(mockTokenStorage.getToken()).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh valid token', async () => {
      // Arrange
      const registerResult = await authUseCase.register(validRegisterData);
      const originalToken = registerResult.token!;

      // Act
      const refreshResult = await authUseCase.refreshToken();

      // Assert
      expect(refreshResult.success).toBe(true);
      expect(refreshResult.student).toEqual(registerResult.student);
      expect(refreshResult.token).toBeDefined();
      expect(refreshResult.token).not.toBe(originalToken);
      expect(mockTokenStorage.getToken()).toBe(refreshResult.token);
    });

    it('should fail refresh when no token exists', async () => {
      // Act
      const refreshResult = await authUseCase.refreshToken();

      // Assert
      expect(refreshResult.success).toBe(false);
      expect(refreshResult.error).toBe('No token available to refresh');
    });

    it('should fail refresh with invalid token', async () => {
      // Arrange
      mockTokenStorage.setToken('invalid_token');

      // Act
      const refreshResult = await authUseCase.refreshToken();

      // Assert
      expect(refreshResult.success).toBe(false);
      expect(refreshResult.error).toBe(
        'Token refresh failed. Please log in again.'
      );
      expect(mockTokenStorage.getToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when valid token exists', async () => {
      // Arrange
      await authUseCase.register(validRegisterData);

      // Act
      const isAuthenticated = authUseCase.isAuthenticated();

      // Assert
      expect(isAuthenticated).toBe(true);
    });

    it('should return false when no token exists', () => {
      // Act
      const isAuthenticated = authUseCase.isAuthenticated();

      // Assert
      expect(isAuthenticated).toBe(false);
    });

    it('should return false when token is expired', async () => {
      // Arrange
      const registerResult = await authUseCase.register(validRegisterData);
      const token = registerResult.token!;
      mockTokenStorage.setExpiredToken(token);

      // Act
      const isAuthenticated = authUseCase.isAuthenticated();

      // Assert
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('validateLoginData', () => {
    it('should validate correct login data', () => {
      // Act
      const result = authUseCase.validateLoginData(
        'john.doe@example.com',
        'Password123'
      );

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate empty email', () => {
      // Act
      const result = authUseCase.validateLoginData('', 'Password123');

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should invalidate empty password', () => {
      // Act
      const result = authUseCase.validateLoginData('john.doe@example.com', '');

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });
  });

  describe('validateRegistrationData', () => {
    it('should validate correct registration data', () => {
      // Act
      const result = authUseCase.validateRegistrationData(validRegisterData);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate data with multiple errors', () => {
      // Arrange
      const invalidData: RegisterData = {
        studentId: '123',
        email: 'invalid-email',
        password: '123',
        firstName: '',
        lastName: '',
      };

      // Act
      const result = authUseCase.validateRegistrationData(invalidData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Email format is invalid');
      expect(result.errors).toContain(
        'Student ID must be 6-20 alphanumeric characters'
      );
      expect(result.errors).toContain(
        'Password must be at least 8 characters long'
      );
      expect(result.errors).toContain('First name is required');
      expect(result.errors).toContain('Last name is required');
    });
  });
});
