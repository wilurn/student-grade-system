import React, { useState } from 'react';
import './Navigation.css';

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
}

export interface NavigationProps {
  items: NavigationItem[];
  activeItem?: string;
  onNavigate: (path: string, itemId: string) => void;
  className?: string;
  isMobile?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  items,
  activeItem,
  onNavigate,
  className = '',
  isMobile = false,
  isCollapsed = false,
  onToggle,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleItemClick = (item: NavigationItem) => {
    onNavigate(item.path, item.id);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (onToggle) {
      onToggle();
    }
  };

  const navigationClasses = [
    'navigation',
    className,
    isMobile ? 'navigation--mobile' : '',
    isCollapsed ? 'navigation--collapsed' : '',
    isOpen ? 'navigation--open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <nav
      className={navigationClasses}
      role="navigation"
      aria-label="Main navigation"
    >
      {isMobile && (
        <button
          className="navigation__toggle"
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-controls="navigation-menu"
          aria-label="Toggle navigation menu"
          type="button"
        >
          <span className="navigation__toggle-line"></span>
          <span className="navigation__toggle-line"></span>
          <span className="navigation__toggle-line"></span>
        </button>
      )}

      <ul
        id="navigation-menu"
        data-testid="navigation-menu"
        className="navigation__list"
        role="menubar"
        aria-hidden={isMobile && !isOpen}
      >
        {items.map((item) => {
          const isActive = activeItem === item.id;
          const itemClasses = [
            'navigation__item',
            isActive ? 'navigation__item--active' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <li key={item.id} className={itemClasses} role="none">
              <button
                className="navigation__link"
                onClick={() => handleItemClick(item)}
                aria-current={isActive ? 'page' : undefined}
                role="menuitem"
                type="button"
              >
                {item.icon && (
                  <span className="navigation__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span className="navigation__label">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navigation;
