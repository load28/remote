'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { useSession } from 'next-auth/react';
import { Board, useBoardStore } from '@/entities/board';
import { Card } from '@/entities/card';
import { labelApi } from '@/entities/label';
import type { Label } from '@/entities/label';
import { memberApi } from '@/entities/member';
import type { Member } from '@/entities/member';
import { checklistApi } from '@/entities/checklist';
import type { Checklist } from '@/entities/checklist';
import { commentApi } from '@/entities/comment';
import type { Comment } from '@/entities/comment';
import { activityApi } from '@/entities/activity';
import type { Activity } from '@/entities/activity';
import { AddColumnButton } from '@/features/create-column';
import { CardDetailModal } from '@/widgets/card-detail';
import { useMoveCard } from '@/features/move-card';
import { KanbanColumn } from './KanbanColumn';
import styles from './KanbanBoard.module.css';

interface KanbanBoardProps {
  board: Board;
}

export function KanbanBoard({ board }: KanbanBoardProps) {
  const { data: session } = useSession();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedColumnTitle, setSelectedColumnTitle] = useState<string>('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const { moveCard } = useMoveCard();
  const updateCard = useBoardStore((state) => state.updateCard);
  const deleteCard = useBoardStore((state) => state.deleteCard);

  // Card detail data
  const [boardLabels, setBoardLabels] = useState<Label[]>([]);
  const [boardMembers, setBoardMembers] = useState<Member[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch board labels and members
  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        const [labels, members] = await Promise.all([
          labelApi.getLabels(board.id),
          memberApi.getMembers(board.id),
        ]);
        setBoardLabels(labels);
        setBoardMembers(members);
      } catch (error) {
        console.error('Failed to fetch board data:', error);
      }
    };
    fetchBoardData();
  }, [board.id]);

  // Fetch card-specific data when a card is selected
  useEffect(() => {
    if (!selectedCard) {
      setChecklists([]);
      setComments([]);
      setActivities([]);
      return;
    }

    const fetchCardData = async () => {
      try {
        const [checklistsData, commentsData, activitiesData] = await Promise.all([
          checklistApi.getChecklists(board.id, selectedCard.id),
          commentApi.getComments(board.id, selectedCard.id),
          activityApi.getCardActivities(board.id, selectedCard.id),
        ]);
        setChecklists(checklistsData);
        setComments(commentsData);
        setActivities(activitiesData);
      } catch (error) {
        console.error('Failed to fetch card data:', error);
      }
    };
    fetchCardData();
  }, [board.id, selectedCard]);

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
    const column = findColumnByCardId(cardId);
    if (card && column) {
      setSelectedCard(card);
      setSelectedColumnTitle(column.title);
    }
  };

  const handleCloseModal = () => {
    setSelectedCard(null);
    setSelectedColumnTitle('');
  };

  // Card update handlers
  const handleUpdateCard = async (updates: Partial<Card>) => {
    if (!selectedCard) return;
    updateCard(selectedCard.id, updates);
    setSelectedCard((prev) => prev ? { ...prev, ...updates } : null);
  };

  const handleDeleteCard = async () => {
    if (!selectedCard) return;
    deleteCard(selectedCard.id);
    handleCloseModal();
  };

  // Label handlers
  const handleToggleLabel = async (label: Label) => {
    if (!selectedCard) return;
    const currentLabels = selectedCard.labels || [];
    const hasLabel = currentLabels.some((l) => l.id === label.id);

    try {
      if (hasLabel) {
        await labelApi.removeLabelFromCard(board.id, selectedCard.id, label.id);
        const newLabels = currentLabels.filter((l) => l.id !== label.id);
        handleUpdateCard({ labels: newLabels });
      } else {
        await labelApi.addLabelToCard(board.id, selectedCard.id, label.id);
        const newLabels = [...currentLabels, { id: label.id, name: label.name, color: label.color }];
        handleUpdateCard({ labels: newLabels });
      }
    } catch (error) {
      console.error('Failed to toggle label:', error);
    }
  };

  const handleCreateLabel = async (name: string, color: string) => {
    try {
      const newLabel = await labelApi.createLabel(board.id, { name, color });
      setBoardLabels((prev) => [...prev, newLabel]);
    } catch (error) {
      console.error('Failed to create label:', error);
    }
  };

  // Member handlers
  const handleToggleAssignee = async (memberId: string) => {
    if (!selectedCard) return;
    const currentAssignees = selectedCard.assigneeIds || [];
    const isAssigned = currentAssignees.includes(memberId);

    try {
      if (isAssigned) {
        await memberApi.unassignFromCard(board.id, selectedCard.id, memberId);
        const newAssignees = currentAssignees.filter((id) => id !== memberId);
        handleUpdateCard({ assigneeIds: newAssignees });
      } else {
        await memberApi.assignToCard(board.id, selectedCard.id, memberId);
        const newAssignees = [...currentAssignees, memberId];
        handleUpdateCard({ assigneeIds: newAssignees });
      }
    } catch (error) {
      console.error('Failed to toggle assignee:', error);
    }
  };

  // Due date handler
  const handleSetDueDate = async (date: string | null, isCompleted: boolean) => {
    if (!selectedCard) return;
    handleUpdateCard({
      dueDate: date || undefined,
      dueDateCompleted: isCompleted
    });
  };

  // Checklist handlers
  const handleCreateChecklist = async (title: string) => {
    if (!selectedCard) return;
    try {
      const newChecklist = await checklistApi.createChecklist(board.id, selectedCard.id, { title });
      setChecklists((prev) => [...prev, newChecklist]);
    } catch (error) {
      console.error('Failed to create checklist:', error);
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    if (!selectedCard) return;
    try {
      await checklistApi.deleteChecklist(board.id, selectedCard.id, checklistId);
      setChecklists((prev) => prev.filter((c) => c.id !== checklistId));
    } catch (error) {
      console.error('Failed to delete checklist:', error);
    }
  };

  const handleToggleChecklistItem = async (checklistId: string, itemId: string, isCompleted: boolean) => {
    if (!selectedCard) return;
    try {
      const updatedChecklist = await checklistApi.toggleItem(board.id, selectedCard.id, checklistId, itemId, isCompleted);
      setChecklists((prev) =>
        prev.map((c) => (c.id === checklistId ? updatedChecklist : c))
      );
    } catch (error) {
      console.error('Failed to toggle checklist item:', error);
    }
  };

  const handleUpdateChecklistItem = async (checklistId: string, itemId: string, title: string) => {
    if (!selectedCard) return;
    try {
      const updatedChecklist = await checklistApi.updateItem(board.id, selectedCard.id, checklistId, itemId, { title });
      setChecklists((prev) =>
        prev.map((c) => (c.id === checklistId ? updatedChecklist : c))
      );
    } catch (error) {
      console.error('Failed to update checklist item:', error);
    }
  };

  const handleDeleteChecklistItem = async (checklistId: string, itemId: string) => {
    if (!selectedCard) return;
    try {
      await checklistApi.deleteItem(board.id, selectedCard.id, checklistId, itemId);
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? { ...c, items: c.items.filter((i) => i.id !== itemId) }
            : c
        )
      );
    } catch (error) {
      console.error('Failed to delete checklist item:', error);
    }
  };

  const handleAddChecklistItem = async (checklistId: string, title: string) => {
    if (!selectedCard) return;
    try {
      const updatedChecklist = await checklistApi.addItem(board.id, selectedCard.id, checklistId, { title });
      setChecklists((prev) =>
        prev.map((c) => (c.id === checklistId ? updatedChecklist : c))
      );
    } catch (error) {
      console.error('Failed to add checklist item:', error);
    }
  };

  // Comment handlers
  const handleAddComment = async (content: string) => {
    if (!selectedCard) return;
    try {
      const newComment = await commentApi.createComment(board.id, selectedCard.id, { content });
      setComments((prev) => [...prev, newComment]);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    if (!selectedCard) return;
    try {
      const updatedComment = await commentApi.updateComment(board.id, selectedCard.id, commentId, { content });
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updatedComment : c))
      );
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedCard) return;
    try {
      await commentApi.deleteComment(board.id, selectedCard.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
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

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          columnTitle={selectedColumnTitle}
          boardLabels={boardLabels}
          boardMembers={boardMembers}
          checklists={checklists}
          comments={comments}
          activities={activities}
          currentUserId={session?.user?.id || 'user-1'}
          isOpen={!!selectedCard}
          onClose={handleCloseModal}
          onUpdateCard={handleUpdateCard}
          onDeleteCard={handleDeleteCard}
          onToggleLabel={handleToggleLabel}
          onCreateLabel={handleCreateLabel}
          onToggleAssignee={handleToggleAssignee}
          onSetDueDate={handleSetDueDate}
          onCreateChecklist={handleCreateChecklist}
          onDeleteChecklist={handleDeleteChecklist}
          onToggleChecklistItem={handleToggleChecklistItem}
          onUpdateChecklistItem={handleUpdateChecklistItem}
          onDeleteChecklistItem={handleDeleteChecklistItem}
          onAddChecklistItem={handleAddChecklistItem}
          onAddComment={handleAddComment}
          onUpdateComment={handleUpdateComment}
          onDeleteComment={handleDeleteComment}
        />
      )}
    </>
  );
}
