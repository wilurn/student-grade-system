import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { AuthUseCase } from '../../../usecases/AuthUseCase';
import { Student, RegisterData, AuthResult } from '../../../entities/Student';

// Mock AuthUseCase
class MockAuthUseCase implements AuthUseCase {
  private currentUser: Student | null = null;
  private authenticated = false;
  private shouldFailLogin = false;
  private shouldFailRegister = false;
  private shouldFailGetCurrentUser = false;

  async login(email: string, password: string): Promise<AuthResult> {
    if (this.shouldFailLogin) {
      return { success: false, error: 'Login failed' };
    }

    const student: Student = {
      id: 'student_123',
      studentId: 'STU123456',
      email,
      firstName: 'John',
      lastName: 'Doe',
    };

    this.currentUser = student;
    this.authenticated = true;

    return {
      success: true,
      student,
      token: 'mock_token',
    };
  }

  async register(studentData: RegisterData): Promise<AuthResult> {
    if (this.shouldFailRegister) {
      return { success: false, error: 'Registration failed' };
    }

    const student: Student = {
      id: 'student_123',
      studentId: studentData.studentId,
      email: studentData.email,
      firstName: studentData.firstName,
      lastName: studentData.lastName,
    };

    this.currentUser = student;
    this.authenticated = true;

    return {
      success: true,
      student,
      token: 'mock_token',
    };
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    this.authenticated = false;
  }

  async getCurrentUser(): Promise<Student | null> {
    if (this.shouldFailGetCurrentUser) {
      throw new Error('Failed to get current user');
    }
    return this.currentUser;
  }

  validateLoginData(email: string, password: string) {
    return { isValid: true, errors: [] };
  }

  validateRegistrationData(data: RegisterData) {
    return { isValid: true, errors: [] };
  }

  async refreshToken(): Promise<AuthResult> {
    if (!this.currentUser) {
      return { success: false, error: 'No user to refresh' };
    }

    return {
      success: true,
      student: this.currentUser,
      token: 'new_mock_token',
    };
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  // Test helper methods
  setCurrentUser(user: Student | null) {
    this.currentUser = user;
    this.authenticated = user !== null;
  }

  setShouldFailLogin(shouldFail: boolean) {
    this.shouldFailLogin = shouldFail;
  }

  setShouldFailRegister(shouldFail: boolean) {
    this.shouldFailRegister = shouldFail;
  }

  setShouldFailGetCurrentUser(shouldFail: boolean) {
    this.shouldFailGetCurrentUser = shouldFail;
  }

  reset() {
    this.currentUser = null;
    this.authenticated = false;
    this.shouldFailLogin = false;
    this.shouldFailRegister = false;
    this.shouldFailGetCurrentUser = false;
  }
}

describe('useAuth', () => {
  let mockAuthUseCase: MockAuthUseCase;

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
    mockAuthUseCase = new MockAuthUseCase();
  });

  afterEach(() => {
    mockAuthUseCase.reset();
  });

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      // Act
      const { result } = renderHook(() => useAuth(mockAuthUseCase));

