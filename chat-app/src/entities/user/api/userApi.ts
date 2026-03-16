// A-06: httpClient 래퍼만 import

import { httpClient } from '@/shared/lib/httpClient';
import type { User } from '../model/types';

export const userApi = {
  getAll: (signal?: AbortSignal): Promise<User[]> =>
    httpClient.get('/api/users', { signal }),

  getById: (id: string, signal?: AbortSignal): Promise<User> =>
    httpClient.get(`/api/users/${id}`, { signal }),
};
