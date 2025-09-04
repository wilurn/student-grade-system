import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  AuthGuard,
  withAuthGuard,
  useAuthGuard,
  ProtectedSection,
} from '../AuthGuard';
import { UseAuthReturn } from '../../../../../adapters/controllers/useAuth';
import { Student } from '../../../../../entities/Student';

// Mock auth hook return
const createMockAuth = (
  overrides: Partial<UseAuthReturn> = {}
): UseAuthReturn => ({
  state: {
    data: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
  },
  actions: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    clearError: jest.fn(),
  },
  ...overrides,
});

const mockStudent: Student = {
  id: '1',
  studentId: 'STU123456',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
};

describe('AuthGuard', () => {
  let mockAuth: UseAuthReturn;
  let mockOnRedirect: jest.Mock;

  beforeEach(() => {
    mockAuth = createMockAuth();
    mockOnRedirect = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when requireAuth is true (default)', () => {
    it('shows loading state when authentication is loading', () => {
      mockAuth.state.isLoading = true;

      render(
        <AuthGuard auth={mockAuth}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(
        screen.getByText(/checking authentication.../i)
      ).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('shows default fallback when user is not authenticated', () => {
      mockAuth.state.isAuthenticated = false;
      mockAuth.state.isLoading = false;

      render(
        <AuthGuard auth={mockAuth}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
      expect(
        screen.getByText(/you need to be logged in to access this page/i)
      ).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('shows custom fallback when user is not authenticated', () => {
      mockAuth.state.isAuthenticated = false;
      mockAuth.state.isLoading = false;

      const customFallback = <div>Custom Login Required Message</div>;

      render(
        <AuthGuard auth={mockAuth} fallback={customFallback}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(
        screen.getByText('Custom Login Required Message')
      ).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders children when user is authenticated', () => {
      mockAuth.state.isAuthenticated = true;
      mockAuth.state.isLoading = false;
      mockAuth.state.data = mockStudent;

      render(
        <AuthGuard auth={mockAuth}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('calls onRedirect when user is not authenticated', async () => {
      mockAuth.state.isAuthenticated = false;
      mockAuth.state.isLoading = false;

      render(
        <AuthGuard auth={mockAuth} onRedirect={mockOnRedirect}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockOnRedirect).toHaveBeenCalled();
      });
    });

    it('calls clearError when user is not authenticated', async () => {
      mockAuth.state.isAuthenticated = false;
      mockAuth.state.isLoading = false;

      render(
        <AuthGuard auth={mockAuth}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockAuth.actions.clearError).toHaveBeenCalled();
      });
    });
  });

  describe('when requireAuth is false', () => {
    it('renders children when user is not authenticated', () => {
      mockAuth.state.isAuthenticated = false;
      mockAuth.state.isLoading = false;

      render(
        <AuthGuard auth={mockAuth} requireAuth={false}>
          <div>Public Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Public Content')).toBeInTheDocument();
    });

    it('shows default fallback when user is authenticated', () => {
      mockAuth.state.isAuthenticated = true;
      mockAuth.state.isLoading = false;
      mockAuth.state.data = mockStudent;

      render(
        <AuthGuard auth={mockAuth} requireAuth={false}>
          <div>Public Content</div>
        </AuthGuard>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/already logged in/i)).toBeInTheDocument();
      expect(screen.queryByText('Public Content')).not.toBeInTheDocument();
    });

    it('shows custom fallback when user is authenticated', () => {
      mockAuth.state.isAuthenticated = true;
      mockAuth.state.isLoading = false;
      mockAuth.state.data = mockStudent;

      const customFallback = <div>Custom Already Authenticated Message</div>;

      render(
        <AuthGuard
          auth={mockAuth}
          requireAuth={false}
          fallback={customFallback}
        >
          <div>Public Content</div>
        </AuthGuard>
      );

      expect(
        screen.getByText('Custom Already Authenticated Message')
      ).toBeInTheDocument();
      expect(screen.queryByText('Public Content')).not.toBeInTheDocument();
    });

    it('does not call onRedirect when user is authenticated', () => {
      mockAuth.state.isAuthenticated = true;
      mockAuth.state.isLoading = false;
      mockAuth.state.data = mockStudent;

      render(
        <AuthGuard
          auth={mockAuth}
          requireAuth={false}
          onRedirect={mockOnRedirect}
        >
          <div>Public Content</div>
        </AuthGuard>
      );

      expect(mockOnRedirect).not.toHaveBeenCalled();
    });
  });
});

describe('withAuthGuard HOC', () => {
  let mockAuth: UseAuthReturn;

  beforeEach(() => {
    mockAuth = createMockAuth();
  });

  const TestComponent: React.FC<{ message: string }> = ({ message }) => (
    <div>{message}</div>
  );

  it('wraps component with AuthGuard requiring authentication by default', () => {
    const GuardedComponent = withAuthGuard(TestComponent);
    mockAuth.state.isAuthenticated = true;
    mockAuth.state.isLoading = false;

    render(<GuardedComponent auth={mockAuth} message="Test Message" />);

    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('passes through component props correctly', () => {
    const GuardedComponent = withAuthGuard(TestComponent);
    mockAuth.state.isAuthenticated = true;
    mockAuth.state.isLoading = false;

    render(<GuardedComponent auth={mockAuth} message="Custom Message" />);

    expect(screen.getByText('Custom Message')).toBeInTheDocument();
  });

  it('applies custom options to AuthGuard', () => {
    const customFallback = <div>Custom HOC Fallback</div>;
    const GuardedComponent = withAuthGuard(TestComponent, {
      requireAuth: false,
      fallback: customFallback,
    });

    mockAuth.state.isAuthenticated = true;
    mockAuth.state.isLoading = false;

    render(<GuardedComponent auth={mockAuth} message="Test Message" />);

    expect(screen.getByText('Custom HOC Fallback')).toBeInTheDocument();
    expect(screen.queryByText('Test Message')).not.toBeInTheDocument();
  });
});

describe('useAuthGuard hook', () => {
  let mockAuth: UseAuthReturn;

  beforeEach(() => {
    mockAuth = createMockAuth();
  });

  const TestComponent: React.FC<{
    auth: UseAuthReturn;
    requireAuth?: boolean;
  }> = ({ auth, requireAuth = true }) => {
    const guardState = useAuthGuard(auth, requireAuth);

    return (
      <div>
        <div>isAllowed: {guardState.isAllowed.toString()}</div>
        <div>isLoading: {guardState.isLoading.toString()}</div>
        <div>shouldRedirect: {guardState.shouldRedirect.toString()}</div>
        <div>isAuthenticated: {guardState.isAuthenticated.toString()}</div>
        {guardState.user && <div>user: {guardState.user.firstName}</div>}
        {guardState.error && <div>error: {guardState.error}</div>}
      </div>
    );
  };

  it('returns correct state when user is authenticated and auth is required', () => {
    mockAuth.state.isAuthenticated = true;
    mockAuth.state.isLoading = false;
    mockAuth.state.data = mockStudent;

    render(<TestComponent auth={mockAuth} requireAuth={true} />);

    expect(screen.getByText('isAllowed: true')).toBeInTheDocument();
    expect(screen.getByText('isLoading: false')).toBeInTheDocument();
    expect(screen.getByText('shouldRedirect: false')).toBeInTheDocument();
    expect(screen.getByText('isAuthenticated: true')).toBeInTheDocument();
    expect(screen.getByText('user: John')).toBeInTheDocument();
  });

  it('returns correct state when user is not authenticated and auth is required', () => {
    mockAuth.state.isAuthenticated = false;
    mockAuth.state.isLoading = false;

    render(<TestComponent auth={mockAuth} requireAuth={true} />);

    expect(screen.getByText('isAllowed: false')).toBeInTheDocument();
    expect(screen.getByText('isLoading: false')).toBeInTheDocument();
    expect(screen.getByText('shouldRedirect: true')).toBeInTheDocument();
    expect(screen.getByText('isAuthenticated: false')).toBeInTheDocument();
  });

  it('returns correct state when user is not authenticated and auth is not required', () => {
    mockAuth.state.isAuthenticated = false;
    mockAuth.state.isLoading = false;

    render(<TestComponent auth={mockAuth} requireAuth={false} />);

    expect(screen.getByText('isAllowed: true')).toBeInTheDocument();
    expect(screen.getByText('isLoading: false')).toBeInTheDocument();
    expect(screen.getByText('shouldRedirect: false')).toBeInTheDocument();
    expect(screen.getByText('isAuthenticated: false')).toBeInTheDocument();
  });

  it('returns loading state correctly', () => {
    mockAuth.state.isLoading = true;

    render(<TestComponent auth={mockAuth} />);

    expect(screen.getByText('isLoading: true')).toBeInTheDocument();
  });

  it('returns error state correctly', () => {
    mockAuth.state.error = 'Authentication failed';

    render(<TestComponent auth={mockAuth} />);

    expect(
      screen.getByText('error: Authentication failed')
    ).toBeInTheDocument();
  });
});

describe('ProtectedSection', () => {
  let mockAuth: UseAuthReturn;

  beforeEach(() => {
    mockAuth = createMockAuth();
  });

  it('shows loading state when authentication is loading', () => {
    mockAuth.state.isLoading = true;

    render(
      <ProtectedSection auth={mockAuth}>
        <div>Protected Content</div>
      </ProtectedSection>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    mockAuth.state.isAuthenticated = true;
    mockAuth.state.isLoading = false;

    render(
      <ProtectedSection auth={mockAuth}>
        <div>Protected Content</div>
      </ProtectedSection>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows default fallback when user is not authenticated', () => {
    mockAuth.state.isAuthenticated = false;
    mockAuth.state.isLoading = false;

    render(
      <ProtectedSection auth={mockAuth}>
        <div>Protected Content</div>
      </ProtectedSection>
    );

    expect(
      screen.getByText(/please log in to view this content/i)
    ).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows custom fallback when user is not authenticated', () => {
    mockAuth.state.isAuthenticated = false;
    mockAuth.state.isLoading = false;

    const customFallback = <div>Custom Section Fallback</div>;

    render(
      <ProtectedSection auth={mockAuth} fallback={customFallback}>
        <div>Protected Content</div>
      </ProtectedSection>
    );

    expect(screen.getByText('Custom Section Fallback')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders nothing when showFallback is false and user is not authenticated', () => {
    mockAuth.state.isAuthenticated = false;
    mockAuth.state.isLoading = false;

    render(
      <ProtectedSection auth={mockAuth} showFallback={false}>
        <div>Protected Content</div>
      </ProtectedSection>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/please log in to view this content/i)
    ).not.toBeInTheDocument();
  });
});
