import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/shared/test-utils';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  describe('rendering', () => {
    it('renders input element', () => {
      render(<Input placeholder="Enter text" />);

      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('displays error message when error prop is provided', () => {
      render(<Input error="This field is required" />);

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('applies error class when error prop is provided', () => {
      render(<Input error="Error" data-testid="input" />);

      const input = screen.getByTestId('input');
      expect(input.className).toContain('error');
    });

    it('does not show error message when error prop is not provided', () => {
      render(<Input placeholder="Enter text" />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('updates value on user input', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Enter text" />);

      const input = screen.getByPlaceholderText('Enter text');
      await user.type(input, 'Hello World');

      expect(input).toHaveValue('Hello World');
    });

    it('calls onChange when value changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Input onChange={handleChange} placeholder="Enter text" />);

      await user.type(screen.getByPlaceholderText('Enter text'), 'A');

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('supports type attribute', () => {
      render(<Input type="email" placeholder="Email" />);

      expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email');
    });

    it('supports disabled state', () => {
      render(<Input disabled placeholder="Disabled" />);

      expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
    });

    it('forwards ref to input element', () => {
      const ref = { current: null };
      render(<Input ref={ref} placeholder="Ref input" />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('supports name attribute for form submission', () => {
      render(<Input name="email" placeholder="Email" />);

      expect(screen.getByPlaceholderText('Email')).toHaveAttribute('name', 'email');
    });
  });
});
