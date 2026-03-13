// 레퍼런스: crud/hook--tanstack-query--abort.md
// S-04: TanStack Query 사용 (수동 fetch 패턴 미사용)
// A-07: api 내부 경로를 직접 노출하지 않고 훅으로 래핑

import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/authApi';

// ✅ P-03: 모듈 레벨 상수
const RECENT_USERS_QUERY_KEY = ['auth', 'recent-users'];

// ✅ N-05: use + 동사
export function useRecentUsers() {
  return useQuery({
    queryKey: RECENT_USERS_QUERY_KEY,
    // ✅ P-13: signal 전달 → TanStack Query가 자동 abort
    queryFn: ({ signal }) => authApi.getRecentUsers(signal),
  });
}
