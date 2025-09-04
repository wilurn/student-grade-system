import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '../../../../../adapters/controllers/useAuth';

// Mock the useAuth hook
jest.mock('../../../../../adapters/controllers/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the LoadingSpinner component
jest.mock('../../common/LoadingSpinner', () => ({
  LoadingSpinner: ({ 'aria-label': ariaLabel }: { 'aria-label': string }) => (
    <div data-testid="loading-spinner" aria-label={ariaLabel}>
      Loading...
    </div>
  ),
}));

const TestComponent = () => (
  <div data-testid="protected-content">Protected Content</div>
);

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading spinner when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      state: {
        user: null,
        isLoading: true,
        error: null,
      },
      actions: {
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        getCurrentUser: jest.fn(),
      },
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Checking authentication...')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      state: {
        user: null,
        isLoading: false,
        error: null,
      },
      actions: {
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        getCurrentUser: jest.fn(),
      },
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    // The component should not render the protected content
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should render protected content when user is authenticated', () => {
    const mockUser = {
      id: '1',
      studentId: 'STU001',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    mockUseAuth.mockReturnValue({
      state: {
        user: mockUser,
        isLoading: false,
        error: null,
      },
      actions: {
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        getCurrentUser: jest.fn(),
      },
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });

  it('should redirect to custom path when redirectTo is provided', () => {
    mockUseAuth.mockReturnValue({
      state: {
        user: null,
        isLoading: false,
        error: null,
      },
      actions: {
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        getCurrentUser: jest.fn(),
      },
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute redirectTo="/custom-login">
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    // The component should not render the protected content
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should handle authentication state changes', () => {
    const mockUser = {
      id: '1',
      studentId: 'STU001',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    // Start with loading state
    mockUseAuth.mockReturnValue({
      state: {
        user: null,
        isLoading: true,
        error: null,
      },
      actions: {
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        getCurrentUser: jest.fn(),
      },
    });

    const { rerender } = render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Update to authenticated state
    mockUseAuth.mockReturnValue({
      state: {
        user: mockUser,
        isLoading: false,
        error: null,
      },
      actions: {
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        getCurrentUser: jest.fn(),
      },
    });

    rerender(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});
