import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/shared/test-utils';
import userEvent from '@testing-library/user-event';
import { CreateCardForm } from './CreateCardForm';
import { useBoardStore } from '@/entities/board';

// Mock the board store
vi.mock('@/entities/board', async () => {
  const actual = await vi.importActual('@/entities/board');
  return {
    ...actual,
    useBoardStore: vi.fn(),
  };
});

describe('CreateCardForm Integration', () => {
  const mockCreateCard = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useBoardStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: { createCard: typeof mockCreateCard }) => unknown) =>
        selector({ createCard: mockCreateCard })
    );
  });

  describe('form rendering', () => {
    it('renders input field with placeholder', () => {
      render(
        <CreateCardForm
          columnId="col-1"
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByPlaceholderText(/enter a title/i)
      ).toBeInTheDocument();
    });

    it('renders Add Card button', () => {
      render(
        <CreateCardForm
          columnId="col-1"
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /add card/i })).toBeInTheDocument();
    });

    it('renders Cancel button', () => {
      render(
        <CreateCardForm
          columnId="col-1"
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('form interaction', () => {
    it('disables submit button when title is empty', () => {
      render(
        <CreateCardForm
          columnId="col-1"
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /add card/i })).toBeDisabled();
    });

    it('enables submit button when title has value', async () => {
      const user = userEvent.setup();

      render(
        <CreateCardForm
          columnId="col-1"
          onCancel={mockOnCancel}
        />
      );

      await user.type(screen.getByPlaceholderText(/enter a title/i), 'New Card');

      expect(screen.getByRole('button', { name: /add card/i })).toBeEnabled();
    });

    it('calls createCard with correct data on submit', async () => {
      const user = userEvent.setup();

      render(
        <CreateCardForm
          columnId="col-1"
          onCancel={mockOnCancel}
          onSuccess={mockOnSuccess}
        />
      );

      await user.type(screen.getByPlaceholderText(/enter a title/i), 'My New Card');
      await user.click(screen.getByRole('button', { name: /add card/i }));

      expect(mockCreateCard).toHaveBeenCalledWith({
        title: 'My New Card',
        columnId: 'col-1',
      });
    });

    it('calls onSuccess after successful submission', async () => {
      const user = userEvent.setup();

      render(
        <CreateCardForm
          columnId="col-1"
          onCancel={mockOnCancel}
          onSuccess={mockOnSuccess}
        />
      );

      await user.type(screen.getByPlaceholderText(/enter a title/i), 'New Card');
      await user.click(screen.getByRole('button', { name: /add card/i }));

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('clears input after successful submission', async () => {
      const user = userEvent.setup();

      render(
        <CreateCardForm
          columnId="col-1"
          onCancel={mockOnCancel}
        />
      );

      const input = screen.getByPlaceholderText(/enter a title/i);
      await user.type(input, 'New Card');
      await user.click(screen.getByRole('button', { name: /add card/i }));

      expect(input).toHaveValue('');
    });

    it('calls onCancel when Cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <CreateCardForm
          columnId="col-1"
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('does not submit when title contains only whitespace', async () => {
      const user = userEvent.setup();

      render(
        <CreateCardForm
          columnId="col-1"
          onCancel={mockOnCancel}
        />
      );

      await user.type(screen.getByPlaceholderText(/enter a title/i), '   ');

      expect(screen.getByRole('button', { name: /add card/i })).toBeDisabled();
    });

    it('trims whitespace from title', async () => {
      const user = userEvent.setup();

      render(
        <CreateCardForm
          columnId="col-1"
          onCancel={mockOnCancel}
        />
      );

      await user.type(screen.getByPlaceholderText(/enter a title/i), '  New Card  ');
      await user.click(screen.getByRole('button', { name: /add card/i }));

      expect(mockCreateCard).toHaveBeenCalledWith({
        title: 'New Card',
        columnId: 'col-1',
      });
    });
  });

  describe('keyboard interaction', () => {
    it('submits form on Enter key', async () => {
      const user = userEvent.setup();

      render(
        <CreateCardForm
          columnId="col-1"
          onCancel={mockOnCancel}
        />
      );

      const input = screen.getByPlaceholderText(/enter a title/i);
      await user.type(input, 'New Card{enter}');

      expect(mockCreateCard).toHaveBeenCalled();
    });
  });
});
