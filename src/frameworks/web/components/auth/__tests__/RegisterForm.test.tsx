import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { RegisterForm } from '../RegisterForm';
import { UseAuthReturn } from '../../../../../adapters/controllers/useAuth';
import { AuthResult, RegisterData } from '../../../../../entities/Student';

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

describe('RegisterForm', () => {
  let mockAuth: UseAuthReturn;
  let mockOnSuccess: jest.Mock;

  beforeEach(() => {
    mockAuth = createMockAuth();
    mockOnSuccess = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const fillValidForm = async (user: any) => {
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/student id/i), 'STU123456');
    await user.type(
      screen.getByLabelText(/email address/i),
      'john.doe@example.com'
    );
    await user.type(screen.getByLabelText(/^password/i), 'Password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
  };

  it('renders registration form with all required fields', () => {
    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    expect(
      screen.getByRole('heading', { name: /create your account/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/student id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create account/i })
    ).toBeInTheDocument();
  });

  it('displays validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByRole('button', {
      name: /create account/i,
    });
    await user.click(submitButton);

    expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/student id is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/please confirm your password/i)
    ).toBeInTheDocument();
    expect(mockAuth.actions.register).not.toHaveBeenCalled();
  });

  it('displays validation error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    await user.type(screen.getByLabelText(/email address/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/email format is invalid/i)).toBeInTheDocument();
  });

  it('displays validation error for invalid student ID format', async () => {
    const user = userEvent.setup();
    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    await user.type(screen.getByLabelText(/student id/i), '123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      screen.getByText(/student id must be 6-20 alphanumeric characters/i)
    ).toBeInTheDocument();
  });

  it('displays validation error for weak password', async () => {
    const user = userEvent.setup();
    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    await user.type(screen.getByLabelText(/^password/i), 'weak');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      screen.getByText(/password must be at least 8 characters long/i)
    ).toBeInTheDocument();
  });

  it('displays validation error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    await user.type(screen.getByLabelText(/^password/i), 'Password123');
    await user.type(
      screen.getByLabelText(/confirm password/i),
      'DifferentPassword'
    );
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('clears password mismatch error when passwords match', async () => {
    const user = userEvent.setup();
    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    // Create mismatch
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Different');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();

    // Fix mismatch
    await user.clear(confirmPasswordInput);
    await user.type(confirmPasswordInput, 'Password123');

    expect(
      screen.queryByText(/passwords do not match/i)
    ).not.toBeInTheDocument();
  });

  it('clears field errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    const submitButton = screen.getByRole('button', {
      name: /create account/i,
    });

    // Trigger validation error
    await user.click(submitButton);
    expect(screen.getByText(/first name is required/i)).toBeInTheDocument();

    // Start typing to clear error
    await user.type(firstNameInput, 'John');
    expect(
      screen.queryByText(/first name is required/i)
    ).not.toBeInTheDocument();
  });

  it('calls register action with correct data on valid form submission', async () => {
    const user = userEvent.setup();
    const mockRegister = jest.fn().mockResolvedValue({ success: true });
    mockAuth.actions.register = mockRegister;

    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    const expectedData: RegisterData = {
      firstName: 'John',
      lastName: 'Doe',
      studentId: 'STU123456',
      email: 'john.doe@example.com',
      password: 'Password123',
    };

    expect(mockRegister).toHaveBeenCalledWith(expectedData);
  });

  it('calls onSuccess callback when registration is successful', async () => {
    const user = userEvent.setup();
    const mockRegister = jest.fn().mockResolvedValue({ success: true });
    mockAuth.actions.register = mockRegister;

    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('displays error message when registration fails', async () => {
    const user = userEvent.setup();
    const mockRegister = jest.fn().mockResolvedValue({
      success: false,
      error: 'Email already exists',
    });
    mockAuth.actions.register = mockRegister;

    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('shows loading state during form submission', async () => {
    const user = userEvent.setup();
    let resolveRegister: (value: AuthResult) => void;
    const registerPromise = new Promise<AuthResult>((resolve) => {
      resolveRegister = resolve;
    });
    const mockRegister = jest.fn().mockReturnValue(registerPromise);
    mockAuth.actions.register = mockRegister;

    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Check loading state
    expect(screen.getByText(/creating account.../i)).toBeInTheDocument();
    expect(
      screen.getByText(/please wait while we create your account.../i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /creating account.../i })
    ).toBeDisabled();

    // Resolve the promise
    resolveRegister!({ success: true });

    await waitFor(() => {
      expect(
        screen.queryByText(/creating account.../i)
      ).not.toBeInTheDocument();
    });
  });

  it('disables form when auth state is loading', () => {
    mockAuth.state.isLoading = true;

    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    const inputs = [
      screen.getByLabelText(/first name/i),
      screen.getByLabelText(/last name/i),
      screen.getByLabelText(/student id/i),
      screen.getByLabelText(/email address/i),
      screen.getByLabelText(/^password/i),
      screen.getByLabelText(/confirm password/i),
    ];

    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
    expect(
      screen.getByRole('button', { name: /create account/i })
    ).toBeDisabled();
  });

  it('handles register action throwing an error', async () => {
    const user = userEvent.setup();
    const mockRegister = jest
      .fn()
      .mockRejectedValue(new Error('Network error'));
    mockAuth.actions.register = mockRegister;

    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('clears general error when user makes changes to form', async () => {
    const user = userEvent.setup();
    const mockRegister = jest.fn().mockResolvedValue({
      success: false,
      error: 'Registration failed',
    });
    mockAuth.actions.register = mockRegister;

    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });

    // Make a change to clear general error
    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Jane');

    expect(screen.queryByText(/registration failed/i)).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const studentIdInput = screen.getByLabelText(/student id/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    expect(firstNameInput).toHaveAttribute('autoComplete', 'given-name');
    expect(lastNameInput).toHaveAttribute('autoComplete', 'family-name');
    expect(studentIdInput).toHaveAttribute('autoComplete', 'username');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('autoComplete', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('autoComplete', 'new-password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute(
      'autoComplete',
      'new-password'
    );
  });

  it('shows password help text when no password error', () => {
    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    expect(
      screen.getByText(
        /password must be at least 8 characters with uppercase, lowercase, and number/i
      )
    ).toBeInTheDocument();
  });

  it('resets form data on successful registration', async () => {
    const user = userEvent.setup();
    const mockRegister = jest.fn().mockResolvedValue({ success: true });
    mockAuth.actions.register = mockRegister;

    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      const inputs = [
        screen.getByLabelText(/first name/i) as HTMLInputElement,
        screen.getByLabelText(/last name/i) as HTMLInputElement,
        screen.getByLabelText(/student id/i) as HTMLInputElement,
        screen.getByLabelText(/email address/i) as HTMLInputElement,
        screen.getByLabelText(/^password/i) as HTMLInputElement,
        screen.getByLabelText(/confirm password/i) as HTMLInputElement,
      ];

      inputs.forEach((input) => {
        expect(input.value).toBe('');
      });
    });
  });

  it('validates name fields correctly', async () => {
    const user = userEvent.setup();
    render(<RegisterForm auth={mockAuth} onSuccess={mockOnSuccess} />);

    // Test invalid characters
    await user.type(screen.getByLabelText(/first name/i), 'John123');
    await user.type(screen.getByLabelText(/last name/i), 'Doe@');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      screen.getByText(
        /first name can only contain letters, spaces, hyphens, and apostrophes/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /last name can only contain letters, spaces, hyphens, and apostrophes/i
      )
    ).toBeInTheDocument();
  });
});
