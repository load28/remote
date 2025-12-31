'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Input } from '@/shared/ui';
import { useBoardStore } from '@/entities/board';
import { columnApi } from '@/entities/column';
import { queryKeys } from '@/shared/api/query';
import styles from './CreateColumnForm.module.css';

interface CreateColumnFormProps {
  boardId: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

export function CreateColumnForm({ boardId, onCancel, onSuccess }: CreateColumnFormProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createColumn = useBoardStore((state) => state.createColumn);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Try API first (for MSW/server)
      await columnApi.create(boardId, { title: title.trim() });
      // Invalidate React Query cache to refetch boards
      await queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
    } catch {
      // Fallback to Zustand store
      createColumn({ title: title.trim(), boardId });
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
        placeholder="Enter list title..."
        autoFocus
        data-testid="column-title-input"
      />
      <div className={styles.actions}>
        <Button type="submit" size="sm" disabled={!title.trim() || isSubmitting} data-testid="submit-column-button">
          Add List
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
