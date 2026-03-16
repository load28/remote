// S-04: TanStack Query 사용, N-05: use + 동사, P-13: signal abort

import { useQuery } from '@tanstack/react-query';
import { channelApi } from '../api/channelApi';

// P-03: 모듈 레벨 상수
export const CHANNEL_QUERY_KEY = ['channels'] as const;

export function useChannels() {
  return useQuery({
    queryKey: CHANNEL_QUERY_KEY,
    queryFn: ({ signal }) => channelApi.getAll(signal),
  });
}
