import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/shared/test-utils';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <p>Modal content</p>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders when isOpen is true', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(<Modal {...defaultProps} title="Modal Title" />);

      expect(screen.getByText('Modal Title')).toBeInTheDocument();
    });

    it('renders close button when title is provided', () => {
      render(<Modal {...defaultProps} title="Modal Title" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onClose when ESC key is pressed', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<Modal {...defaultProps} onClose={handleClose} />);

      await user.keyboard('{Escape}');

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking overlay', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<Modal {...defaultProps} onClose={handleClose} />);

      const overlay = document.querySelector('[class*="overlay"]');
      if (overlay) {
        await user.click(overlay);
      }

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking modal content', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<Modal {...defaultProps} onClose={handleClose} />);

      await user.click(screen.getByText('Modal content'));

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('calls onClose when clicking close button', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<Modal {...defaultProps} onClose={handleClose} title="Title" />);

      await user.click(screen.getByRole('button'));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('body scroll', () => {
    it('prevents body scroll when open', () => {
      render(<Modal {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = render(<Modal {...defaultProps} />);

      rerender(<Modal {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('unset');
    });
  });
});
