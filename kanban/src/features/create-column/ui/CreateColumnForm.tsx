'use client';

import { useState } from 'react';
import { Button, Input } from '@/shared/ui';
import { useBoardStore } from '@/entities/board';
import styles from './CreateColumnForm.module.css';

interface CreateColumnFormProps {
  boardId: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

export function CreateColumnForm({ boardId, onCancel, onSuccess }: CreateColumnFormProps) {
  const [title, setTitle] = useState('');
  const createColumn = useBoardStore((state) => state.createColumn);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createColumn({ title: title.trim(), boardId });
    setTitle('');
    onSuccess?.();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter list title..."
        autoFocus
      />
      <div className={styles.actions}>
        <Button type="submit" size="sm" disabled={!title.trim()}>
          Add List
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
