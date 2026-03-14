---
tags: [tanstack-query, mutation, api-layer]
rules: [S-04, S-17, N-05, P-03, P-13, A-06, A-09]
description: TanStack Query 기반 CRUD 쿼리/뮤테이션 + API 레이어 패턴
---

# TanStack Query CRUD 패턴

## API 레이어 (A-06, A-09)

```ts
// {Feature}/api/entityApi.ts
import { httpClient } from '@/shared/lib/httpClient';
import type { Entity, CreateEntityInput, UpdateEntityInput } from '../types';

export const entityApi = {
  getByParent: (parentId: string, signal?: AbortSignal): Promise<Entity[]> =>
    httpClient.get(`/api/parents/${parentId}/entities`, { signal }),

  getById: (entityId: string, signal?: AbortSignal): Promise<Entity> =>
    httpClient.get(`/api/entities/${entityId}`, { signal }),

  create: (input: CreateEntityInput, userId: string): Promise<Entity> =>
    httpClient.post('/api/entities', { ...input, userId }),

  update: (entityId: string, input: UpdateEntityInput): Promise<Entity> =>
    httpClient.put(`/api/entities/${entityId}`, input),

  delete: (entityId: string): Promise<void> =>
    httpClient.delete(`/api/entities/${entityId}`),
};
```

## Query/Mutation 훅 (S-04, S-17, N-05)

```ts
// {Feature}/hooks/useEntity.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { entityApi } from '../api/entityApi';

// P-03: 모듈 레벨 상수
export const ENTITY_QUERY_KEY = ['entities'] as const;

// P-13: signal abort
export function useEntitiesByParent(parentId: string) {
  return useQuery({
    queryKey: [...ENTITY_QUERY_KEY, parentId],
    queryFn: ({ signal }) => entityApi.getByParent(parentId, signal),
    enabled: !!parentId,
  });
}

// S-17: mutationFn만, onSuccess는 사용처에서
export function useCreateEntity(userId: string) {
  return useMutation({
    mutationFn: (input: CreateEntityInput) => entityApi.create(input, userId),
  });
}

export function useDeleteEntity() {
  return useMutation({
    mutationFn: (entityId: string) => entityApi.delete(entityId),
  });
}
```
