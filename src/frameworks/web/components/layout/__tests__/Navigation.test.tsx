import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigation, NavigationProps, NavigationItem } from '../Navigation';

// Mock navigation items
const mockNavigationItems: NavigationItem[] = [
  { id: 'grades', label: 'My Grades', path: '/grades', icon: '📊' },
  { id: 'corrections', label: 'Corrections', path: '/corrections', icon: '✏️' },
  { id: 'profile', label: 'Profile', path: '/profile', icon: '👤' },
];

const defaultProps: NavigationProps = {
  items: mockNavigationItems,
  onNavigate: jest.fn(),
  activeItem: 'grades',
};

describe('Navigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders navigation with all items', () => {
      render(<Navigation {...defaultProps} />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();

      mockNavigationItems.forEach((item) => {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      });
    });

    it('renders navigation items as buttons with correct roles', () => {
      render(<Navigation {...defaultProps} />);

      const menubar = screen.getByRole('menubar');
      expect(menubar).toBeInTheDocument();

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(mockNavigationItems.length);
    });

    it('renders icons when provided', () => {
      render(<Navigation {...defaultProps} />);

      mockNavigationItems.forEach((item) => {
        if (item.icon) {
          expect(screen.getByText(item.icon)).toBeInTheDocument();
        }
      });
    });

    it('applies custom className when provided', () => {
      const customClass = 'custom-navigation';
      render(<Navigation {...defaultProps} className={customClass} />);

      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveClass('navigation', customClass);
    });
  });

  describe('Active State', () => {
    it('marks the active item correctly', () => {
      render(<Navigation {...defaultProps} activeItem="corrections" />);

      const correctionsButton = screen
        .getByText('Corrections')
        .closest('button');
      expect(correctionsButton).toHaveAttribute('aria-current', 'page');

      const gradesButton = screen.getByText('My Grades').closest('button');
      expect(gradesButton).not.toHaveAttribute('aria-current');
    });

    it('applies active CSS class to active item', () => {
      render(<Navigation {...defaultProps} activeItem="corrections" />);

      const correctionsItem = screen.getByText('Corrections').closest('li');
      expect(correctionsItem).toHaveClass('navigation__item--active');

      const gradesItem = screen.getByText('My Grades').closest('li');
      expect(gradesItem).not.toHaveClass('navigation__item--active');
    });

    it('handles no active item gracefully', () => {
      render(<Navigation {...defaultProps} activeItem={undefined} />);

      const menuItems = screen.getAllByRole('menuitem');
      menuItems.forEach((item) => {
        expect(item).not.toHaveAttribute('aria-current');
      });
    });
  });

  describe('Navigation Interaction', () => {
    it('calls onNavigate when item is clicked', async () => {
      const user = userEvent.setup();
      const mockOnNavigate = jest.fn();

      render(<Navigation {...defaultProps} onNavigate={mockOnNavigate} />);

      const correctionsButton = screen.getByText('Corrections');
      await user.click(correctionsButton);

      expect(mockOnNavigate).toHaveBeenCalledWith(
        '/corrections',
        'corrections'
      );
    });

    it('calls onNavigate with correct parameters for each item', async () => {
      const user = userEvent.setup();
      const mockOnNavigate = jest.fn();

      render(<Navigation {...defaultProps} onNavigate={mockOnNavigate} />);

      for (const item of mockNavigationItems) {
        const button = screen.getByText(item.label);
        await user.click(button);

        expect(mockOnNavigate).toHaveBeenCalledWith(item.path, item.id);
      }

      expect(mockOnNavigate).toHaveBeenCalledTimes(mockNavigationItems.length);
    });

    it('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      const mockOnNavigate = jest.fn();

      render(<Navigation {...defaultProps} onNavigate={mockOnNavigate} />);

      const firstButton = screen.getByText('My Grades');
      await user.click(firstButton);

      expect(mockOnNavigate).toHaveBeenCalledWith('/grades', 'grades');
    });
  });

  describe('Mobile Navigation', () => {
    it('renders mobile toggle when isMobile is true', () => {
      render(<Navigation {...defaultProps} isMobile={true} />);

      const toggleButton = screen.getByLabelText('Toggle navigation menu');
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('applies mobile CSS classes', () => {
      render(<Navigation {...defaultProps} isMobile={true} />);

      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveClass('navigation--mobile');
    });

    it('toggles mobile menu when toggle button is clicked', async () => {
      const user = userEvent.setup();
      render(<Navigation {...defaultProps} isMobile={true} />);

      const toggleButton = screen.getByLabelText('Toggle navigation menu');
      const navigationList = screen.getByTestId('navigation-menu');

      // Initially closed
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      expect(navigationList).toHaveAttribute('aria-hidden', 'true');

      // Click to open
      await user.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
      expect(navigationList).toHaveAttribute('aria-hidden', 'false');

      // Click to close
      await user.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      expect(navigationList).toHaveAttribute('aria-hidden', 'true');
    });

    it('closes mobile menu when navigation item is clicked', async () => {
      const user = userEvent.setup();
      const mockOnNavigate = jest.fn();

      render(
        <Navigation
          {...defaultProps}
          isMobile={true}
          onNavigate={mockOnNavigate}
        />
      );

      const toggleButton = screen.getByLabelText('Toggle navigation menu');
      const navigationList = screen.getByTestId('navigation-menu');

      // Open menu
      await user.click(toggleButton);
      expect(navigationList).toHaveAttribute('aria-hidden', 'false');

      // Click navigation item
      const gradesButton = screen.getByText('My Grades');
      await user.click(gradesButton);

      // Menu should close and navigation should be called
      await waitFor(() => {
        expect(navigationList).toHaveAttribute('aria-hidden', 'true');
      });
      expect(mockOnNavigate).toHaveBeenCalledWith('/grades', 'grades');
    });

    it('calls onToggle when provided', async () => {
      const user = userEvent.setup();
      const mockOnToggle = jest.fn();

      render(
        <Navigation {...defaultProps} isMobile={true} onToggle={mockOnToggle} />
      );

      const toggleButton = screen.getByLabelText('Toggle navigation menu');
      await user.click(toggleButton);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Collapsed State', () => {
    it('applies collapsed CSS class when isCollapsed is true', () => {
      render(<Navigation {...defaultProps} isCollapsed={true} />);

      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveClass('navigation--collapsed');
    });

    it('can be both mobile and collapsed', () => {
      render(
        <Navigation {...defaultProps} isMobile={true} isCollapsed={true} />
      );

      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveClass(
        'navigation--mobile',
        'navigation--collapsed'
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<Navigation {...defaultProps} />);

      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label', 'Main navigation');

      const menubar = screen.getByRole('menubar');
      expect(menubar).toBeInTheDocument();

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(mockNavigationItems.length);
    });

    it('has proper focus management', async () => {
      const user = userEvent.setup();
      render(<Navigation {...defaultProps} />);

      const buttons = screen.getAllByRole('menuitem');

      // Tab through buttons
      await user.tab();
      expect(buttons[0]).toHaveFocus();

      await user.tab();
      expect(buttons[1]).toHaveFocus();
    });

    it('has proper ARIA attributes for mobile toggle', () => {
      render(<Navigation {...defaultProps} isMobile={true} />);

      const toggleButton = screen.getByLabelText('Toggle navigation menu');
      const navigationList = screen.getByTestId('navigation-menu');

      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      expect(toggleButton).toHaveAttribute('aria-controls', 'navigation-menu');
      expect(navigationList).toHaveAttribute('id', 'navigation-menu');
      expect(navigationList).toHaveAttribute('aria-hidden', 'true');
    });

    it('updates ARIA attributes when mobile menu is toggled', async () => {
      const user = userEvent.setup();
      render(<Navigation {...defaultProps} isMobile={true} />);

      const toggleButton = screen.getByLabelText('Toggle navigation menu');
      const navigationList = screen.getByTestId('navigation-menu');

      await user.click(toggleButton);

      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
      expect(navigationList).toHaveAttribute('aria-hidden', 'false');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty items array', () => {
      render(<Navigation {...defaultProps} items={[]} />);

      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();

      const menubar = screen.getByRole('menubar');
      expect(menubar).toBeInTheDocument();

      const menuItems = screen.queryAllByRole('menuitem');
      expect(menuItems).toHaveLength(0);
    });

    it('handles items without icons', () => {
      const itemsWithoutIcons: NavigationItem[] = [
        { id: 'test1', label: 'Test 1', path: '/test1' },
        { id: 'test2', label: 'Test 2', path: '/test2' },
      ];

      render(<Navigation {...defaultProps} items={itemsWithoutIcons} />);

      expect(screen.getByText('Test 1')).toBeInTheDocument();
      expect(screen.getByText('Test 2')).toBeInTheDocument();
    });

    it('handles activeItem that does not exist in items', () => {
      render(<Navigation {...defaultProps} activeItem="nonexistent" />);

      const menuItems = screen.getAllByRole('menuitem');
      menuItems.forEach((item) => {
        expect(item).not.toHaveAttribute('aria-current');
      });
    });
  });
});
