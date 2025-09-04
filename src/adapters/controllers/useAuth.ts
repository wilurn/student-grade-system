import { useState, useEffect, useCallback } from 'react';
import { AuthUseCase } from '../../usecases/AuthUseCase';
import { Student, RegisterData, AuthResult } from '../../entities/Student';
import { AsyncState } from '../../shared/types';

export interface AuthState extends AsyncState<Student> {
  isAuthenticated: boolean;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (studentData: RegisterData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<AuthResult>;
  clearError: () => void;
}

export interface UseAuthReturn {
  state: AuthState;
  actions: AuthActions;
}

export function useAuth(authUseCase: AuthUseCase): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    data: null,
    isLoading: true,
    error: null,
    isAuthenticated: false,
  });

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const currentUser = await authUseCase.getCurrentUser();
        const isAuthenticated = authUseCase.isAuthenticated();

        setState({
          data: currentUser,
          isLoading: false,
          error: null,
          isAuthenticated,
        });
      } catch (error) {
        setState({
          data: null,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to initialize authentication',
          isAuthenticated: false,
        });
      }
    };

    initializeAuth();
  }, [authUseCase]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await authUseCase.login(email, password);

        if (result.success && result.student) {
          setState({
            data: result.student,
            isLoading: false,
            error: null,
            isAuthenticated: true,
          });
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: result.error || 'Login failed',
            isAuthenticated: false,
          }));
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Login failed';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          isAuthenticated: false,
        }));

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [authUseCase]
  );

  const register = useCallback(
    async (studentData: RegisterData): Promise<AuthResult> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await authUseCase.register(studentData);

        if (result.success && result.student) {
          setState({
            data: result.student,
            isLoading: false,
            error: null,
            isAuthenticated: true,
          });
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: result.error || 'Registration failed',
            isAuthenticated: false,
          }));
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Registration failed';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          isAuthenticated: false,
        }));

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [authUseCase]
  );

  const logout = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await authUseCase.logout();
      setState({
        data: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
      });
    } catch (error) {
      // Even if logout fails on server, clear local state
      setState({
        data: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
      });
    }
  }, [authUseCase]);

  const refreshToken = useCallback(async (): Promise<AuthResult> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await authUseCase.refreshToken();

      if (result.success && result.student) {
        setState({
          data: result.student,
          isLoading: false,
          error: null,
          isAuthenticated: true,
        });
      } else {
        setState({
          data: null,
          isLoading: false,
          error: result.error || 'Token refresh failed',
          isAuthenticated: false,
        });
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Token refresh failed';
      setState({
        data: null,
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [authUseCase]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    state,
    actions: {
      login,
      register,
      logout,
      refreshToken,
      clearError,
    },
  };
}
