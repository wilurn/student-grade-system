import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import {
  AppProvider,
  useAppContext,
  useAppLoading,
  useAppErrors,
} from '../AppProvider';
import { AuthUseCase } from '../../../../usecases/AuthUseCase';
import { GradeUseCase } from '../../../../usecases/GradeUseCase';
import { TokenStorage } from '../../../storage/TokenStorage';
import { Student } from '../../../../entities/Student';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock dependencies
const mockAuthUseCase: jest.Mocked<AuthUseCase> = {
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),
  refreshToken: jest.fn(),
  isAuthenticated: jest.fn(),
  validateLoginData: jest.fn(),
  validateRegistrationData: jest.fn(),
};

const mockGradeUseCase: jest.Mocked<GradeUseCase> = {
  getStudentGrades: jest.fn(),
  getStudentGradesPaginated: jest.fn(),
  getGradeById: jest.fn(),
  calculateGPA: jest.fn(),
  getTotalCredits: jest.fn(),
  getEarnedCredits: jest.fn(),
  getGradesBySemester: jest.fn(),
  submitGradeCorrection: jest.fn(),
  getGradeCorrections: jest.fn(),
  getGradeCorrectionsPaginated: jest.fn(),
  getCorrectionById: jest.fn(),
  canSubmitCorrection: jest.fn(),
  getCorrectionAttempts: jest.fn(),
  validateGradeData: jest.fn(),
  validateCorrectionRequest: jest.fn(),
  getGradeStatistics: jest.fn(),
  getCorrectionSummary: jest.fn(),
};

const mockTokenStorage: jest.Mocked<TokenStorage> = {
  getToken: jest.fn(),
  setToken: jest.fn(),
  removeToken: jest.fn(),
  isTokenExpired: jest.fn(),
};

// Test component that uses the app context
const TestComponent: React.FC = () => {
  const { auth, grade } = useAppContext();
  const loading = useAppLoading();
  const errors = useAppErrors();

  return (
    <div>
      <div data-testid="auth-user">
        {auth.state.user ? auth.state.user.firstName : 'No user'}
      </div>
      <div data-testid="auth-authenticated">
        {auth.state.isAuthenticated.toString()}
      </div>
      <div data-testid="grades-count">{grade.state.grades.data.length}</div>
      <div data-testid="app-loading">{loading.isLoading.toString()}</div>
      <div data-testid="has-errors">{loading.hasErrors ? 'true' : 'false'}</div>
      <div data-testid="auth-error">{errors.authError || 'No auth error'}</div>

      <button onClick={() => auth.login('test@example.com', 'password')}>
        Login
      </button>
      <button onClick={() => grade.fetchGrades('student-1')}>
        Fetch Grades
      </button>
      <button onClick={errors.clearAllErrors}>Clear All Errors</button>
    </div>
  );
};

const renderWithProvider = (children: React.ReactNode) => {
  return render(
    <AppProvider
      authUseCase={mockAuthUseCase}
      gradeUseCase={mockGradeUseCase}
      tokenStorage={mockTokenStorage}
    >
      {children}
    </AppProvider>
  );
};

