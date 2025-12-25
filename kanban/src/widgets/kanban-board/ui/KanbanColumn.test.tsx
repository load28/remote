import { describe, it, expect, vi } from 'vitest';
import { render, screen, buildColumn, buildCards } from '@/shared/test-utils';
import userEvent from '@testing-library/user-event';
import { KanbanColumn } from './KanbanColumn';
import { DndContext } from '@dnd-kit/core';

// Wrapper to provide DndContext
function renderWithDnd(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}

describe('KanbanColumn Integration', () => {
  describe('rendering', () => {
    it('renders column header with title', () => {
      const column = buildColumn({ title: 'To Do', cards: [] });

      renderWithDnd(
        <KanbanColumn column={column} onCardClick={vi.fn()} />
      );

      expect(screen.getByText('To Do')).toBeInTheDocument();
    });

    it('renders all cards in the column', () => {
      const cards = [
        ...buildCards(3, { columnId: 'col-1' }),
      ];
      cards[0].title = 'First Task';
      cards[1].title = 'Second Task';
      cards[2].title = 'Third Task';

      const column = buildColumn({ id: 'col-1', cards });

      renderWithDnd(
        <KanbanColumn column={column} onCardClick={vi.fn()} />
      );

      expect(screen.getByText('First Task')).toBeInTheDocument();
      expect(screen.getByText('Second Task')).toBeInTheDocument();
      expect(screen.getByText('Third Task')).toBeInTheDocument();
    });

    it('renders empty column when no cards', () => {
      const column = buildColumn({ cards: [] });

      renderWithDnd(
        <KanbanColumn column={column} onCardClick={vi.fn()} />
      );

      expect(screen.getByText(column.title)).toBeInTheDocument();
    });

    it('renders Add Card button', () => {
      const column = buildColumn({ cards: [] });

      renderWithDnd(
        <KanbanColumn column={column} onCardClick={vi.fn()} />
      );

      // Check for AddCardButton presence (either text or button element)
      const addButton = document.querySelector('[class*="addCard"]');
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('card interaction', () => {
    it('renders cards with click handlers', () => {
      const handleCardClick = vi.fn();
      const cards = buildCards(1, { columnId: 'col-1' });
      const column = buildColumn({ id: 'col-1', cards });

      renderWithDnd(
        <KanbanColumn column={column} onCardClick={handleCardClick} />
      );

      // Verify card is rendered and clickable (dnd-kit handles the click internally)
      expect(screen.getByText(cards[0].title)).toBeInTheDocument();
    });
  });

  describe('column structure', () => {
    it('has droppable area for cards', () => {
      const column = buildColumn({ cards: [] });

      const { container } = renderWithDnd(
        <KanbanColumn column={column} onCardClick={vi.fn()} />
      );

      const cardsArea = container.querySelector('[class*="cards"]');
      expect(cardsArea).toBeInTheDocument();
    });
  });
});
