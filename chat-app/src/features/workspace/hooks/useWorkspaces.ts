// S-04: TanStack Query 사용, S-17: mutation 훅 onSuccess 내장 금지
// N-05: use + 동사, P-13: signal abort

import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '../api/workspaceApi';

// ✅ P-03: 모듈 레벨 상수
export const WORKSPACE_QUERY_KEY = ['workspaces'] as const;

export function useWorkspaces() {
  return useQuery({
    queryKey: WORKSPACE_QUERY_KEY,
    queryFn: ({ signal }) => workspaceApi.getAll(signal),
  });
}