describe('AppProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('initialization', () => {
    it('should initialize both auth and grade contexts', async () => {
      mockTokenStorage.getToken.mockReturnValue(null);
      mockAuthUseCase.getCurrentUser.mockResolvedValue(null);
      mockAuthUseCase.isAuthenticated.mockReturnValue(false);

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-authenticated')).toHaveTextContent(
          'false'
        );
        expect(screen.getByTestId('grades-count')).toHaveTextContent('0');
      });
    });

    it('should clear grade data when user logs out', async () => {
      const mockUser: Student = {
        id: '1',
        studentId: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      // Start with authenticated user
      mockTokenStorage.getToken.mockReturnValue('valid-token');
      mockAuthUseCase.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthUseCase.isAuthenticated.mockReturnValue(true);
      mockAuthUseCase.logout.mockResolvedValue();
      mockGradeUseCase.getStudentGrades.mockResolvedValue([]);

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-authenticated')).toHaveTextContent(
          'true'
        );
      });

      // Fetch some grades
      act(() => {
        screen.getByText('Fetch Grades').click();
      });

      // Logout
      mockAuthUseCase.getCurrentUser.mockResolvedValue(null);
      mockAuthUseCase.isAuthenticated.mockReturnValue(false);

      act(() => {
        screen.getByText('Login').click();
      });

      // Grade data should be cleared when auth state changes to unauthenticated
      await waitFor(() => {
        expect(screen.getByTestId('grades-count')).toHaveTextContent('0');
      });
    });
  });

  describe('state persistence', () => {
    it('should persist auth state to localStorage', async () => {
      const mockUser: Student = {
        id: '1',
        studentId: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      mockTokenStorage.getToken.mockReturnValue('valid-token');
      mockAuthUseCase.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthUseCase.isAuthenticated.mockReturnValue(true);

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-authenticated')).toHaveTextContent(
          'true'
        );
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'app_auth_state',
        expect.stringContaining('"isAuthenticated":true')
      );
    });

    it('should handle state hydration errors gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      mockTokenStorage.getToken.mockReturnValue(null);
      mockAuthUseCase.getCurrentUser.mockResolvedValue(null);
      mockAuthUseCase.isAuthenticated.mockReturnValue(false);

      renderWithProvider(<TestComponent />);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'app_auth_state'
      );
    });
  });

  describe('loading states', () => {
    it('should aggregate loading states from both contexts', async () => {
      mockTokenStorage.getToken.mockReturnValue(null);
      mockAuthUseCase.getCurrentUser.mockResolvedValue(null);
      mockAuthUseCase.isAuthenticated.mockReturnValue(false);
      mockAuthUseCase.login.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('app-loading')).toHaveTextContent('false');
      });

      act(() => {
        screen.getByText('Login').click();
      });

      expect(screen.getByTestId('app-loading')).toHaveTextContent('true');
    });
  });

  describe('error handling', () => {
    it('should aggregate errors from both contexts', async () => {
      mockTokenStorage.getToken.mockReturnValue(null);
      mockAuthUseCase.getCurrentUser.mockResolvedValue(null);
      mockAuthUseCase.isAuthenticated.mockReturnValue(false);
      mockAuthUseCase.login.mockResolvedValue({
        success: false,
        error: 'Login failed',
      });

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('has-errors')).toHaveTextContent('false');
      });

      act(() => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('has-errors')).toHaveTextContent('true');
        expect(screen.getByTestId('auth-error')).toHaveTextContent(
          'Login failed'
        );
      });
    });

    it('should clear all errors', async () => {
      mockTokenStorage.getToken.mockReturnValue(null);
      mockAuthUseCase.getCurrentUser.mockResolvedValue(null);
      mockAuthUseCase.isAuthenticated.mockReturnValue(false);
      mockAuthUseCase.login.mockResolvedValue({
        success: false,
        error: 'Login failed',
      });

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toHaveTextContent(
          'No auth error'
        );
      });

      act(() => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toHaveTextContent(
          'Login failed'
        );
      });

      act(() => {
        screen.getByText('Clear All Errors').click();
      });

      expect(screen.getByTestId('auth-error')).toHaveTextContent(
        'No auth error'
      );
    });
  });

  describe('context usage outside provider', () => {
    it('should throw error when useAppContext is used outside provider', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const TestComponentOutside = () => {
        useAppContext();
        return <div>Test</div>;
      };

      expect(() => {
        render(<TestComponentOutside />);
      }).toThrow('useAuthContext must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should handle beforeunload event', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      mockTokenStorage.getToken.mockReturnValue(null);
      mockAuthUseCase.getCurrentUser.mockResolvedValue(null);
      mockAuthUseCase.isAuthenticated.mockReturnValue(false);

      const { unmount } = renderWithProvider(<TestComponent />);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});
