// S-04: TanStack Query 사용, S-17: mutation 훅 onSuccess 내장 금지
// N-05: use + 동사, P-13: signal abort

import { useQuery, useMutation } from '@tanstack/react-query';
import { channelApi } from '../api/channelApi';
import type { CreateChannelInput } from '../types';

// ✅ P-03: 모듈 레벨 상수
export const CHANNEL_QUERY_KEY = ['channels'] as const;

export function useChannels() {
  return useQuery({
    queryKey: CHANNEL_QUERY_KEY,
    queryFn: ({ signal }) => channelApi.getAll(signal),
  });
}

// ✅ S-17: mutationFn만 정의, onSuccess는 사용처에서
export function useCreateChannel() {
  return useMutation({
    mutationFn: (input: CreateChannelInput) => channelApi.create(input),
  });
}
