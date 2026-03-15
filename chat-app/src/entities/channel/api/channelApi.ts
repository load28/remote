// A-06: httpClient 래퍼만 import, SDK 직접 import 금지

import { httpClient } from '@/shared/lib/httpClient';
import type { Channel } from '../model/types';

export const channelApi = {
  getAll: (signal?: AbortSignal): Promise<Channel[]> =>
    httpClient.get('/api/channels', { signal }),

  getById: (id: string, signal?: AbortSignal): Promise<Channel> =>
    httpClient.get(`/api/channels/${id}`, { signal }),
};
