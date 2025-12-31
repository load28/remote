'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useBoardStore } from '@/entities/board';
import { cardApi } from '@/entities/card';
import { queryKeys } from '@/shared/api/query';

export function useMoveCard() {
  const moveCardStore = useBoardStore((state) => state.moveCard);
  const currentBoardId = useBoardStore((state) => state.currentBoardId);
  const queryClient = useQueryClient();

  const handleMoveCard = async (
    cardId: string,
    targetColumnId: string,
    targetOrder: number
  ) => {
    // Optimistic update in store
    moveCardStore(cardId, targetColumnId, targetOrder);

    // Try API call
    if (currentBoardId) {
      try {
        await cardApi.move(currentBoardId, {
          cardId,
          targetColumnId,
          targetOrder,
        });
        // Invalidate cache to ensure consistency
        await queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
      } catch {
        // API failed, but optimistic update in store remains
      }
    }
  };

  return { moveCard: handleMoveCard };
}
