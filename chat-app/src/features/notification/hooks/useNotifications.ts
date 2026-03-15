// 레퍼런스: crud/hook--tanstack-query--abort.md
// S-04: TanStack Query useQuery 사용
// N-05: use + 동사

import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../api/notificationApi';

// ✅ P-03: 모듈 레벨 상수
const REFETCH_INTERVAL_MS = 30000;

export function useNotifications(userId: string) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: ({ signal }) => notificationApi.getAll(userId, signal),
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}