      // Assert
      expect(result.current.state.isLoading).toBe(true);
      expect(result.current.state.data).toBeNull();
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.isAuthenticated).toBe(false);
    });

    it('should initialize with authenticated user when user exists', async () => {
      // Arrange
      mockAuthUseCase.setCurrentUser(validStudent);

      // Act
      const { result } = renderHook(() => useAuth(mockAuthUseCase));

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Assert
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.data).toEqual(validStudent);
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.isAuthenticated).toBe(true);
    });

    it('should handle initialization error', async () => {
      // Arrange
      mockAuthUseCase.setShouldFailGetCurrentUser(true);

      // Act
      const { result } = renderHook(() => useAuth(mockAuthUseCase));

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Assert
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.data).toBeNull();
      expect(result.current.state.error).toBe('Failed to get current user');
      expect(result.current.state.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should successfully login', async () => {
      // Arrange
      const { result } = renderHook(() => useAuth(mockAuthUseCase));

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Act
      let loginResult: AuthResult;
      await act(async () => {
        loginResult = await result.current.actions.login(
          'john.doe@example.com',
          'Password123'
        );
      });

      // Assert
      expect(loginResult!.success).toBe(true);
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.data).toEqual(
        expect.objectContaining({
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
        })
      );
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.isAuthenticated).toBe(true);
    });

    it('should handle login failure', async () => {
      // Arrange
      mockAuthUseCase.setShouldFailLogin(true);
      const { result } = renderHook(() => useAuth(mockAuthUseCase));

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Act
      let loginResult: AuthResult;
      await act(async () => {
        loginResult = await result.current.actions.login(
          'john.doe@example.com',
          'WrongPassword'
        );
      });

      // Assert
      expect(loginResult!.success).toBe(false);
      expect(loginResult!.error).toBe('Login failed');
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.data).toBeNull();
      expect(result.current.state.error).toBe('Login failed');
      expect(result.current.state.isAuthenticated).toBe(false);
    });

    it('should set loading state during login', async () => {
      // Arrange
      const { result } = renderHook(() => useAuth(mockAuthUseCase));

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Act
      act(() => {
        result.current.actions.login('john.doe@example.com', 'Password123');
      });

      // Assert (check loading state immediately)
      expect(result.current.state.isLoading).toBe(true);
      expect(result.current.state.error).toBeNull();
    });
  });

  describe('register', () => {
    it('should successfully register', async () => {
      // Arrange
      const { result } = renderHook(() => useAuth(mockAuthUseCase));

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Act
      let registerResult: AuthResult;
      await act(async () => {
        registerResult =
          await result.current.actions.register(validRegisterData);
      });

      // Assert
      expect(registerResult!.success).toBe(true);
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.data).toEqual(
        expect.objectContaining({
          studentId: validRegisterData.studentId,
          email: validRegisterData.email,
          firstName: validRegisterData.firstName,
          lastName: validRegisterData.lastName,
        })
      );
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.isAuthenticated).toBe(true);
    });

    it('should handle registration failure', async () => {
      // Arrange
      mockAuthUseCase.setShouldFailRegister(true);
      const { result } = renderHook(() => useAuth(mockAuthUseCase));

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Act
      let registerResult: AuthResult;
      await act(async () => {
        registerResult =
          await result.current.actions.register(validRegisterData);
      });

      // Assert
      expect(registerResult!.success).toBe(false);
      expect(registerResult!.error).toBe('Registration failed');
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.data).toBeNull();
      expect(result.current.state.error).toBe('Registration failed');
      expect(result.current.state.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      // Arrange
      mockAuthUseCase.setCurrentUser(validStudent);
      const { result } = renderHook(() => useAuth(mockAuthUseCase));

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Verify user is logged in
      expect(result.current.state.isAuthenticated).toBe(true);

      // Act
      await act(async () => {
        await result.current.actions.logout();
      });

      // Assert
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.data).toBeNull();
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.isAuthenticated).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      // Arrange
      mockAuthUseCase.setCurrentUser(validStudent);
      const { result } = renderHook(() => useAuth(mockAuthUseCase));

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Act
      let refreshResult: AuthResult;
      await act(async () => {
        refreshResult = await result.current.actions.refreshToken();
      });

      // Assert
      expect(refreshResult!.success).toBe(true);
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.data).toEqual(validStudent);
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.isAuthenticated).toBe(true);
    });

    it('should handle refresh token failure', async () => {
      // Arrange - no current user
      const { result } = renderHook(() => useAuth(mockAuthUseCase));

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Act
      let refreshResult: AuthResult;
      await act(async () => {
        refreshResult = await result.current.actions.refreshToken();
      });

      // Assert
      expect(refreshResult!.success).toBe(false);
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.data).toBeNull();
      expect(result.current.state.error).toBe('No user to refresh');
      expect(result.current.state.isAuthenticated).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      // Arrange
      mockAuthUseCase.setShouldFailLogin(true);
      const { result } = renderHook(() => useAuth(mockAuthUseCase));

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Trigger an error
      await act(async () => {
        await result.current.actions.login(
          'john.doe@example.com',
          'WrongPassword'
        );
      });

      // Verify error exists
      expect(result.current.state.error).toBe('Login failed');

      // Act
      act(() => {
        result.current.actions.clearError();
      });

      // Assert
      expect(result.current.state.error).toBeNull();
    });
  });
});
