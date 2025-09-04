import React, { Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { useAuthContext } from './frameworks/web/contexts';
import { ProtectedRoute } from './frameworks/web/components/routing';
import { Layout } from './frameworks/web/components/layout/Layout';
import { LoadingSpinner } from './frameworks/web/components/common/LoadingSpinner';
import { NavigationItem } from './frameworks/web/components/layout/Navigation';
import './App.css';

// Lazy load pages for code splitting
const LoginPage = lazy(() =>
  import('./frameworks/web/pages/LoginPage').then((module) => ({
    default: module.LoginPage,
  }))
);
const RegisterPage = lazy(() =>
  import('./frameworks/web/pages/RegisterPage').then((module) => ({
    default: module.RegisterPage,
  }))
);
const DashboardPage = lazy(() =>
  import('./frameworks/web/pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  }))
);
const GradesPage = lazy(() =>
  import('./frameworks/web/pages/GradesPage').then((module) => ({
    default: module.GradesPage,
  }))
);
const CorrectionsPage = lazy(() =>
  import('./frameworks/web/pages/CorrectionsPage').then((module) => ({
    default: module.CorrectionsPage,
  }))
);
const NotFoundPage = lazy(() =>
  import('./frameworks/web/pages/NotFoundPage').then((module) => ({
    default: module.NotFoundPage,
  }))
);

const AppContent: React.FC = () => {
  const auth = useAuthContext();
  const navigate = useNavigate();

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: '🏠',
    },
    {
      id: 'grades',
      label: 'My Grades',
      path: '/grades',
      icon: '📊',
    },
    {
      id: 'corrections',
      label: 'Correction Requests',
      path: '/corrections',
      icon: '📝',
    },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await auth.logout();
    navigate('/login');
  };

  return (
    <div className="App">
      <Suspense
        fallback={
          <div className="app-loading">
            <LoadingSpinner size="large" aria-label="Loading application..." />
          </div>
        }
      >
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout
                  headerProps={{
                    user: auth.state.user,
                    onLogout: handleLogout,
                  }}
                  navigationItems={navigationItems}
                  activeNavigationItem="dashboard"
                  onNavigate={handleNavigate}
                >
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/grades"
            element={
              <ProtectedRoute>
                <Layout
                  headerProps={{
                    user: auth.state.user,
                    onLogout: handleLogout,
                  }}
                  navigationItems={navigationItems}
                  activeNavigationItem="grades"
                  onNavigate={handleNavigate}
                >
                  <GradesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/corrections"
            element={
              <ProtectedRoute>
                <Layout
                  headerProps={{
                    user: auth.state.user,
                    onLogout: handleLogout,
                  }}
                  navigationItems={navigationItems}
                  activeNavigationItem="corrections"
                  onNavigate={handleNavigate}
                >
                  <CorrectionsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
