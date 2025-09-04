import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import './Button.css';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'outline'
  | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      loading = false,
      loadingText,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const buttonClasses = [
      'button',
      `button--${variant}`,
      `button--${size}`,
      fullWidth && 'button--full-width',
      loading && 'button--loading',
      isDisabled && 'button--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const displayText = loading && loadingText ? loadingText : children;

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        <span className="button__content">
          {loading && (
            <span className="button__loading-spinner" aria-hidden="true">
              <LoadingSpinner
                size={size === 'large' ? 'medium' : 'small'}
                color={
                  variant === 'outline' || variant === 'ghost'
                    ? 'primary'
                    : 'white'
                }
              />
            </span>
          )}

          {!loading && leftIcon && (
            <span className="button__left-icon" aria-hidden="true">
              {leftIcon}
            </span>
          )}

          <span className="button__text">{displayText}</span>

          {!loading && rightIcon && (
            <span className="button__right-icon" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
