---
tags: [startTransition, ref, debounce, state, hook, custom-hook]
rules: [P-11, P-12, S-11]
description: startTransition — 검색 입력 긴급/비긴급 업데이트 분리
---

```tsx
// ✅ 검색 입력: 입력 즉시 반영, 결과 필터링은 비긴급

import { useState, useRef, startTransition, type ChangeEvent } from 'react';

export function useFilteredSearch<T>(
  items: T[],
  filterFn: (items: T[], query: string) => T[],
) {
  const [query, setQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState(items);
  // ✅ 빈번 변경값: ref (P-12)
  const lastInputTime = useRef(0);

  const handleQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    lastInputTime.current = Date.now();

    setQuery(value);                                      // 긴급: 입력 반영
    startTransition(() => {                               // ✅ 비긴급 (P-11)
      setFilteredResults(filterFn(items, value));
    });
  };

  return { query, filteredResults, handleQueryChange };
}
```
