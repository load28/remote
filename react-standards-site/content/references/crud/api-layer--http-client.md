---
tags: [api-layer, http-client, acl, dependency-inversion]
rules: [A-05, A-06]
description: Feature API 모듈 — httpClient 래퍼 기반 데이터 접근 레이어
---

```tsx
// {Feature}/api/{feature}Api.ts — 래퍼만 import, SDK 직접 import 금지

import { httpClient } from '@/shared/lib/httpClient';
import type { Entity, CreateEntityInput, UpdateEntityInput } from '../types';

// ✅ 순수 데이터 접근 레이어
// ✅ 비즈니스 로직 없음 → 요청/응답 변환만 담당
export const entityApi = {
  getAll: (signal?: AbortSignal): Promise<Entity[]> =>
    httpClient.get('/api/entities', { signal }),

  getById: (id: string, signal?: AbortSignal): Promise<Entity> =>
    httpClient.get(`/api/entities/${id}`, { signal }),

  create: (input: CreateEntityInput): Promise<Entity> =>
    httpClient.post('/api/entities', input),

  update: (id: string, input: UpdateEntityInput): Promise<Entity> =>
    httpClient.put(`/api/entities/${id}`, input),

  remove: (id: string): Promise<void> =>
    httpClient.delete(`/api/entities/${id}`),

  search: (query: string, signal?: AbortSignal): Promise<Entity[]> =>
    httpClient.get('/api/entities/search', {
      params: { q: query },
      signal,
    }),
};
```
