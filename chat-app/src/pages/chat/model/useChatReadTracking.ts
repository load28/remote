// A-05: 비즈니스 로직 분리 — ChatPage에서 읽음 추적 로직 추출
// N-05: use + 동사

import { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useUnreadCounts,
  useMarkAsRead,
  UNREAD_COUNTS_QUERY_KEY,
} from '@/features/thread';

// ✅ T-13: named exported interface
export interface UnreadInfo {
  messageCount: number;
  mentionCount: number;
}

export interface ChatReadTrackingResult {
  unreadCountMap: Record<string, UnreadInfo>;
  handleMarkChannelAsRead: (channelId: string, lastMessageId: string) => void;
}

export function useChatReadTracking(userId: string): ChatReadTrackingResult {
  const queryClient = useQueryClient();
  const { data: unreadCounts = [] } = useUnreadCounts(userId);
  const markAsRead = useMarkAsRead(userId);

  const unreadCountMap = useMemo(() => {
    const map: Record<string, UnreadInfo> = {};
    for (const uc of unreadCounts) {
      map[uc.channelId] = { messageCount: uc.messageCount, mentionCount: uc.mentionCount };
    }
    return map;
  }, [unreadCounts]);

  const handleMarkChannelAsRead = useCallback(
    (channelId: string, lastMessageId: string) => {
      if (!lastMessageId) return;
      markAsRead.mutate(
        { channelId, messageId: lastMessageId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: UNREAD_COUNTS_QUERY_KEY });
          },
        },
      );
    },
    [markAsRead, queryClient],
  );

  return { unreadCountMap, handleMarkChannelAsRead };
}
