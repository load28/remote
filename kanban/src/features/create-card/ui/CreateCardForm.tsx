'use client';

import { useState } from 'react';
import { Button, Input } from '@/shared/ui';
import { useBoardStore } from '@/entities/board';
import styles from './CreateCardForm.module.css';

interface CreateCardFormProps {
  columnId: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

export function CreateCardForm({ columnId, onCancel, onSuccess }: CreateCardFormProps) {
  const [title, setTitle] = useState('');
  const createCard = useBoardStore((state) => state.createCard);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createCard({ title: title.trim(), columnId });
    setTitle('');
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
        <Button type="submit" size="sm" disabled={!title.trim()} data-testid="submit-card-button">
          Add Card
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
