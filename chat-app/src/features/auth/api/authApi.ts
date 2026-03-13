// 레퍼런스: crud/api-layer--http-client.md
// A-06: httpClient 래퍼만 import
// P-13: AbortController 비동기 취소 지원

import { httpClient } from '@/shared/lib/httpClient';
import type { LoginCredentials, AuthResponse, RecentUser } from '../types';

// ✅ P-07: 앱 설정 API (병렬 fetch 대상)
export interface AppConfig {
  appName: string;
  version: string;
  features: { registration: boolean };
}

export const authApi = {
  login: (credentials: LoginCredentials, signal?: AbortSignal): Promise<AuthResponse> =>
    httpClient.post('/api/auth/login', credentials, { signal }),

  getRecentUsers: (signal?: AbortSignal): Promise<RecentUser[]> =>
    httpClient.get('/api/auth/recent-users', { signal }),

  getConfig: (signal?: AbortSignal): Promise<AppConfig> =>
    httpClient.get('/api/config', { signal }),
};
