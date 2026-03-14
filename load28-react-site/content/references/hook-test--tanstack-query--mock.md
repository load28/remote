---
tags: [hook-test, tanstack-query, mock, provider, component]
rules: [T-02]
description: 훅 테스트 + QueryClient 래퍼 — renderHook + waitFor 패턴
---

```tsx
// shared/testing/createQueryWrapper.tsx — 범용 테스트 래퍼

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

// 사용
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryWrapper } from '@/shared/testing/createQueryWrapper';

test('useResourceList returns data', async () => {
  const { result } = renderHook(
    () => useResourceList(['entities'], entityApi.getAll),
    { wrapper: createQueryWrapper() },
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual(mockEntities);
});
```
