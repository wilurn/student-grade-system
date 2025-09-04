import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '../AuthContext';
import { AuthUseCase } from '../../../../usecases/AuthUseCase';
import { TokenStorage } from '../../../storage/TokenStorage';
import { Student } from '../../../../entities/Student';

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

const mockTokenStorage: jest.Mocked<TokenStorage> = {
  getToken: jest.fn(),
  setToken: jest.fn(),
  removeToken: jest.fn(),
  isTokenExpired: jest.fn(),
};

// Test component that uses the auth context
const TestComponent: React.FC = () => {
  const { state, login, register, logout, refreshToken, clearError } =
    useAuthContext();

  return (
    <div>
      <div data-testid="user">
        {state.user ? state.user.firstName : 'No user'}
      </div>
      <div data-testid="authenticated">{state.isAuthenticated.toString()}</div>
      <div data-testid="loading">{state.isLoading.toString()}</div>
      <div data-testid="error">{state.error || 'No error'}</div>
      <div data-testid="initialized">{state.isInitialized.toString()}</div>
      <button onClick={() => login('test@example.com', 'password')}>
        Login
      </button>
      <button
        onClick={() =>
          register({
            email: 'test@example.com',
            password: 'password',
            firstName: 'Test',
            lastName: 'User',
            studentId: '123',
          })
        }
      >
        Register
      </button>
      <button onClick={logout}>Logout</button>
      <button onClick={refreshToken}>Refresh</button>
      <button onClick={clearError}>Clear Error</button>
    </div>
  );
};

const renderWithProvider = (children: React.ReactNode) => {
  return render(
    <AuthProvider authUseCase={mockAuthUseCase} tokenStorage={mockTokenStorage}>
      {children}
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize and complete loading', async () => {
      mockTokenStorage.getToken.mockReturnValue(null);
      mockAuthUseCase.getCurrentUser.mockResolvedValue(null);
      mockAuthUseCase.isAuthenticated.mockReturnValue(false);

      renderWithProvider(<TestComponent />);

      // After initialization completes
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });
    });

    it('should initialize with authenticated user when token exists', async () => {
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
        expect(screen.getByTestId('user')).toHaveTextContent('Test');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });
    });

    it('should handle initialization error', async () => {
      mockTokenStorage.getToken.mockReturnValue('invalid-token');
      mockAuthUseCase.getCurrentUser.mockRejectedValue(
        new Error('Token invalid')
      );

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Token invalid');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      expect(mockTokenStorage.removeToken).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should handle successful login', async () => {
      const mockUser: Student = {
        id: '1',
        studentId: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      mockTokenStorage.getToken.mockReturnValue(null);
      mockAuthUseCase.getCurrentUser.mockResolvedValue(null);
      mockAuthUseCase.isAuthenticated.mockReturnValue(false);
      mockAuthUseCase.login.mockResolvedValue({
        success: true,
        student: mockUser,
        token: 'new-token',
      });

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      act(() => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(mockAuthUseCase.login).toHaveBeenCalledWith(
        'test@example.com',
        'password'
      );
    });

    it('should handle login failure', async () => {
      mockTokenStorage.getToken.mockReturnValue(null);
      mockAuthUseCase.getCurrentUser.mockResolvedValue(null);
      mockAuthUseCase.isAuthenticated.mockReturnValue(false);
      mockAuthUseCase.login.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      act(() => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Invalid credentials'
        );
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });
  });

  describe('register', () => {
    it('should handle successful registration', async () => {
      const mockUser: Student = {
        id: '1',
        studentId: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      mockTokenStorage.getToken.mockReturnValue(null);
      mockAuthUseCase.getCurrentUser.mockResolvedValue(null);
      mockAuthUseCase.isAuthenticated.mockReturnValue(false);
      mockAuthUseCase.register.mockResolvedValue({
        success: true,
        student: mockUser,
        token: 'new-token',
      });

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      act(() => {
        screen.getByText('Register').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });
  });

  describe('logout', () => {
    it('should handle logout', async () => {
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
      mockAuthUseCase.logout.mockResolvedValue();

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      act(() => {
        screen.getByText('Logout').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });

      expect(mockAuthUseCase.logout).toHaveBeenCalled();
    });
  });

  describe('refresh token', () => {
    it('should handle successful token refresh', async () => {
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
      mockAuthUseCase.refreshToken.mockResolvedValue({
        success: true,
        student: mockUser,
        token: 'refreshed-token',
      });

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      act(() => {
        screen.getByText('Refresh').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      expect(mockAuthUseCase.refreshToken).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should clear errors', async () => {
      mockTokenStorage.getToken.mockReturnValue(null);
      mockAuthUseCase.getCurrentUser.mockResolvedValue(null);
      mockAuthUseCase.isAuthenticated.mockReturnValue(false);
      mockAuthUseCase.login.mockResolvedValue({
        success: false,
        error: 'Test error',
      });

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });

      act(() => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error');
      });

      act(() => {
        screen.getByText('Clear Error').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('No error');
    });
  });

  describe('context usage outside provider', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuthContext must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
