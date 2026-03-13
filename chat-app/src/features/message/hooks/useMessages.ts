// S-04: TanStack Query 사용, S-17: mutation 훅 onSuccess 내장 금지
// N-05: use + 동사, P-13: signal abort

import { useQuery, useMutation } from '@tanstack/react-query';
import { messageApi } from '../api/messageApi';

// ✅ P-03: 모듈 레벨 상수
export const MESSAGE_QUERY_KEY = ['messages'] as const;

export function useMessages(channelId: string) {
  return useQuery({
    queryKey: [...MESSAGE_QUERY_KEY, channelId],
    queryFn: ({ signal }) => messageApi.getByChannel(channelId, signal),
    enabled: !!channelId,
  });
}

// ✅ S-17: mutationFn만 정의, onSuccess는 사용처에서
export function useSendMessage(channelId: string) {
  return useMutation({
    mutationFn: ({ content, userId }: { content: string; userId: string }) =>
      messageApi.send(channelId, content, userId),
  });
}
