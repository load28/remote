---
tags: [nuqs, url-params, state, hook, custom-hook]
rules: [S-18]
description: nuqs를 사용한 타입 안전 URL 쿼리파람 상태 관리 — Setup, searchParams 정의, useQueryStates, createSerializer, history 모드, createParser
---

## 1. Setup: NuqsAdapter 래핑 (React SPA / Vite)

```tsx
// src/main.tsx
import { NuqsAdapter } from 'nuqs/adapters/react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NuqsAdapter>
      <App />
    </NuqsAdapter>
  </StrictMode>,
);
```

## 2. searchParams 정의 객체 + inferParserType

```typescript
// features/resource/searchParams.ts
// ✅ 라우트별 단일 정의 — useQueryStates + createSerializer에서 재사용
import {
  parseAsString,
  parseAsInteger,
  parseAsStringLiteral,
  parseAsBoolean,
  type inferParserType,
} from 'nuqs';

export const resourceSearchParams = {
  q: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  sortBy: parseAsStringLiteral(['asc', 'desc'] as const).withDefault('asc'),
  isArchived: parseAsBoolean.withDefault(false),
};

// ✅ 타입 추론 — 다른 파일에서 타입으로 사용 가능
export type ResourceSearchParams = inferParserType<typeof resourceSearchParams>;
// → { q: string; page: number; sortBy: 'asc' | 'desc'; isArchived: boolean }
```

## 3. useQueryStates 훅 사용

```tsx
// features/resource/hooks/useResourceFilters.ts
import { useQueryStates } from 'nuqs';
import { resourceSearchParams } from '../searchParams';

export function useResourceFilters() {
  const [filters, setFilters] = useQueryStates(resourceSearchParams, {
    history: 'push',
  });

  // ✅ 부분 업데이트 — 나머지 파라미터 자동 보존
  // ?q=검색어&page=1&sortBy=asc 에서 page만 변경해도 q, sortBy 유지
  const handlePageChange = (page: number) => {
    setFilters({ page });
  };

  // ✅ 여러 파라미터 동시 업데이트
  const handleSearch = (query: string) => {
    setFilters({ q: query, page: 1 }); // 검색 시 page 리셋
  };

  // ✅ 전체 초기화
  const handleReset = () => {
    setFilters(null);
  };

  return { filters, handlePageChange, handleSearch, handleReset };
}
```

```tsx
// features/resource/components/ResourceList.tsx
import { useResourceFilters } from '../hooks/useResourceFilters';

export function ResourceList() {
  const { filters, handlePageChange, handleSearch, handleReset } = useResourceFilters();

  return (
    <div>
      <input
        type="search"
        value={filters.q}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="검색..."
      />
      <p>현재 페이지: {filters.page}, 정렬: {filters.sortBy}</p>
      <button type="button" onClick={handleReset}>초기화</button>
      <button type="button" onClick={() => handlePageChange(filters.page + 1)}>다음</button>
    </div>
  );
}
```

## 4. createSerializer 링크 생성

```typescript
// features/resource/searchParams.ts (동일 파일에 추가)
import { createSerializer } from 'nuqs/server';

// ✅ searchParams 정의 객체 재사용
export const serializeResourceParams = createSerializer(resourceSearchParams);

// 사용 예:
// serializeResourceParams({ q: '검색어', page: 2 })
// → "?q=검색어&page=2&sortBy=asc&isArchived=false"

// null 값은 렌더되지 않음:
// serializeResourceParams({ q: '검색어', page: null })
// → "?q=검색어&sortBy=asc&isArchived=false"
```

```tsx
// ✅ Link에서 사용 — 기존 파라미터 보존
import { serializeResourceParams } from '../searchParams';

function ResourceLink({ page }: { page: number }) {
  return (
    <a href={`/resources${serializeResourceParams({ page })}`}>
      {page}페이지
    </a>
  );
}
```

## 5. history 모드 가이드

```typescript
// replace (기본값): 브라우저 히스토리에 추가하지 않음
// → 필터 변경, 검색어 입력 등 빈번한 업데이트에 적합
const [filters, setFilters] = useQueryStates(resourceSearchParams);

// push: 브라우저 히스토리에 추가 → 뒤로 가기로 이전 상태 복원
// → 페이지네이션, 탭 전환 등 사용자가 "뒤로 가기"를 기대하는 경우
const [filters, setFilters] = useQueryStates(resourceSearchParams, {
  history: 'push',
});
```

## 6. createParser 커스텀 파서

```typescript
// shared/lib/parsers.ts
import { createParser } from 'nuqs';

// ✅ 커스텀 타입의 직렬화/역직렬화 — parse + serialize 양방향 정의
export const parseAsCommaSeparatedList = createParser<string[]>({
  parse: (value) => value.split(',').filter(Boolean),
  serialize: (value) => value.join(','),
});

// 사용:
// const [tags, setTags] = useQueryState('tags', parseAsCommaSeparatedList.withDefault([]));
// URL: ?tags=react,typescript,nuqs
// tags = ['react', 'typescript', 'nuqs']
```
