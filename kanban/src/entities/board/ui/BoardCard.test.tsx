import { describe, it, expect, vi } from 'vitest';
import { render, screen, buildBoard, buildColumn, buildCards } from '@/shared/test-utils';
import userEvent from '@testing-library/user-event';
import { BoardCard } from './BoardCard';

describe('BoardCard', () => {
  describe('rendering', () => {
    it('renders board title', () => {
      const board = buildBoard({ title: 'My Kanban Board' });

      render(<BoardCard board={board} />);

      expect(screen.getByRole('heading', { name: 'My Kanban Board' })).toBeInTheDocument();
    });

    it('displays column count', () => {
      const columns = [
        buildColumn({ id: '1', title: 'To Do' }),
        buildColumn({ id: '2', title: 'In Progress' }),
        buildColumn({ id: '3', title: 'Done' }),
      ];
      const board = buildBoard({ columns });

      render(<BoardCard board={board} />);

      expect(screen.getByText('3 columns')).toBeInTheDocument();
    });

    it('displays total card count across all columns', () => {
      const columns = [
        buildColumn({ id: '1', cards: buildCards(2) }),
        buildColumn({ id: '2', cards: buildCards(3) }),
      ];
      const board = buildBoard({ columns });

      render(<BoardCard board={board} />);

      expect(screen.getByText('5 cards')).toBeInTheDocument();
    });

    it('displays 0 cards when columns have no cards', () => {
      const columns = [
        buildColumn({ id: '1', cards: [] }),
        buildColumn({ id: '2', cards: [] }),
      ];
      const board = buildBoard({ columns });

      render(<BoardCard board={board} />);

      expect(screen.getByText('0 cards')).toBeInTheDocument();
    });

    it('renders actions when provided', () => {
      const board = buildBoard();

      render(
        <BoardCard
          board={board}
          actions={<button>Settings</button>}
        />
      );

      expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onClick when card is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const board = buildBoard();

      render(<BoardCard board={board} onClick={handleClick} />);

      await user.click(screen.getByRole('heading'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not propagate click when clicking actions area', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const board = buildBoard();

      render(
        <BoardCard
          board={board}
          onClick={handleClick}
          actions={<button>Settings</button>}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Settings' }));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('active state', () => {
    it('applies active class when isActive is true', () => {
      const board = buildBoard();

      const { container } = render(<BoardCard board={board} isActive />);

      const cardElement = container.firstChild as HTMLElement;
      expect(cardElement.className).toContain('active');
    });

    it('does not apply active class when isActive is false', () => {
      const board = buildBoard();

      const { container } = render(<BoardCard board={board} isActive={false} />);

      const cardElement = container.firstChild as HTMLElement;
      expect(cardElement.className).not.toContain('active');
    });
  });
});
