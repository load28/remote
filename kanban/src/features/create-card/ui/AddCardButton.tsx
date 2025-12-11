'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui';
import { CreateCardForm } from './CreateCardForm';
import styles from './AddCardButton.module.css';

interface AddCardButtonProps {
  columnId: string;
}

export function AddCardButton({ columnId }: AddCardButtonProps) {
  const [isAdding, setIsAdding] = useState(false);

  if (isAdding) {
    return (
      <div className={styles.formWrapper}>
        <CreateCardForm
          columnId={columnId}
          onCancel={() => setIsAdding(false)}
          onSuccess={() => setIsAdding(false)}
        />
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      fullWidth
      className={styles.button}
      onClick={() => setIsAdding(true)}
    >
      + Add a card
    </Button>
  );
}
