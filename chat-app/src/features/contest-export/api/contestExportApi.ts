// A-06: httpClient 래퍼만 import
// A-05: 비즈니스 로직 없음 — 데이터 접근만

import { httpClient } from '@/shared/lib/httpClient';
import type { ContestExportData } from '../model/types';

export const contestExportApi = {
  getExportData: (channelId: string, signal?: AbortSignal): Promise<ContestExportData> =>
    httpClient.get(`/api/channels/${channelId}/contest-export`, { signal }),
};
