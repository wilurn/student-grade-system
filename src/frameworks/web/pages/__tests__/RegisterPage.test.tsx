import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RegisterPage } from '../RegisterPage';
import { useAuth } from '../../../../adapters/controllers/useAuth';

// Mock the useAuth hook
jest.mock('../../../../adapters/controllers/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the RegisterForm component
jest.mock('../../components/auth/RegisterForm', () => ({
  RegisterForm: ({ auth, onSuccess }: { auth: any; onSuccess: () => void }) => (
    <div data-testid="register-form">
      <button onClick={onSuccess} data-testid="register-success-button">
        Register Success
      </button>
    </div>
  ),
}));

describe('RegisterPage', () => {
  const mockAuthActions = {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      state: {
        user: null,
        isLoading: false,
        error: null,
      },
      actions: mockAuthActions,
    });
  });

  it('should render register form', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('register-form')).toBeInTheDocument();
  });

  it('should render login link', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    expect(screen.getByText('Login here')).toBeInTheDocument();
  });

  it('should navigate to login page when login link is clicked', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    const loginLink = screen.getByText('Login here');
    fireEvent.click(loginLink);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should navigate to login page on successful registration', async () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    const registerSuccessButton = screen.getByTestId('register-success-button');
    fireEvent.click(registerSuccessButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should pass auth object to RegisterForm', () => {
    const mockAuth = {
      state: {
        user: null,
        isLoading: false,
        error: null,
      },
      actions: mockAuthActions,
    };

    mockUseAuth.mockReturnValue(mockAuth);

    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('register-form')).toBeInTheDocument();
  });

  it('should have proper page structure and styling classes', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    expect(
      screen.getByTestId('register-form').closest('.register-page')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('register-form').closest('.auth-container')
    ).toBeInTheDocument();
  });
});
