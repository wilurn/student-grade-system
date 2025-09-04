import React from 'react';
import { Student, StudentBusinessRules } from '../../../../entities/Student';
import './Header.css';

export interface HeaderProps {
  user: Student | null;
  isLoading?: boolean;
  onLogout: () => void;
  onNavigate?: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isLoading = false,
  onLogout,
  onNavigate,
}) => {
  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__brand">
          <h1 className="header__title">Student Grade System</h1>
        </div>

        {user && (
          <nav className="header__nav">
            <ul className="header__nav-list">
              <li className="header__nav-item">
                <button
                  className="header__nav-link"
                  onClick={() => handleNavigation('/grades')}
                  type="button"
                >
                  My Grades
                </button>
              </li>
              <li className="header__nav-item">
                <button
                  className="header__nav-link"
                  onClick={() => handleNavigation('/corrections')}
                  type="button"
                >
                  Corrections
                </button>
              </li>
            </ul>
          </nav>
        )}

        <div className="header__user">
          {isLoading ? (
            <div className="header__loading">Loading...</div>
          ) : user ? (
            <div className="header__user-info">
              <span className="header__user-name">
                {StudentBusinessRules.getFullName(user)}
              </span>
              <span className="header__user-id">({user.studentId})</span>
              <button
                className="header__logout-btn"
                onClick={handleLogout}
                type="button"
                aria-label="Logout"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="header__guest">
              <span>Welcome, Guest</span>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="header__mobile-toggle"
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => {
            const nav = document.querySelector('.header__nav');
            nav?.classList.toggle('header__nav--open');
          }}
        >
          <span className="header__mobile-toggle-line"></span>
          <span className="header__mobile-toggle-line"></span>
          <span className="header__mobile-toggle-line"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
