'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Column, ColumnHeader } from '@/entities/column';
import { AddCardButton } from '@/features/create-card';
import { SortableCard } from './SortableCard';
import styles from './KanbanColumn.module.css';

interface KanbanColumnProps {
  column: Column;
  onCardClick: (cardId: string) => void;
}

export function KanbanColumn({ column, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className={styles.column} data-testid="kanban-column">
      <ColumnHeader column={column} />
      <SortableContext
        items={column.cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`${styles.cards} ${isOver ? styles.over : ''}`}
          data-testid="column-drop-area"
        >
          {column.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onClick={() => onCardClick(card.id)}
            />
          ))}
        </div>
      </SortableContext>
      <div className={styles.addCard}>
        <AddCardButton columnId={column.id} boardId={column.boardId} />
      </div>
    </div>
  );
}
