---
tags: [hook, custom-hook, tanstack-query, mutation, abort, generic]
rules: [S-04, S-08, S-17, N-05, P-13]
description: CRUD 훅 패턴 — TanStack Query 기반 리소스 목록/상세/뮤테이션 (훅은 mutationFn만, 후속 로직은 사용처에서)
---

```tsx
// {Feature}/hooks/useResource.ts — 범용 CRUD 훅 패턴

import { useQuery, useMutation } from '@tanstack/react-query';

// ✅ 제네릭으로 도메인 비종속
interface ResourceApi<T, CreateInput, UpdateInput> {
  getAll: (signal?: AbortSignal) => Promise<T[]>;
  getById: (id: string, signal?: AbortSignal) => Promise<T>;
  create: (input: CreateInput) => Promise<T>;
  update: (id: string, input: UpdateInput) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

// ✅ use + 동사 (N-05)
export function useResourceList<T>(
  queryKey: string[],
  fetcher: (signal?: AbortSignal) => Promise<T[]>,
) {
  return useQuery({
    queryKey,
    // ✅ signal 전달 → TanStack Query가 자동 abort (P-13)
    queryFn: ({ signal }) => fetcher(signal),
  });
}

export function useResourceById<T>(
  queryKey: string[],
  id: string | undefined,
  fetcher: (id: string, signal?: AbortSignal) => Promise<T>,
) {
  return useQuery({
    queryKey: [...queryKey, id],
    queryFn: ({ signal }) => fetcher(id!, signal),
    enabled: !!id,          // id 없으면 비활성
  });
}

// ✅ S-17: mutation 훅은 mutationFn만 정의
// onSuccess/onError는 사용처에서 mutate(data, { onSuccess }) 로 주입
export function useResourceMutation<T, Input>(
  mutationFn: (input: Input) => Promise<T>,
) {
  return useMutation({ mutationFn });
}
```

```tsx
// 사용처 예시 — onSuccess/onError는 사용처에서 정의
const createResource = useResourceMutation(resourceApi.create);
const queryClient = useQueryClient();

createResource.mutate(input, {
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resources'] });
    closeModal();
  },
});
```
