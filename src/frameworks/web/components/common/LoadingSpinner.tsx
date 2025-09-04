import React from 'react';
import './LoadingSpinner.css';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
  'aria-label'?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  className = '',
  'aria-label': ariaLabel = 'Loading...',
}) => {
  const spinnerClasses = [
    'loading-spinner',
    `loading-spinner--${size}`,
    `loading-spinner--${color}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={spinnerClasses}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      <div className="loading-spinner__circle" />
      <span className="loading-spinner__sr-only">{ariaLabel}</span>
    </div>
  );
};

export default LoadingSpinner;
