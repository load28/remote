// S-04: TanStack Query 사용, P-13: signal abort
// N-05: use + 동사

import { useQuery } from '@tanstack/react-query';
import { contestExportApi } from '../api/contestExportApi';

// ✅ P-03: 모듈 레벨 상수
export const CONTEST_EXPORT_QUERY_KEY = ['contest-export'] as const;

export function useContestExport(channelId: string, isEnabled: boolean) {
  return useQuery({
    queryKey: [...CONTEST_EXPORT_QUERY_KEY, channelId],
    queryFn: ({ signal }) => contestExportApi.getExportData(channelId, signal),
    enabled: !!channelId && isEnabled,
  });
}
