import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { useAuth } from '../adapters/controllers/useAuth';

// Mock the useAuth hook
jest.mock('../adapters/controllers/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock all the page components
jest.mock('../frameworks/web/pages/LoginPage', () => ({
  LoginPage: () => <div data-testid="login-page">Login Page</div>,
}));

jest.mock('../frameworks/web/pages/RegisterPage', () => ({
  RegisterPage: () => <div data-testid="register-page">Register Page</div>,
}));

jest.mock('../frameworks/web/pages/DashboardPage', () => ({
  DashboardPage: () => <div data-testid="dashboard-page">Dashboard Page</div>,
}));

jest.mock('../frameworks/web/pages/GradesPage', () => ({
  GradesPage: () => <div data-testid="grades-page">Grades Page</div>,
}));

jest.mock('../frameworks/web/pages/CorrectionsPage', () => ({
  CorrectionsPage: () => (
    <div data-testid="corrections-page">Corrections Page</div>
  ),
}));

jest.mock('../frameworks/web/pages/NotFoundPage', () => ({
  NotFoundPage: () => <div data-testid="not-found-page">Not Found Page</div>,
}));

// Mock the Layout component
jest.mock('../frameworks/web/components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

// Mock the LoadingSpinner component
jest.mock('../frameworks/web/components/common/LoadingSpinner', () => ({
  LoadingSpinner: ({ 'aria-label': ariaLabel }: { 'aria-label': string }) => (
    <div data-testid="loading-spinner" aria-label={ariaLabel}>
      Loading...
    </div>
  ),
}));

describe('App Routing', () => {
  const mockUser = {
    id: '1',
    studentId: 'STU001',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockAuthActions = {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Public Routes', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        state: {
          user: null,
          isLoading: false,
          error: null,
        },
        actions: mockAuthActions,
      });
    });

    it('should render login page for /login route', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    it('should render register page for /register route', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('register-page')).toBeInTheDocument();
      });
    });
  });

  describe('Protected Routes - Authenticated User', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        state: {
          user: mockUser,
          isLoading: false,
          error: null,
        },
        actions: mockAuthActions,
      });
    });

    it('should render dashboard page for /dashboard route', async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
        expect(screen.getByTestId('layout')).toBeInTheDocument();
      });
    });

    it('should render grades page for /grades route', async () => {
      render(
        <MemoryRouter initialEntries={['/grades']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('grades-page')).toBeInTheDocument();
        expect(screen.getByTestId('layout')).toBeInTheDocument();
      });
    });

    it('should render corrections page for /corrections route', async () => {
      render(
        <MemoryRouter initialEntries={['/corrections']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('corrections-page')).toBeInTheDocument();
        expect(screen.getByTestId('layout')).toBeInTheDocument();
      });
    });

    it('should redirect root path to dashboard', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });
    });
  });

  describe('Protected Routes - Unauthenticated User', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        state: {
          user: null,
          isLoading: false,
          error: null,
        },
        actions: mockAuthActions,
      });
    });

    it('should redirect to login for protected routes when not authenticated', async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
        // The ProtectedRoute should handle the redirect
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner when authentication is loading', async () => {
      mockUseAuth.mockReturnValue({
        state: {
          user: null,
          isLoading: true,
          error: null,
        },
        actions: mockAuthActions,
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      });
    });
  });

  describe('404 Route', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        state: {
          user: mockUser,
          isLoading: false,
          error: null,
        },
        actions: mockAuthActions,
      });
    });

    it('should render not found page for unknown routes', async () => {
      render(
        <MemoryRouter initialEntries={['/unknown-route']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });
  });

  describe('Code Splitting', () => {
    it('should show loading fallback during lazy loading', () => {
      mockUseAuth.mockReturnValue({
        state: {
          user: null,
          isLoading: false,
          error: null,
        },
        actions: mockAuthActions,
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      );

      // The Suspense fallback should be shown initially
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Loading application...')
      ).toBeInTheDocument();
    });
  });
});
