// S-04: TanStack Query 사용, N-05: use + 동사, P-13: signal abort

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageApi } from '../api/messageApi';

const MESSAGE_QUERY_KEY = ['messages'] as const;

export function useMessages(channelId: string) {
  return useQuery({
    queryKey: [...MESSAGE_QUERY_KEY, channelId],
    queryFn: ({ signal }) => messageApi.getByChannel(channelId, signal),
    enabled: !!channelId,
  });
}

export function useSendMessage(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, userId }: { content: string; userId: string }) =>
      messageApi.send(channelId, content, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...MESSAGE_QUERY_KEY, channelId] });
    },
  });
}
