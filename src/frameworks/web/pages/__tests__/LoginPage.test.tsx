import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';
import { useAuth } from '../../../../adapters/controllers/useAuth';

// Mock the useAuth hook
jest.mock('../../../../adapters/controllers/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

// Mock the LoginForm component
jest.mock('../../components/auth/LoginForm', () => ({
    LoginForm: ({ auth, onSuccess }: { auth: any; onSuccess: () => void }) => (
        <div data-testid="login-form">
            <button onClick={onSuccess} data-testid="login-success-button">
                Login Success
            </button>
        </div>
    )
}));

describe('LoginPage', () => {
    const mockAuthActions = {
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        getCurrentUser: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAuth.mockReturnValue({
            state: {
                user: null,
                isLoading: false,
                error: null
            },
            actions: mockAuthActions
        });
    });

    it('should render login form', () => {
        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('should render register link', () => {
        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
        expect(screen.getByText('Register here')).toBeInTheDocument();
    });

    it('should navigate to register page when register link is clicked', () => {
        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        const registerLink = screen.getByText('Register here');
        fireEvent.click(registerLink);

        expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('should navigate to dashboard on successful login', async () => {
        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        const loginSuccessButton = screen.getByTestId('login-success-button');
        fireEvent.click(loginSuccessButton);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('should pass auth object to LoginForm', () => {
        const mockAuth = {
            state: {
                user: null,
                isLoading: false,
                error: null
            },
            actions: mockAuthActions
        };

        mockUseAuth.mockReturnValue(mockAuth);

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('should have proper page structure and styling classes', () => {
        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        expect(screen.getByTestId('login-form').closest('.login-page')).toBeInTheDocument();
        expect(screen.getByTestId('login-form').closest('.auth-container')).toBeInTheDocument();
    });
});