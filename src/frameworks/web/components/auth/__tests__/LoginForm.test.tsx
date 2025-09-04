import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LoginForm } from '../LoginForm';
import { UseAuthReturn } from '../../../../../adapters/controllers/useAuth';
import { AuthResult } from '../../../../../entities/Student';

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

describe('LoginForm', () => {
  let mockAuth: UseAuthReturn;
  let mockOnSuccess: jest.Mock;

  beforeEach(() => {
    mockAuth = createMockAuth();
    mockOnSuccess = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form with all required fields', () => {
    render(<LoginForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    expect(
      screen.getByRole('heading', { name: /login to your account/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it('displays validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(mockAuth.actions.login).not.toHaveBeenCalled();
  });

  it('displays validation error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<LoginForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(screen.getByText(/email format is invalid/i)).toBeInTheDocument();
    expect(mockAuth.actions.login).not.toHaveBeenCalled();
  });

  it('clears field errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<LoginForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Trigger validation error
    await user.click(submitButton);
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();

    // Start typing to clear error
    await user.type(emailInput, 'test@example.com');
    expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
  });

  it('calls login action with correct credentials on valid form submission', async () => {
    const user = userEvent.setup();
    const mockLogin = jest.fn().mockResolvedValue({ success: true });
    mockAuth.actions.login = mockLogin;

    render(<LoginForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('calls onSuccess callback when login is successful', async () => {
    const user = userEvent.setup();
    const mockLogin = jest.fn().mockResolvedValue({ success: true });
    mockAuth.actions.login = mockLogin;

    render(<LoginForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('displays error message when login fails', async () => {
    const user = userEvent.setup();
    const mockLogin = jest.fn().mockResolvedValue({
      success: false,
      error: 'Invalid credentials',
    });
    mockAuth.actions.login = mockLogin;

    render(<LoginForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('shows loading state during form submission', async () => {
    const user = userEvent.setup();
    let resolveLogin: (value: AuthResult) => void;
    const loginPromise = new Promise<AuthResult>((resolve) => {
      resolveLogin = resolve;
    });
    const mockLogin = jest.fn().mockReturnValue(loginPromise);
    mockAuth.actions.login = mockLogin;

    render(<LoginForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Check loading state
    expect(screen.getByText(/signing in.../i)).toBeInTheDocument();
    expect(
      screen.getByText(/please wait while we sign you in.../i)
    ).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Resolve the promise
    resolveLogin!({ success: true });

    await waitFor(() => {
      expect(screen.queryByText(/signing in.../i)).not.toBeInTheDocument();
    });
  });

  it('disables form when auth state is loading', () => {
    mockAuth.state.isLoading = true;

    render(<LoginForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('handles login action throwing an error', async () => {
    const user = userEvent.setup();
    const mockLogin = jest.fn().mockRejectedValue(new Error('Network error'));
    mockAuth.actions.login = mockLogin;

    render(<LoginForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('clears general error when user makes changes to form', async () => {
    const user = userEvent.setup();
    const mockLogin = jest.fn().mockResolvedValue({
      success: false,
      error: 'Login failed',
    });
    mockAuth.actions.login = mockLogin;

    render(<LoginForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Submit form to get error
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });

    // Clear input and type again - should clear general error
    await user.clear(emailInput);
    await user.type(emailInput, 'new@example.com');

    expect(screen.queryByText(/login failed/i)).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<LoginForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('autoComplete', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
  });

  it('resets form data on successful login', async () => {
    const user = userEvent.setup();
    const mockLogin = jest.fn().mockResolvedValue({ success: true });
    mockAuth.actions.login = mockLogin;

    render(<LoginForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(
      /email address/i
    ) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(
      /password/i
    ) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });
  });
});
