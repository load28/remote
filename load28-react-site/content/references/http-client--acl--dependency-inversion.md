---
tags: [http-client, acl, dependency-inversion, api-layer, interface]
rules: [A-09, A-06]
description: Anti-Corruption Layer — HTTP 클라이언트 래퍼 + 구현체 교체 가능
---

```tsx
// shared/lib/httpClient.ts — 이 파일만 HTTP 라이브러리를 알고 있음

import axios from 'axios';

// ✅ 인터페이스: 구현체 교체 가능 (A-06)
export interface HttpClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data: unknown, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data: unknown, config?: RequestConfig): Promise<T>;
  patch<T>(url: string, data: unknown, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
}

export interface RequestConfig {
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

// ✅ 구현체: 교체 시 이 파일만 수정 (A-09)
export const httpClient: HttpClient = {
  get: (url, config) =>
    axios.get(url, { signal: config?.signal, params: config?.params }).then(r => r.data),
  post: (url, data, config) =>
    axios.post(url, data, { signal: config?.signal }).then(r => r.data),
  put: (url, data, config) =>
    axios.put(url, data, { signal: config?.signal }).then(r => r.data),
  patch: (url, data, config) =>
    axios.patch(url, data, { signal: config?.signal }).then(r => r.data),
  delete: (url, config) =>
    axios.delete(url, { signal: config?.signal }).then(r => r.data),
};
```
