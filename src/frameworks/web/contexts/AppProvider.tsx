import React, { ReactNode, useEffect } from 'react';
import { AuthProvider, useAuthContext } from './AuthContext';
import { GradeProvider, useGradeContext } from './GradeContext';
import { ErrorProvider } from './ErrorContext';
import { AuthUseCase } from '../../../usecases/AuthUseCase';
import { GradeUseCase } from '../../../usecases/GradeUseCase';
import { TokenStorage } from '../../storage/TokenStorage';
import { ErrorBoundary, ErrorToast } from '../components/common';
import { ErrorLogger } from '../../utils/ErrorLogger';

// App provider props
interface AppProviderProps {
  children: ReactNode;
  authUseCase: AuthUseCase;
  gradeUseCase: GradeUseCase;
  tokenStorage: TokenStorage;
}

// Inner component that handles grade context cleanup on auth changes
function GradeProviderWithAuthSync({
  children,
  gradeUseCase,
}: {
  children: ReactNode;
  gradeUseCase: GradeUseCase;
}) {
  const { state: authState } = useAuthContext();

  return (
    <GradeProvider gradeUseCase={gradeUseCase}>
      <GradeContextSyncHandler authState={authState}>
        {children}
      </GradeContextSyncHandler>
    </GradeProvider>
  );
}

// Component to handle grade context synchronization with auth state
function GradeContextSyncHandler({
  children,
  authState,
}: {
  children: ReactNode;
  authState: any;
}) {
  const { clearAll } = useGradeContext();

  // Clear grade data when user logs out
  useEffect(() => {
    if (!authState.isAuthenticated && authState.isInitialized) {
      clearAll();
    }
  }, [authState.isAuthenticated, authState.isInitialized, clearAll]);

  return <>{children}</>;
}

// Main app provider component
export function AppProvider({
  children,
  authUseCase,
  gradeUseCase,
  tokenStorage,
}: AppProviderProps) {
  // Setup global error handlers on app initialization
  useEffect(() => {
    ErrorLogger.setupGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary>
      <ErrorProvider>
        <AuthProvider authUseCase={authUseCase} tokenStorage={tokenStorage}>
          <GradeProviderWithAuthSync gradeUseCase={gradeUseCase}>
            <StateHydrationHandler>
              {children}
              <ErrorToast />
            </StateHydrationHandler>
          </GradeProviderWithAuthSync>
        </AuthProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
}

// Component to handle state hydration and persistence
function StateHydrationHandler({ children }: { children: ReactNode }) {
  const { state: authState } = useAuthContext();

  // Handle state persistence
  useEffect(() => {
    // Save auth state to localStorage for persistence across sessions
    if (authState.isInitialized) {
      const persistedState = {
        user: authState.user,
        isAuthenticated: authState.isAuthenticated,
        lastUpdated: Date.now(),
      };

      try {
        localStorage.setItem('app_auth_state', JSON.stringify(persistedState));
      } catch (error) {
        console.warn('Failed to persist auth state:', error);
      }
    }
  }, [authState.user, authState.isAuthenticated, authState.isInitialized]);

  // Handle state hydration on app startup
  useEffect(() => {
    const hydrateState = () => {
      try {
        const persistedState = localStorage.getItem('app_auth_state');
        if (persistedState) {
          const parsed = JSON.parse(persistedState);

          // Check if persisted state is not too old (24 hours)
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          if (Date.now() - parsed.lastUpdated > maxAge) {
            localStorage.removeItem('app_auth_state');
          }
        }
      } catch (error) {
        console.warn('Failed to hydrate state:', error);
        localStorage.removeItem('app_auth_state');
      }
    };

    hydrateState();
  }, []);

  // Handle cleanup on app unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Perform any cleanup before the app is closed
      if (!authState.isAuthenticated) {
        localStorage.removeItem('app_auth_state');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [authState.isAuthenticated]);

  return <>{children}</>;
}

// Hook to use both contexts together
export function useAppContext() {
  const authContext = useAuthContext();
  const gradeContext = useGradeContext();

  return {
    auth: authContext,
    grade: gradeContext,
  };
}

// HOC for components that need both auth and grade context
export function withAppContext<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AppContextComponent(props: P) {
    const context = useAppContext();

    return <Component {...props} appContext={context} />;
  };
}

// Utility hook for managing app-wide loading states
export function useAppLoading() {
  const { auth, grade } = useAppContext();

  const isLoading =
    auth.state.isLoading ||
    grade.state.grades.isLoading ||
    grade.state.corrections.isLoading ||
    grade.state.statistics.isLoading ||
    grade.state.correctionSummary.isLoading;

  const hasErrors =
    auth.state.error ||
    grade.state.grades.error ||
    grade.state.corrections.error ||
    grade.state.statistics.error ||
    grade.state.correctionSummary.error;

  return {
    isLoading,
    hasErrors,
    authLoading: auth.state.isLoading,
    gradeLoading: grade.state.grades.isLoading,
    correctionLoading: grade.state.corrections.isLoading,
    statisticsLoading: grade.state.statistics.isLoading,
    summaryLoading: grade.state.correctionSummary.isLoading,
  };
}

// Utility hook for managing app-wide error states
export function useAppErrors() {
  const { auth, grade } = useAppContext();

  const clearAllErrors = () => {
    auth.clearError();
    grade.clearErrors();
  };

  return {
    authError: auth.state.error,
    gradeError: grade.state.grades.error,
    correctionError: grade.state.corrections.error,
    statisticsError: grade.state.statistics.error,
    summaryError: grade.state.correctionSummary.error,
    clearAllErrors,
  };
}
