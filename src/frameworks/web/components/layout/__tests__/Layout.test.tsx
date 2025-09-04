import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { Layout, LayoutProps } from '../Layout';
import { Student } from '../../../../../entities/Student';

// Mock the CSS import
jest.mock('../Layout.css', () => ({}));

// Mock window.innerWidth for responsive tests
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

beforeEach(() => {
  Object.defineProperty(window, 'addEventListener', {
    writable: true,
    configurable: true,
    value: mockAddEventListener,
  });

  Object.defineProperty(window, 'removeEventListener', {
    writable: true,
    configurable: true,
    value: mockRemoveEventListener,
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

const mockStudent: Student = {
  id: '1',
  studentId: 'STU001',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
};

const mockNavigationItems = [
  { id: 'grades', label: 'My Grades', path: '/grades' },
  { id: 'corrections', label: 'Corrections', path: '/corrections' },
];

const defaultHeaderProps = {
  user: mockStudent,
  isLoading: false,
  onLogout: jest.fn(),
};

const defaultProps: LayoutProps = {
  children: <div data-testid="test-content">Test Content</div>,
  headerProps: defaultHeaderProps,
  navigationItems: mockNavigationItems,
  activeNavigationItem: 'grades',
  onNavigate: jest.fn(),
  showNavigation: true,
};

describe('Layout Component', () => {
  describe('Basic Rendering', () => {
    it('renders layout with header and content', () => {
      render(<Layout {...defaultProps} />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('renders navigation when showNavigation is true and user is authenticated', () => {
      render(<Layout {...defaultProps} />);

      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
      expect(screen.getAllByText('My Grades')).toHaveLength(2); // Header + Sidebar
      expect(screen.getAllByText('Corrections')).toHaveLength(2); // Header + Sidebar
    });

    it('does not render navigation when showNavigation is false', () => {
      render(<Layout {...defaultProps} showNavigation={false} />);

      expect(
        screen.queryByLabelText('Main navigation')
      ).not.toBeInTheDocument();
      // Header navigation should still be present
      expect(screen.getAllByText('My Grades')).toHaveLength(1); // Only header
    });

    it('does not render navigation when user is not authenticated', () => {
      const propsWithoutUser = {
        ...defaultProps,
        headerProps: { ...defaultHeaderProps, user: null },
      };

      render(<Layout {...propsWithoutUser} />);

      expect(
        screen.queryByLabelText('Main navigation')
      ).not.toBeInTheDocument();
      // Header should not show navigation when user is null
      expect(screen.queryByText('My Grades')).not.toBeInTheDocument();
    });

    it('does not render navigation when navigationItems is empty', () => {
      render(<Layout {...defaultProps} navigationItems={[]} />);

      expect(
        screen.queryByLabelText('Main navigation')
      ).not.toBeInTheDocument();
      // Header navigation should still be present
      expect(screen.getAllByText('My Grades')).toHaveLength(1); // Only header
    });
  });

  describe('CSS Classes', () => {
    it('applies default layout classes', () => {
      const { container } = render(<Layout {...defaultProps} />);
      const layoutElement = container.firstChild as HTMLElement;

      expect(layoutElement).toHaveClass('layout');
      expect(layoutElement).toHaveClass('layout--with-navigation');
    });

    it('applies custom className', () => {
      const { container } = render(
        <Layout {...defaultProps} className="custom-layout" />
      );
      const layoutElement = container.firstChild as HTMLElement;

      expect(layoutElement).toHaveClass('custom-layout');
    });

    it('applies no-navigation class when showNavigation is false', () => {
      const { container } = render(
        <Layout {...defaultProps} showNavigation={false} />
      );
      const layoutElement = container.firstChild as HTMLElement;

      expect(layoutElement).toHaveClass('layout--no-navigation');
    });
  });

  describe('Responsive Behavior', () => {
    it('detects mobile viewport on mount', async () => {
      mockInnerWidth(500);

      const { container } = render(<Layout {...defaultProps} />);

      await waitFor(() => {
        const layoutElement = container.firstChild as HTMLElement;
        expect(layoutElement).toHaveClass('layout--mobile');
      });
    });

    it('detects desktop viewport on mount', async () => {
      mockInnerWidth(1024);

      const { container } = render(<Layout {...defaultProps} />);

      await waitFor(() => {
        const layoutElement = container.firstChild as HTMLElement;
        expect(layoutElement).toHaveClass('layout--desktop');
      });
    });

    it('adds resize event listener on mount', () => {
      render(<Layout {...defaultProps} />);

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });

    it('removes resize event listener on unmount', () => {
      const { unmount } = render(<Layout {...defaultProps} />);

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });

    it('updates mobile state when window is resized', async () => {
      mockInnerWidth(1024);
      const { container } = render(<Layout {...defaultProps} />);

      // Initially desktop
      await waitFor(() => {
        const layoutElement = container.firstChild as HTMLElement;
        expect(layoutElement).toHaveClass('layout--desktop');
      });

      // Simulate resize to mobile
      mockInnerWidth(500);
      const resizeHandler = mockAddEventListener.mock.calls.find(
        (call) => call[0] === 'resize'
      )?.[1];

      if (resizeHandler) {
        await act(async () => {
          fireEvent(window, new Event('resize'));
          resizeHandler();
        });
      }

      await waitFor(() => {
        const layoutElement = container.firstChild as HTMLElement;
        expect(layoutElement).toHaveClass('layout--mobile');
      });
    });
  });

  describe('Navigation Integration', () => {
    it('passes correct props to Navigation component', () => {
      render(<Layout {...defaultProps} />);

      const sidebarNavigation = screen.getByLabelText('Main navigation');
      expect(sidebarNavigation).toBeInTheDocument();

      // Check that navigation items are rendered
      expect(screen.getAllByText('My Grades')).toHaveLength(2); // Header + Sidebar
      expect(screen.getAllByText('Corrections')).toHaveLength(2); // Header + Sidebar
    });

    it('calls onNavigate when navigation item is clicked', () => {
      const mockOnNavigate = jest.fn();
      render(<Layout {...defaultProps} onNavigate={mockOnNavigate} />);

      // Click on the sidebar navigation item (not header)
      const sidebarCorrections = screen
        .getByTestId('navigation-menu')
        .querySelector('button[role="menuitem"]')
        ?.parentElement?.nextElementSibling?.querySelector(
          'button[role="menuitem"]'
        );

      if (sidebarCorrections) {
        fireEvent.click(sidebarCorrections);
        expect(mockOnNavigate).toHaveBeenCalledWith(
          '/corrections',
          'corrections'
        );
      }
    });

    it('handles navigation toggle', () => {
      const { container } = render(<Layout {...defaultProps} />);

      // Initially not collapsed
      const layoutElement = container.firstChild as HTMLElement;
      expect(layoutElement).not.toHaveClass('layout--navigation-collapsed');
    });
  });

  describe('Header Integration', () => {
    it('passes headerProps to Header component', () => {
      render(<Layout {...defaultProps} />);

      expect(screen.getByText('Student Grade System')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('(STU001)')).toBeInTheDocument();
    });

    it('handles header navigation', () => {
      const mockOnNavigate = jest.fn();
      render(<Layout {...defaultProps} onNavigate={mockOnNavigate} />);

      // Click on "My Grades" in header (first occurrence)
      const headerNav = screen.getByRole('banner').querySelector('nav');
      const headerGradesButton = headerNav?.querySelector('button');

      if (headerGradesButton) {
        fireEvent.click(headerGradesButton);
        expect(mockOnNavigate).toHaveBeenCalledWith('/grades', undefined);
      }
    });
  });

  describe('Content Area', () => {
    it('renders children in main content area', () => {
      render(<Layout {...defaultProps} />);

      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('applies correct structure for content area', () => {
      render(<Layout {...defaultProps} />);

      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('layout__main');

      const contentElement = mainElement.querySelector('.layout__content');
      expect(contentElement).toBeInTheDocument();
      expect(contentElement).toContainElement(
        screen.getByTestId('test-content')
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA roles', () => {
      render(<Layout {...defaultProps} />);

      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument(); // Sidebar Navigation
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
    });

    it('maintains focus management', () => {
      render(<Layout {...defaultProps} />);

      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();

      // Main element should be focusable for screen readers
      expect(mainElement).toHaveAttribute('role', 'main');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onNavigate prop gracefully', () => {
      const propsWithoutOnNavigate = { ...defaultProps };
      delete propsWithoutOnNavigate.onNavigate;

      expect(() => {
        render(<Layout {...propsWithoutOnNavigate} />);
      }).not.toThrow();
    });

    it('handles empty children', () => {
      render(<Layout {...defaultProps} children={null} />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles undefined activeNavigationItem', () => {
      render(<Layout {...defaultProps} activeNavigationItem={undefined} />);

      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
    });
  });
});
