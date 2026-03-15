// 레퍼런스: crud/api-layer--http-client.md
// A-06: httpClient 래퍼만 import
// P-13: AbortController 비동기 취소 지원

import { httpClient } from '@/shared/lib/httpClient';
import type { Notification } from '../types';

export const notificationApi = {
  getAll: (userId: string, signal?: AbortSignal): Promise<Notification[]> =>
    httpClient.get('/api/notifications', {
      params: { userId },
      signal,
    }),

  markAsRead: (id: string, signal?: AbortSignal): Promise<Notification> =>
    httpClient.put(`/api/notifications/${id}/read`, {}, { signal }),

  markAllAsRead: (userId: string, signal?: AbortSignal): Promise<void> =>
    httpClient.put('/api/notifications/read-all', {}, {
      params: { userId },
      signal,
    }),
};
