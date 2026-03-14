---
tags: [state, derived-state, useMemo, hook, tanstack-query, event-naming]
rules: [S-02, S-03, S-04, S-06, S-08, S-09, P-03, N-06]
description: 파생 상태 + 함수형 setState — 목록 필터링/페이지네이션 패턴
---

```tsx
// 일반화된 목록 필터링 페이지 패턴

import { useState, useMemo } from 'react';

// ✅ 모듈 레벨 상수 (P-03, N-06)
const EMPTY_ITEMS: readonly string[] = [];
const ITEMS_PER_PAGE = 20;

interface Item {
  id: string;
  label: string;
  category: string;
  isActive: boolean;
}

export function FilterableListPage() {
  // ✅ 클라이언트 상태 (S-09: 사용처 가까이 배치)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  // ✅ 서버 상태: TanStack Query (S-04, S-08)
  const { data: items = EMPTY_ITEMS } = useItems();

  // ✅ 파생 값: state가 아닌 계산 (S-03)
  // ✅ 비용이 크면 useMemo (S-02: useEffect 내 계산 금지)
  const filteredItems = useMemo(
    () =>
      items
        .filter(item => (selectedCategory ? item.category === selectedCategory : true))
        .filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase())),
    [items, selectedCategory, searchQuery],
  );

  const paginatedItems = useMemo(
    () => filteredItems.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE),
    [filteredItems, page],
  );

  // ✅ 파생 값: 별도 state 불필요
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const hasNextPage = page < totalPages - 1;

  // ✅ 함수형 setState (S-06)
  const handleNextPage = () => setPage(prev => Math.min(prev + 1, totalPages - 1));
  const handlePrevPage = () => setPage(prev => Math.max(prev - 1, 0));

  // 필터 변경 시 페이지 리셋
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setPage(0);
  };

  return (
    <main>
      <SearchInput value={searchQuery} onChange={setSearchQuery} />
      <CategoryFilter selected={selectedCategory} onChange={handleCategoryChange} />
      <ItemList items={paginatedItems} />
      <Pagination
        page={page}
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        onNext={handleNextPage}
        onPrev={handlePrevPage}
      />
    </main>
  );
}
```
