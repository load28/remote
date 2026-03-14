---
tags: [debounce, hook, custom-hook, cleanup, useEffect, tanstack-query, state]
rules: [P-13, S-16]
description: 검색 + 디바운스 훅 — 디바운스된 검색 입력 + TanStack Query 연동
---

```tsx
// shared/hooks/useDebouncedSearch.ts

import { useState, useEffect, useRef } from 'react';

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);  // ✅ cleanup (S-16)
  }, [value, delayMs]);

  return debouncedValue;
}

// 사용 패턴
export function useSearch<T>(
  searchFn: (query: string, signal: AbortSignal) => Promise<T[]>,
  query: string,
  debounceMs = 300,
) {
  const debouncedQuery = useDebouncedValue(query, debounceMs);

  return useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: ({ signal }) => searchFn(debouncedQuery, signal),
    enabled: debouncedQuery.length > 0,
  });
}
```
