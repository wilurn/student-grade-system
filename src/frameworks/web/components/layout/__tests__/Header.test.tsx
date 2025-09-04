import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header, HeaderProps } from '../Header';
import { Student } from '../../../../../entities/Student';

// Mock student data
const mockStudent: Student = {
  id: '1',
  studentId: 'STU001',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
};

// Default props for testing
const defaultProps: HeaderProps = {
  user: null,
  isLoading: false,
  onLogout: jest.fn(),
  onNavigate: jest.fn(),
};

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the header with brand title', () => {
      render(<Header {...defaultProps} />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText('Student Grade System')).toBeInTheDocument();
    });

    it('displays guest message when no user is provided', () => {
      render(<Header {...defaultProps} />);

      expect(screen.getByText('Welcome, Guest')).toBeInTheDocument();
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('displays loading state when isLoading is true', () => {
      render(<Header {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Authenticated User Display', () => {
    it('displays user information when user is provided', () => {
      render(<Header {...defaultProps} user={mockStudent} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('(STU001)')).toBeInTheDocument();
      expect(screen.queryByText('Welcome, Guest')).not.toBeInTheDocument();
    });

    it('displays navigation menu when user is authenticated', () => {
      render(<Header {...defaultProps} user={mockStudent} />);

      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();

      expect(
        screen.getByRole('button', { name: 'My Grades' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Corrections' })
      ).toBeInTheDocument();
    });

    it('displays logout button when user is authenticated', () => {
      render(<Header {...defaultProps} user={mockStudent} />);

      expect(
        screen.getByRole('button', { name: 'Logout' })
      ).toBeInTheDocument();
    });
  });

  describe('Navigation Functionality', () => {
    it('calls onNavigate when My Grades is clicked', () => {
      const mockOnNavigate = jest.fn();
      render(
        <Header
          {...defaultProps}
          user={mockStudent}
          onNavigate={mockOnNavigate}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'My Grades' }));

      expect(mockOnNavigate).toHaveBeenCalledWith('/grades');
    });

    it('calls onNavigate when Corrections is clicked', () => {
      const mockOnNavigate = jest.fn();
      render(
        <Header
          {...defaultProps}
          user={mockStudent}
          onNavigate={mockOnNavigate}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Corrections' }));

      expect(mockOnNavigate).toHaveBeenCalledWith('/corrections');
    });

    it('does not call onNavigate when onNavigate prop is not provided', () => {
      render(<Header {...defaultProps} user={mockStudent} />);

      // Should not throw error when clicking navigation items
      expect(() => {
        fireEvent.click(screen.getByRole('button', { name: 'My Grades' }));
      }).not.toThrow();
    });
  });

  describe('Logout Functionality', () => {
    it('calls onLogout when logout button is clicked', () => {
      const mockOnLogout = jest.fn();
      render(
        <Header {...defaultProps} user={mockStudent} onLogout={mockOnLogout} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });

    it('logout button has correct accessibility attributes', () => {
      render(<Header {...defaultProps} user={mockStudent} />);

      const logoutButton = screen.getByRole('button', { name: 'Logout' });
      expect(logoutButton).toHaveAttribute('aria-label', 'Logout');
      expect(logoutButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Mobile Functionality', () => {
    it('renders mobile toggle button', () => {
      render(<Header {...defaultProps} user={mockStudent} />);

      const mobileToggle = screen.getByRole('button', {
        name: 'Toggle navigation menu',
      });
      expect(mobileToggle).toBeInTheDocument();
      expect(mobileToggle).toHaveAttribute(
        'aria-label',
        'Toggle navigation menu'
      );
    });

    it('toggles mobile navigation when mobile toggle is clicked', async () => {
      render(<Header {...defaultProps} user={mockStudent} />);

      const mobileToggle = screen.getByRole('button', {
        name: 'Toggle navigation menu',
      });
      const navigation = screen.getByRole('navigation');

      // Initially should not have open class
      expect(navigation).not.toHaveClass('header__nav--open');

      // Click to open
      fireEvent.click(mobileToggle);

      await waitFor(() => {
        expect(navigation).toHaveClass('header__nav--open');
      });

      // Click to close
      fireEvent.click(mobileToggle);

      await waitFor(() => {
        expect(navigation).not.toHaveClass('header__nav--open');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<Header {...defaultProps} user={mockStudent} />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('navigation links have proper button attributes', () => {
      render(<Header {...defaultProps} user={mockStudent} />);

      const gradesButton = screen.getByRole('button', { name: 'My Grades' });
      const correctionsButton = screen.getByRole('button', {
        name: 'Corrections',
      });

      expect(gradesButton).toHaveAttribute('type', 'button');
      expect(correctionsButton).toHaveAttribute('type', 'button');
    });

    it('mobile toggle has proper accessibility attributes', () => {
      render(<Header {...defaultProps} user={mockStudent} />);

      const mobileToggle = screen.getByRole('button', {
        name: 'Toggle navigation menu',
      });
      expect(mobileToggle).toHaveAttribute('type', 'button');
      expect(mobileToggle).toHaveAttribute(
        'aria-label',
        'Toggle navigation menu'
      );
    });
  });

  describe('User Display Edge Cases', () => {
    it('handles user with empty names gracefully', () => {
      const userWithEmptyNames: Student = {
        ...mockStudent,
        firstName: '',
        lastName: '',
      };

      render(<Header {...defaultProps} user={userWithEmptyNames} />);

      // Should still display the student ID
      expect(screen.getByText('(STU001)')).toBeInTheDocument();
      // Should display empty space for name (handled by StudentBusinessRules.getFullName)
      const nameElement = screen.getByText((content, element) => {
        return (
          element?.className === 'header__user-name' && content.trim() === ''
        );
      });
      expect(nameElement).toBeInTheDocument();
    });

    it('handles user with long names', () => {
      const userWithLongNames: Student = {
        ...mockStudent,
        firstName: 'VeryLongFirstNameThatMightCauseLayoutIssues',
        lastName: 'VeryLongLastNameThatMightCauseLayoutIssues',
      };

      render(<Header {...defaultProps} user={userWithLongNames} />);

      expect(
        screen.getByText(
          'VeryLongFirstNameThatMightCauseLayoutIssues VeryLongLastNameThatMightCauseLayoutIssues'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading state and hides user info when loading', () => {
      render(<Header {...defaultProps} user={mockStudent} isLoading={true} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('prioritizes loading state over user state', () => {
      render(<Header {...defaultProps} user={mockStudent} isLoading={true} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Welcome, Guest')).not.toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('applies correct CSS classes to main elements', () => {
      const { container } = render(
        <Header {...defaultProps} user={mockStudent} />
      );

      expect(container.querySelector('.header')).toBeInTheDocument();
      expect(container.querySelector('.header__container')).toBeInTheDocument();
      expect(container.querySelector('.header__brand')).toBeInTheDocument();
      expect(container.querySelector('.header__nav')).toBeInTheDocument();
      expect(container.querySelector('.header__user')).toBeInTheDocument();
    });
  });
});
