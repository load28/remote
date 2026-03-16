// S-04: TanStack Query 사용, N-05: use + 동사, P-13: signal abort

import { useQuery } from '@tanstack/react-query';
import { messageApi } from '../api/messageApi';

// P-03: 모듈 레벨 상수
export const MESSAGE_QUERY_KEY = ['messages'] as const;

export function useMessages(channelId: string) {
  return useQuery({
    queryKey: [...MESSAGE_QUERY_KEY, channelId],
    queryFn: ({ signal }) => messageApi.getByChannel(channelId, signal),
    enabled: !!channelId,
  });
}
