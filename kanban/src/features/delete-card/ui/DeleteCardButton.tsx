'use client';

import { Button } from '@/shared/ui';
import { useBoardStore } from '@/entities/board';

interface DeleteCardButtonProps {
  cardId: string;
  onSuccess?: () => void;
}

export function DeleteCardButton({ cardId, onSuccess }: DeleteCardButtonProps) {
  const deleteCard = useBoardStore((state) => state.deleteCard);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      deleteCard(cardId);
      onSuccess?.();
    }
  };

  return (
    <Button variant="danger" size="sm" onClick={handleDelete}>
      Delete
    </Button>
  );
}
