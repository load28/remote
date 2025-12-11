'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui';
import { CreateColumnForm } from './CreateColumnForm';
import styles from './AddColumnButton.module.css';

interface AddColumnButtonProps {
  boardId: string;
}

export function AddColumnButton({ boardId }: AddColumnButtonProps) {
  const [isAdding, setIsAdding] = useState(false);

  if (isAdding) {
    return (
      <CreateColumnForm
        boardId={boardId}
        onCancel={() => setIsAdding(false)}
        onSuccess={() => setIsAdding(false)}
      />
    );
  }

  return (
    <Button
      variant="ghost"
      className={styles.button}
      onClick={() => setIsAdding(true)}
    >
      + Add another list
    </Button>
  );
}
