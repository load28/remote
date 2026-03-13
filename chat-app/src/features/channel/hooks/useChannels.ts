// S-04: TanStack Query 사용, N-05: use + 동사, P-13: signal abort

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { channelApi } from '../api/channelApi';
import type { CreateChannelInput } from '../types';

const CHANNEL_QUERY_KEY = ['channels'] as const;

export function useChannels() {
  return useQuery({
    queryKey: CHANNEL_QUERY_KEY,
    queryFn: ({ signal }) => channelApi.getAll(signal),
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateChannelInput) => channelApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANNEL_QUERY_KEY });
    },
  });
}
