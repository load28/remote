'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { Board, useBoardStore } from '@/entities/board';
import { Card } from '@/entities/card';
import { AddColumnButton } from '@/features/create-column';
import { EditCardModal } from '@/features/edit-card';
import { useMoveCard } from '@/features/move-card';
import { KanbanColumn } from './KanbanColumn';
import styles from './KanbanBoard.module.css';

interface KanbanBoardProps {
  board: Board;
}

export function KanbanBoard({ board }: KanbanBoardProps) {
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { moveCard } = useMoveCard();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const findCard = useCallback(
    (cardId: string) => {
      for (const column of board.columns) {
        const card = column.cards.find((c) => c.id === cardId);
        if (card) return card;
      }
      return null;
    },
    [board.columns]
  );

  const findColumnByCardId = useCallback(
    (cardId: string) => {
      return board.columns.find((column) =>
        column.cards.some((card) => card.id === cardId)
      );
    },
    [board.columns]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumnByCardId(activeId);
    const overColumn =
      board.columns.find((c) => c.id === overId) || findColumnByCardId(overId);

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
      return;
    }

    // Move card to new column
    const overCards = overColumn.cards;
    const overCardIndex = overCards.findIndex((c) => c.id === overId);
    const targetOrder =
      overCardIndex >= 0 ? overCardIndex : overCards.length;

    moveCard(activeId, overColumn.id, targetOrder);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeColumn = findColumnByCardId(activeId);
    const overColumn =
      board.columns.find((c) => c.id === overId) || findColumnByCardId(overId);

    if (!activeColumn || !overColumn) return;

    const overCards = overColumn.cards;
    const activeIndex = overCards.findIndex((c) => c.id === activeId);
    const overIndex = overCards.findIndex((c) => c.id === overId);

    if (activeIndex !== overIndex && overIndex >= 0) {
      moveCard(activeId, overColumn.id, overIndex);
    }
  };

  const handleCardClick = (cardId: string) => {
    const card = findCard(cardId);
    if (card) {
      setEditingCard(card);
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.board}>
          {board.columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onCardClick={handleCardClick}
            />
          ))}
          <AddColumnButton boardId={board.id} />
        </div>
      </DndContext>

      <EditCardModal
        card={editingCard}
        isOpen={!!editingCard}
        onClose={() => setEditingCard(null)}
      />
    </>
  );
}
