// 레퍼런스: crud/hook--tanstack-query--abort.md
// S-04: TanStack Query 사용 (수동 fetch 패턴 미사용)
// A-07: api 내부 경로를 직접 노출하지 않고 훅으로 래핑

import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/authApi';

// ✅ P-03: 모듈 레벨 상수
const APP_CONFIG_QUERY_KEY = ['app', 'config'];

// ✅ N-05: use + 동사
export function useAppConfig() {
  return useQuery({
    queryKey: APP_CONFIG_QUERY_KEY,
    queryFn: ({ signal }) => authApi.getConfig(signal),
  });
}
