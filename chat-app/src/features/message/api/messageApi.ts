// A-06: httpClient 래퍼만 import

import { httpClient } from '@/shared/lib/httpClient';
import type { Message } from '../types';

export const messageApi = {
  getByChannel: (channelId: string, signal?: AbortSignal): Promise<Message[]> =>
    httpClient.get(`/api/channels/${channelId}/messages`, { signal }),

  send: (channelId: string, content: string, userId: string): Promise<Message> =>
    httpClient.post(`/api/channels/${channelId}/messages`, { content, userId }),
};
