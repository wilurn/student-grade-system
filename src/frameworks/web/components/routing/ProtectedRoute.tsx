import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../adapters/controllers/useAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
}) => {
  const auth = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (auth.state.isLoading) {
    return (
      <div className="protected-route-loading">
        <LoadingSpinner size="large" aria-label="Checking authentication..." />
      </div>
    );
  }

  // If not authenticated, redirect to login with return path
  if (!auth.state.user) {
    return (
      <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
    );
  }

  // If authenticated, render the protected content
  return <>{children}</>;
};
