import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotFoundPage } from '../NotFoundPage';

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the Button component
jest.mock('../../components/common/Button', () => ({
  Button: ({ children, onClick, variant, className }: any) => (
    <button
      onClick={onClick}
      data-testid={`button-${variant}`}
      className={className}
    >
      {children}
    </button>
  ),
}));

describe('NotFoundPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render 404 error message', () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(
      screen.getByText(
        "The page you're looking for doesn't exist or has been moved."
      )
    ).toBeInTheDocument();
  });

  it('should render navigation buttons', () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('should navigate to dashboard when "Go to Dashboard" button is clicked', () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );

    const dashboardButton = screen.getByText('Go to Dashboard');
    fireEvent.click(dashboardButton);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should navigate back when "Go Back" button is clicked', () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );

    const backButton = screen.getByText('Go Back');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should have proper button variants', () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('button-primary')).toBeInTheDocument();
    expect(screen.getByTestId('button-secondary')).toBeInTheDocument();
  });

  it('should have proper page structure and styling classes', () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );

    expect(document.querySelector('.not-found-page')).toBeInTheDocument();
    expect(document.querySelector('.not-found-container')).toBeInTheDocument();
    expect(document.querySelector('.not-found-content')).toBeInTheDocument();
    expect(document.querySelector('.not-found-actions')).toBeInTheDocument();
  });

  it('should have proper CSS classes for buttons', () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );

    const dashboardButton = screen.getByText('Go to Dashboard');
    const backButton = screen.getByText('Go Back');

    expect(dashboardButton).toHaveClass('home-button');
    expect(backButton).toHaveClass('back-button');
  });
});
