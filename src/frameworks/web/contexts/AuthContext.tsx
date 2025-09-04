import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from 'react';
import { Student, AuthResult } from '../../../entities/Student';
import { AuthUseCase } from '../../../usecases/AuthUseCase';
import { TokenStorage } from '../../storage/TokenStorage';

// Auth State
export interface AuthState {
  user: Student | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Auth Actions
export type AuthAction =
  | { type: 'AUTH_INIT_START' }
  | {
      type: 'AUTH_INIT_SUCCESS';
      payload: { user: Student | null; isAuthenticated: boolean };
    }
  | { type: 'AUTH_INIT_ERROR'; payload: string }
  | { type: 'AUTH_LOGIN_START' }
  | { type: 'AUTH_LOGIN_SUCCESS'; payload: Student }
  | { type: 'AUTH_LOGIN_ERROR'; payload: string }
  | { type: 'AUTH_REGISTER_START' }
  | { type: 'AUTH_REGISTER_SUCCESS'; payload: Student }
  | { type: 'AUTH_REGISTER_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_REFRESH_START' }
  | { type: 'AUTH_REFRESH_SUCCESS'; payload: Student }
  | { type: 'AUTH_REFRESH_ERROR'; payload: string }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_SET_USER'; payload: Student | null };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isInitialized: false,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_INIT_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_INIT_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: action.payload.isAuthenticated,
        isLoading: false,
        error: null,
        isInitialized: true,
      };
    case 'AUTH_INIT_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        isInitialized: true,
      };
    case 'AUTH_LOGIN_START':
    case 'AUTH_REGISTER_START':
    case 'AUTH_REFRESH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_LOGIN_SUCCESS':
    case 'AUTH_REGISTER_SUCCESS':
    case 'AUTH_REFRESH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_LOGIN_ERROR':
    case 'AUTH_REGISTER_ERROR':
    case 'AUTH_REFRESH_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'AUTH_SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: action.payload !== null,
      };
    default:
      return state;
  }
}

// Context interface
export interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (studentData: any) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<AuthResult>;
  clearError: () => void;
  setUser: (user: Student | null) => void;
}

// Create context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
  authUseCase: AuthUseCase;
  tokenStorage: TokenStorage;
}

// Auth provider component
export function AuthProvider({
  children,
  authUseCase,
  tokenStorage,
}: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: 'AUTH_INIT_START' });

      try {
        // Check if token exists and is valid
        const token = tokenStorage.getToken();
        if (!token) {
          dispatch({
            type: 'AUTH_INIT_SUCCESS',
            payload: { user: null, isAuthenticated: false },
          });
          return;
        }

        // Try to get current user
        const currentUser = await authUseCase.getCurrentUser();
        const isAuthenticated = authUseCase.isAuthenticated();

        dispatch({
          type: 'AUTH_INIT_SUCCESS',
          payload: { user: currentUser, isAuthenticated },
        });
      } catch (error) {
        // Clear invalid token
        tokenStorage.removeToken();
        dispatch({
          type: 'AUTH_INIT_ERROR',
          payload:
            error instanceof Error
              ? error.message
              : 'Authentication initialization failed',
        });
      }
    };

    initializeAuth();
  }, [authUseCase, tokenStorage]);

  // Login function
  const login = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    dispatch({ type: 'AUTH_LOGIN_START' });

    try {
      const result = await authUseCase.login(email, password);

      if (result.success && result.student) {
        dispatch({ type: 'AUTH_LOGIN_SUCCESS', payload: result.student });
      } else {
        dispatch({
          type: 'AUTH_LOGIN_ERROR',
          payload: result.error || 'Login failed',
        });
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_LOGIN_ERROR', payload: errorMessage });

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Register function
  const register = async (studentData: any): Promise<AuthResult> => {
    dispatch({ type: 'AUTH_REGISTER_START' });

    try {
      const result = await authUseCase.register(studentData);

      if (result.success && result.student) {
        dispatch({ type: 'AUTH_REGISTER_SUCCESS', payload: result.student });
      } else {
        dispatch({
          type: 'AUTH_REGISTER_ERROR',
          payload: result.error || 'Registration failed',
        });
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'AUTH_REGISTER_ERROR', payload: errorMessage });

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authUseCase.logout();
    } catch (error) {
      // Continue with logout even if server call fails
      console.warn('Logout server call failed:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<AuthResult> => {
    dispatch({ type: 'AUTH_REFRESH_START' });

    try {
      const result = await authUseCase.refreshToken();

      if (result.success && result.student) {
        dispatch({ type: 'AUTH_REFRESH_SUCCESS', payload: result.student });
      } else {
        dispatch({
          type: 'AUTH_REFRESH_ERROR',
          payload: result.error || 'Token refresh failed',
        });
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Token refresh failed';
      dispatch({ type: 'AUTH_REFRESH_ERROR', payload: errorMessage });

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  // Set user function (for external updates)
  const setUser = (user: Student | null) => {
    dispatch({ type: 'AUTH_SET_USER', payload: user });
  };

  const contextValue: AuthContextValue = {
    state,
    login,
    register,
    logout,
    refreshToken,
    clearError,
    setUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// HOC for components that require authentication
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { state } = useAuthContext();

    if (!state.isInitialized) {
      return <div>Loading...</div>;
    }

    if (!state.isAuthenticated) {
      return <div>Please log in to access this content.</div>;
    }

    return <Component {...props} />;
  };
}
