import React, { useEffect, ReactNode } from 'react';
import { UseAuthReturn } from '../../../../adapters/controllers/useAuth';

interface AuthGuardProps {
  auth: UseAuthReturn;
  children: ReactNode;
  fallback?: ReactNode;
  onRedirect?: () => void;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  auth,
  children,
  fallback = null,
  onRedirect,
  requireAuth = true,
}) => {
  const { state } = auth;

  useEffect(() => {
    // Handle session expiration or authentication state changes
    if (requireAuth && !state.isLoading && !state.isAuthenticated) {
      // Clear any existing error state
      auth.actions.clearError();

      // Trigger redirect callback if provided
      onRedirect?.();
    }
  }, [
    state.isAuthenticated,
    state.isLoading,
    requireAuth,
    auth.actions,
    onRedirect,
  ]);

  // Show loading state while checking authentication
  if (state.isLoading) {
    return (
      <div className="auth-guard-loading" role="status" aria-live="polite">
        <div className="loading-spinner" aria-hidden="true"></div>
        <span className="loading-text">Checking authentication...</span>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !state.isAuthenticated) {
    return (
      <div className="auth-guard-fallback">
        {fallback || (
          <div className="auth-required-message" role="alert">
            <h2>Authentication Required</h2>
            <p>You need to be logged in to access this page.</p>
          </div>
        )}
      </div>
    );
  }

  // If authentication is not required but user is authenticated (e.g., login page)
  if (!requireAuth && state.isAuthenticated) {
    return (
      <div className="auth-guard-fallback">
        {fallback || (
          <div className="already-authenticated-message" role="status">
            <h2>Already Logged In</h2>
            <p>You are already authenticated.</p>
          </div>
        )}
      </div>
    );
  }

  // Render children if authentication requirements are met
  return <>{children}</>;
};

// Higher-order component version for easier usage
export interface WithAuthGuardOptions {
  requireAuth?: boolean;
  fallback?: ReactNode;
  onRedirect?: () => void;
}

export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthGuardOptions = {}
) {
  const { requireAuth = true, fallback, onRedirect } = options;

  return function AuthGuardedComponent(props: P & { auth: UseAuthReturn }) {
    const { auth, ...componentProps } = props;

    return (
      <AuthGuard
        auth={auth}
        requireAuth={requireAuth}
        fallback={fallback}
        onRedirect={onRedirect}
      >
        <Component {...(componentProps as P)} />
      </AuthGuard>
    );
  };
}

// Hook for checking authentication status in components
export function useAuthGuard(auth: UseAuthReturn, requireAuth: boolean = true) {
  const { state } = auth;

  const isAllowed = requireAuth
    ? state.isAuthenticated
    : !state.isAuthenticated;
  const isLoading = state.isLoading;
  const shouldRedirect =
    requireAuth && !state.isLoading && !state.isAuthenticated;

  return {
    isAllowed,
    isLoading,
    shouldRedirect,
    isAuthenticated: state.isAuthenticated,
    user: state.data,
    error: state.error,
  };
}

// Utility component for protecting specific sections within a page
interface ProtectedSectionProps {
  auth: UseAuthReturn;
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export const ProtectedSection: React.FC<ProtectedSectionProps> = ({
  auth,
  children,
  fallback = null,
  showFallback = true,
}) => {
  const { state } = auth;

  if (state.isLoading) {
    return (
      <div
        className="protected-section-loading"
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Loading protected content...</span>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    if (!showFallback) {
      return null;
    }

    return (
      <div className="protected-section-fallback">
        {fallback || (
          <div className="login-required-message">
            <p>Please log in to view this content.</p>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
