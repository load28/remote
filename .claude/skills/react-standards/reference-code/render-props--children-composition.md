---
tags: [render-props, children-composition, generic, component]
rules: [C-08]
description: Render Props + children 합성 — AsyncBoundary 로딩/에러/빈 상태 처리
---

```tsx
// shared/components/AsyncBoundary.tsx
// ✅ 로딩 + 에러 + 빈 상태를 선언적으로 처리하는 범용 래퍼

import type { ReactNode } from 'react';

export interface AsyncBoundaryProps<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  isEmpty?: (data: T) => boolean;
  loadingFallback: ReactNode;
  errorFallback: (error: Error) => ReactNode;
  emptyFallback?: ReactNode;
  children: (data: T) => ReactNode;          // ✅ render prop (C-08)
}

export function AsyncBoundary<T>({
  data,
  isLoading,
  error,
  isEmpty,
  loadingFallback,
  errorFallback,
  emptyFallback,
  children,
}: AsyncBoundaryProps<T>) {
  if (isLoading) return <>{loadingFallback}</>;
  if (error) return <>{errorFallback(error)}</>;
  if (!data) return null;
  if (isEmpty?.(data) && emptyFallback) return <>{emptyFallback}</>;
  return <>{children(data)}</>;
}
```

```tsx
const { data, isLoading, error } = useResourceList(['items'], itemApi.getAll);

<AsyncBoundary
  data={data}
  isLoading={isLoading}
  error={error}
  isEmpty={(items) => items.length === 0}
  loadingFallback={<Skeleton />}
  errorFallback={(err) => <ErrorMessage error={err} />}
  emptyFallback={<EmptyState message="항목이 없습니다" />}
>
  {(items) => <ItemList items={items} />}
</AsyncBoundary>
```
