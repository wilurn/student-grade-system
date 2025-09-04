import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('button', 'button--primary', 'button--medium');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('renders with custom text', () => {
      render(<Button>Custom Text</Button>);

      expect(
        screen.getByRole('button', { name: 'Custom Text' })
      ).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<Button className="custom-class">Test</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('renders primary variant by default', () => {
      render(<Button>Primary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--primary');
    });

    it('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--secondary');
    });

    it('renders danger variant', () => {
      render(<Button variant="danger">Danger</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--danger');
    });

    it('renders success variant', () => {
      render(<Button variant="success">Success</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--success');
    });

    it('renders outline variant', () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--outline');
    });

    it('renders ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--ghost');
    });
  });

  describe('Sizes', () => {
    it('renders medium size by default', () => {
      render(<Button>Medium</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--medium');
    });

    it('renders small size', () => {
      render(<Button size="small">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--small');
    });

    it('renders large size', () => {
      render(<Button size="large">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--large');
    });
  });

  describe('Button Types', () => {
    it('renders as button type by default', () => {
      render(<Button>Default</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('renders as submit type', () => {
      render(<Button type="submit">Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('renders as reset type', () => {
      render(<Button type="reset">Reset</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'reset');
    });
  });

  describe('Full Width', () => {
    it('renders full width when specified', () => {
      render(<Button fullWidth>Full Width</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--full-width');
    });

    it('does not render full width by default', () => {
      render(<Button>Normal Width</Button>);

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('button--full-width');
    });
  });

  describe('Icons', () => {
    it('renders with left icon', () => {
      const leftIcon = <span data-testid="left-icon">←</span>;
      render(<Button leftIcon={leftIcon}>With Left Icon</Button>);

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'With Left Icon' })
      ).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      const rightIcon = <span data-testid="right-icon">→</span>;
      render(<Button rightIcon={rightIcon}>With Right Icon</Button>);

      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'With Right Icon' })
      ).toBeInTheDocument();
    });

    it('renders with both left and right icons', () => {
      const leftIcon = <span data-testid="left-icon">←</span>;
      const rightIcon = <span data-testid="right-icon">→</span>;
      render(
        <Button leftIcon={leftIcon} rightIcon={rightIcon}>
          With Both Icons
        </Button>
      );

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('hides icons when loading', () => {
      const leftIcon = <span data-testid="left-icon">←</span>;
      const rightIcon = <span data-testid="right-icon">→</span>;
      render(
        <Button loading leftIcon={leftIcon} rightIcon={rightIcon}>
          Loading
        </Button>
      );

      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when loading', () => {
      render(<Button loading>Loading</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--loading');
      // Check for loading spinner by class since it's aria-hidden
      expect(
        button.querySelector('.button__loading-spinner')
      ).toBeInTheDocument();
    });

    it('shows custom loading text when provided', () => {
      render(
        <Button loading loadingText="Please wait...">
          Submit
        </Button>
      );

      expect(
        screen.getByRole('button', { name: 'Please wait...' })
      ).toBeInTheDocument();
    });

    it('shows original text when loading without loadingText', () => {
      render(<Button loading>Submit</Button>);

      expect(
        screen.getByRole('button', { name: 'Submit' })
      ).toBeInTheDocument();
    });

    it('is disabled when loading', () => {
      render(<Button loading>Loading</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Disabled State', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveClass('button--disabled');
    });

    it('is not disabled by default', () => {
      render(<Button>Enabled</Button>);

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'false');
    });
  });

  describe('Event Handling', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Button loading onClick={handleClick}>
          Loading
        </Button>
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles keyboard events', () => {
      const handleKeyDown = jest.fn();
      render(<Button onKeyDown={handleKeyDown}>Keyboard</Button>);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Button>Accessible</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'false');
    });

    it('has proper ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('has proper ARIA attributes when loading', () => {
      render(<Button loading>Loading</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('supports custom ARIA attributes', () => {
      render(
        <Button aria-label="Custom label" aria-describedby="description">
          Button
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    it('is focusable', () => {
      render(<Button>Focusable</Button>);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('is not focusable when disabled', () => {
      render(<Button disabled>Not Focusable</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });
  });

  describe('Forward Ref', () => {
    it('forwards ref to button element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Ref Test</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toBe(screen.getByRole('button'));
    });
  });

  describe('Custom Props', () => {
    it('passes through additional HTML attributes', () => {
      render(
        <Button data-testid="custom-button" title="Custom title" tabIndex={0}>
          Custom Props
        </Button>
      );

      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('title', 'Custom title');
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    it('handles form-related attributes', () => {
      render(
        <Button
          type="submit"
          form="test-form"
          formAction="/submit"
          formMethod="post"
        >
          Form Button
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('form', 'test-form');
      expect(button).toHaveAttribute('formAction', '/submit');
      expect(button).toHaveAttribute('formMethod', 'post');
    });
  });

  describe('Loading Spinner Configuration', () => {
    it('uses correct spinner size for small button', () => {
      render(
        <Button size="small" loading>
          Small Loading
        </Button>
      );

      const button = screen.getByRole('button');
      const spinner = button.querySelector('.loading-spinner--small');
      expect(spinner).toBeInTheDocument();
    });

    it('uses correct spinner size for large button', () => {
      render(
        <Button size="large" loading>
          Large Loading
        </Button>
      );

      const button = screen.getByRole('button');
      const spinner = button.querySelector('.loading-spinner--medium');
      expect(spinner).toBeInTheDocument();
    });

    it('uses correct spinner color for outline variant', () => {
      render(
        <Button variant="outline" loading>
          Outline Loading
        </Button>
      );

      const button = screen.getByRole('button');
      const spinner = button.querySelector('.loading-spinner--primary');
      expect(spinner).toBeInTheDocument();
    });

    it('uses correct spinner color for ghost variant', () => {
      render(
        <Button variant="ghost" loading>
          Ghost Loading
        </Button>
      );

      const button = screen.getByRole('button');
      const spinner = button.querySelector('.loading-spinner--primary');
      expect(spinner).toBeInTheDocument();
    });
  });
});
