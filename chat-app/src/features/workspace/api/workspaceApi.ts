// A-06: httpClient 래퍼만 import, SDK 직접 import 금지

import { httpClient } from '@/shared/lib/httpClient';
import type { Workspace } from '../types';

export const workspaceApi = {
  getAll: (signal?: AbortSignal): Promise<Workspace[]> =>
    httpClient.get('/api/workspaces', { signal }),
};
