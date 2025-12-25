import { describe, it, expect } from 'vitest';
import { render, screen, buildCard, buildLabel } from '@/shared/test-utils';
import { CardItem } from './CardItem';

describe('CardItem', () => {
  describe('rendering', () => {
    it('renders card title', () => {
      const card = buildCard({ title: 'Test Card Title' });

      render(<CardItem card={card} />);

      expect(screen.getByText('Test Card Title')).toBeInTheDocument();
    });

    it('renders card description when provided', () => {
      const card = buildCard({ description: 'Card description' });

      render(<CardItem card={card} />);

      expect(screen.getByText('Card description')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      const card = buildCard({ description: undefined });

      render(<CardItem card={card} />);

      expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
    });

    it('renders labels when provided', () => {
      const labels = [
        buildLabel({ id: '1', color: '#ff0000' }),
        buildLabel({ id: '2', color: '#00ff00' }),
      ];
      const card = buildCard({ labels });

      render(<CardItem card={card} />);

      const labelElements = document.querySelectorAll('[class*="label"]');
      expect(labelElements.length).toBeGreaterThanOrEqual(2);
    });

    it('does not render labels section when no labels', () => {
      const card = buildCard({ labels: [] });

      render(<CardItem card={card} />);

      const labelsContainer = document.querySelector('[class*="labels"]');
      expect(labelsContainer).not.toBeInTheDocument();
    });

    it('renders actions when provided', () => {
      const card = buildCard();

      render(
        <CardItem card={card} actions={<button>Delete</button>} />
      );

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
  });

  describe('dragging state', () => {
    it('applies dragging class when isDragging is true', () => {
      const card = buildCard();

      const { container } = render(<CardItem card={card} isDragging />);

      const cardElement = container.firstChild as HTMLElement;
      expect(cardElement.className).toContain('dragging');
    });

    it('does not apply dragging class when isDragging is false', () => {
      const card = buildCard();

      const { container } = render(<CardItem card={card} isDragging={false} />);

      const cardElement = container.firstChild as HTMLElement;
      expect(cardElement.className).not.toContain('dragging');
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const card = buildCard();

      const { container } = render(
        <CardItem card={card} className="custom-class" />
      );

      const cardElement = container.firstChild;
      expect(cardElement).toHaveClass('custom-class');
    });
  });
});
