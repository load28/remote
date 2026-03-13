---
tags: [useMemo, derived-state, useEffect, state]
rules: [P-14]
description: 객체 의존성 Primitive 추출 — 안정적 useMemo 의존성 패턴
---

```tsx
// ✅ 객체/배열 의존성 → primitive로 추출

interface Filters {
  status: string;
  category: string;
  sortBy: string;
}

// ❌ BAD: 매 렌더마다 새 참조
useEffect(() => {
  fetchData(filters);
}, [filters]);

// ✅ GOOD: primitive 추출
useEffect(() => {
  fetchData({ status: filters.status, category: filters.category });
}, [filters.status, filters.category]);

// ✅ GOOD: 부모에서 안정화
const stableFilters = useMemo(
  () => ({ status, category, sortBy }),
  [status, category, sortBy],
);
```
