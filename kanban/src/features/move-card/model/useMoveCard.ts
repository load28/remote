'use client';

import { useBoardStore } from '@/entities/board';

export function useMoveCard() {
  const moveCard = useBoardStore((state) => state.moveCard);

  const handleMoveCard = (
    cardId: string,
    targetColumnId: string,
    targetOrder: number
  ) => {
    moveCard(cardId, targetColumnId, targetOrder);
  };

  return { moveCard: handleMoveCard };
}
