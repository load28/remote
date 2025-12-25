'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Column, ColumnHeader } from '@/entities/column';
import { useBoardStore } from '@/entities/board';
import { AddCardButton } from '@/features/create-card';
import { Input } from '@/shared/ui';
import { SortableCard } from './SortableCard';
import styles from './KanbanColumn.module.css';

interface KanbanColumnProps {
  column: Column;
  onCardClick: (cardId: string) => void;
}

export function KanbanColumn({ column, onCardClick }: KanbanColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const updateColumn = useBoardStore((state) => state.updateColumn);
  const deleteColumn = useBoardStore((state) => state.deleteColumn);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle.trim() !== column.title) {
      updateColumn(column.id, editTitle.trim());
    } else {
      setEditTitle(column.title);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (column.cards.length > 0) {
      if (!window.confirm(`This column has ${column.cards.length} card(s). Are you sure you want to delete it?`)) {
        return;
      }
    }
    deleteColumn(column.id);
  };

  const columnActions = (
    <div className={styles.columnActions}>
      <button
        type="button"
        className={styles.actionButton}
        onClick={() => setIsEditing(true)}
        title="Edit column"
      >
        ✏️
      </button>
      <button
        type="button"
        className={styles.actionButton}
        onClick={handleDelete}
        title="Delete column"
      >
        🗑️
      </button>
    </div>
  );

  return (
    <div className={styles.column}>
      {isEditing ? (
        <div className={styles.editHeader}>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveTitle();
              } else if (e.key === 'Escape') {
                setEditTitle(column.title);
                setIsEditing(false);
              }
            }}
            autoFocus
          />
        </div>
      ) : (
        <ColumnHeader column={column} actions={columnActions} />
      )}
      <SortableContext
        items={column.cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`${styles.cards} ${isOver ? styles.over : ''}`}
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
        <AddCardButton columnId={column.id} />
      </div>
    </div>
  );
}
