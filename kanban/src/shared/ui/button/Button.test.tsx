import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/shared/test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

// Helper to check if className contains a CSS module class
function hasClassContaining(element: HTMLElement, className: string) {
  return element.className.includes(className);
}

describe('Button', () => {
  describe('rendering', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>);

      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('applies default variant (primary)', () => {
      render(<Button>Primary</Button>);

      const button = screen.getByRole('button');
      expect(hasClassContaining(button, 'primary')).toBe(true);
    });

    it('applies secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(hasClassContaining(button, 'secondary')).toBe(true);
    });

    it('applies ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(hasClassContaining(button, 'ghost')).toBe(true);
    });

    it('applies danger variant', () => {
      render(<Button variant="danger">Danger</Button>);

      const button = screen.getByRole('button');
      expect(hasClassContaining(button, 'danger')).toBe(true);
    });

    it('applies size classes', () => {
      const { rerender } = render(<Button size="sm">Small</Button>);
      expect(hasClassContaining(screen.getByRole('button'), 'sm')).toBe(true);

      rerender(<Button size="md">Medium</Button>);
      expect(hasClassContaining(screen.getByRole('button'), 'md')).toBe(true);

      rerender(<Button size="lg">Large</Button>);
      expect(hasClassContaining(screen.getByRole('button'), 'lg')).toBe(true);
    });

    it('applies fullWidth class when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>);

      expect(hasClassContaining(screen.getByRole('button'), 'fullWidth')).toBe(true);
    });
  });

  describe('interaction', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click me</Button>);

      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('shows disabled state', () => {
      render(<Button disabled>Disabled</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('supports type attribute', () => {
      render(<Button type="submit">Submit</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('forwards ref to button element', () => {
      const ref = { current: null };
      render(<Button ref={ref}>Ref Button</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
});
