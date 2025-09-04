import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading...');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
    expect(spinner).toHaveClass(
      'loading-spinner',
      'loading-spinner--medium',
      'loading-spinner--primary'
    );
  });

  it('renders with custom aria-label', () => {
    const customLabel = 'Loading grades...';
    render(<LoadingSpinner aria-label={customLabel} />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', customLabel);

    const srText = screen.getByText(customLabel);
    expect(srText).toHaveClass('loading-spinner__sr-only');
  });

  it('applies small size class', () => {
    render(<LoadingSpinner size="small" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner--small');
  });

  it('applies medium size class', () => {
    render(<LoadingSpinner size="medium" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner--medium');
  });

  it('applies large size class', () => {
    render(<LoadingSpinner size="large" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner--large');
  });

  it('applies primary color class', () => {
    render(<LoadingSpinner color="primary" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner--primary');
  });

  it('applies secondary color class', () => {
    render(<LoadingSpinner color="secondary" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner--secondary');
  });

  it('applies white color class', () => {
    render(<LoadingSpinner color="white" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner--white');
  });

  it('applies custom className', () => {
    const customClass = 'custom-spinner-class';
    render(<LoadingSpinner className={customClass} />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(customClass);
  });

  it('combines multiple props correctly', () => {
    render(
      <LoadingSpinner
        size="large"
        color="secondary"
        className="custom-class"
        aria-label="Custom loading message"
      />
    );

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(
      'loading-spinner',
      'loading-spinner--large',
      'loading-spinner--secondary',
      'custom-class'
    );
    expect(spinner).toHaveAttribute('aria-label', 'Custom loading message');
  });

  it('contains a spinning circle element', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole('status');
    const circle = spinner.querySelector('.loading-spinner__circle');
    expect(circle).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
    expect(spinner).toHaveAttribute('aria-label');
  });

  it('provides screen reader text', () => {
    const label = 'Loading data...';
    render(<LoadingSpinner aria-label={label} />);

    const srText = screen.getByText(label);
    expect(srText).toHaveClass('loading-spinner__sr-only');
  });
});
