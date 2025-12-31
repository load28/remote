'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Input } from '@/shared/ui';
import { useBoardStore } from '@/entities/board';
import { cardApi } from '@/entities/card';
import { queryKeys } from '@/shared/api/query';
import styles from './CreateCardForm.module.css';

interface CreateCardFormProps {
  columnId: string;
  boardId: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

export function CreateCardForm({ columnId, boardId, onCancel, onSuccess }: CreateCardFormProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createCard = useBoardStore((state) => state.createCard);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Try API first (for MSW/server)
      await cardApi.create(boardId, columnId, { title: title.trim() });
      // Invalidate React Query cache to refetch boards
      await queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
    } catch {
      // Fallback to Zustand store
      createCard({ title: title.trim(), columnId });
    }
    setTitle('');
    setIsSubmitting(false);
    onSuccess?.();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter a title for this card..."
        autoFocus
        data-testid="card-title-input"
      />
      <div className={styles.actions}>
        <Button type="submit" size="sm" disabled={!title.trim() || isSubmitting} data-testid="submit-card-button">
          Add Card
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
