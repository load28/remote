# 레퍼런스 코드 카탈로그

> **사용법:** 코드 작성 전 해당 복잡도 레벨과 패턴을 참조하여 작성한다.
> 모든 예시는 도메인 비종속 — 어떤 프로젝트에도 적용 가능한 일반화된 패턴이다.

---

## LEVEL 1: 기본 컴포넌트

### 1-1. Presentational 컴포넌트 (C-07, C-10, N-01~04, T-13)

```tsx
// {Feature}/components/StatusBadge.tsx

import type { ReactNode } from 'react';

// ✅ discriminated union props (T-14)
export type StatusBadgeProps =
  | { variant: 'success'; label: string }
  | { variant: 'error'; label: string; code: number }
  | { variant: 'loading' };

// ✅ PascalCase (N-01), 파일당 1 exported 컴포넌트 (C-10)
export function StatusBadge(props: StatusBadgeProps) {
  switch (props.variant) {
    case 'success':
      return <span role="status" className="badge-success">{props.label}</span>;
    case 'error':
      return (
        <span role="alert" className="badge-error">
          [{props.code}] {props.label}
        </span>
      );
    case 'loading':
      return <span role="status" aria-busy="true">Loading...</span>;
  }
}
```

### 1-2. 인터랙티브 컴포넌트 (N-03, C-04, T-11)

```tsx
// shared/components/ActionCard.tsx

export interface ActionCardProps {
  title: string;
  description: string;
  isDisabled: boolean;           // ✅ Boolean: is 접두사 (N-04)
  onAction: () => void;          // ✅ props 이벤트: on 접두사 (N-03)
  onDismiss: () => void;
}

export function ActionCard({
  title,
  description,
  isDisabled,
  onAction,
  onDismiss,
}: ActionCardProps) {
  // ✅ 내부 핸들러: handle 접두사 (N-03)
  const handleAction = () => {
    if (!isDisabled) onAction();
  };

  return (
    <article aria-labelledby="card-title">
      <h3 id="card-title">{title}</h3>
      <p>{description}</p>
      <footer>
        {/* ✅ 시맨틱 HTML (T-11) */}
        <button onClick={onDismiss} type="button">닫기</button>
        <button onClick={handleAction} disabled={isDisabled} type="button">
          실행
        </button>
      </footer>
    </article>
  );
}
```

---

## LEVEL 2: 상태관리 패턴

### 2-1. 파생 상태 + 함수형 setState (S-02, S-03, S-06)

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

### 2-2. Ref vs State 구분 (S-11, S-12, P-12)

```tsx
// 범용 타이머/빈번 변경값 패턴

import { useState, useRef, useEffect, useCallback } from 'react';

export function useInterval(callback: () => void, delayMs: number | null) {
  // ✅ 렌더에 안 쓰이는 값 → ref (S-11)
  const savedCallback = useRef(callback);
  const intervalId = useRef<number | null>(null);

  // ✅ ref는 즉시 반영 (S-12)
  savedCallback.current = callback;

  useEffect(() => {
    if (delayMs === null) return;

    intervalId.current = window.setInterval(() => savedCallback.current(), delayMs);

    // ✅ cleanup (S-16)
    return () => {
      if (intervalId.current !== null) clearInterval(intervalId.current);
    };
  }, [delayMs]);

  const stop = useCallback(() => {
    if (intervalId.current !== null) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
  }, []);

  return { stop };
}

// 빈번 변경값: 스크롤, 마우스 좌표 등 (P-12)
export function useLatestValue<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;         // 리렌더 없이 최신 값 유지
  return ref;
}
```

### 2-3. Lazy State 초기화 (S-10)

```tsx
// 범용 localStorage 동기화 훅

const STORAGE_VERSION = 1;

export function usePersistedState<T>(key: string, defaultValue: T) {
  const versionedKey = `${key}_v${STORAGE_VERSION}`;  // ✅ 스키마 버전 (S-15)

  // ✅ lazy 초기화: 초기 렌더에서만 실행 (S-10)
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(versionedKey);
      return stored ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(versionedKey, JSON.stringify(state));
  }, [versionedKey, state]);

  return [state, setState] as const;
}
```

---

## LEVEL 3: 커스텀 훅 + 서버 상태

### 3-1. CRUD 훅 패턴 (S-04, S-08, N-05, P-13)

```tsx
// {Feature}/hooks/useResource.ts — 범용 CRUD 훅 패턴

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

export function useResourceMutation<T, Input>(
  queryKey: string[],
  mutationFn: (input: Input) => Promise<T>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
```

### 3-2. 검색 + 디바운스 훅 (P-13, S-16)

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

---

## LEVEL 4: API 레이어 + 의존성 역전

### 4-1. Anti-Corruption Layer (A-09, A-06)

```tsx
// shared/lib/httpClient.ts — 이 파일만 HTTP 라이브러리를 알고 있음

import axios from 'axios';

// ✅ 인터페이스: 구현체 교체 가능 (A-06)
export interface HttpClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data: unknown, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data: unknown, config?: RequestConfig): Promise<T>;
  patch<T>(url: string, data: unknown, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
}

export interface RequestConfig {
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

// ✅ 구현체: 교체 시 이 파일만 수정 (A-09)
export const httpClient: HttpClient = {
  get: (url, config) =>
    axios.get(url, { signal: config?.signal, params: config?.params }).then(r => r.data),
  post: (url, data, config) =>
    axios.post(url, data, { signal: config?.signal }).then(r => r.data),
  put: (url, data, config) =>
    axios.put(url, data, { signal: config?.signal }).then(r => r.data),
  patch: (url, data, config) =>
    axios.patch(url, data, { signal: config?.signal }).then(r => r.data),
  delete: (url, config) =>
    axios.delete(url, { signal: config?.signal }).then(r => r.data),
};
```

### 4-2. Feature API 모듈 (A-05, A-06)

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

### 4-3. 비즈니스 로직 분리 (A-05)

```tsx
// {Feature}/domain/{feature}Rules.ts
// ✅ React import 없음 → 순수 함수 → 단위 테스트 용이

export interface Entity {
  id: string;
  status: 'draft' | 'active' | 'archived';
  priority: number;
  createdAt: string;
}

// 순수 함수: 필터, 정렬, 유효성 검증, 계산
export function filterByStatus(entities: Entity[], status: Entity['status']): Entity[] {
  return entities.filter(e => e.status === status);
}

export function sortByPriority(entities: Entity[]): Entity[] {
  return [...entities].sort((a, b) => b.priority - a.priority);
}

export function calculateActiveRate(entities: Entity[]): number {
  if (entities.length === 0) return 0;
  return filterByStatus(entities, 'active').length / entities.length;
}

export function canTransition(from: Entity['status'], to: Entity['status']): boolean {
  const allowed: Record<Entity['status'], Entity['status'][]> = {
    draft: ['active'],
    active: ['archived'],
    archived: ['draft'],
  };
  return allowed[from].includes(to);
}
```

```tsx
// {Feature}/domain/{feature}Rules.test.ts

import { filterByStatus, canTransition, calculateActiveRate } from './{feature}Rules';

const entities: Entity[] = [
  { id: '1', status: 'active', priority: 3, createdAt: '2024-01-01' },
  { id: '2', status: 'draft', priority: 1, createdAt: '2024-01-02' },
  { id: '3', status: 'active', priority: 2, createdAt: '2024-01-03' },
];

test('filterByStatus returns matching entities', () => {
  expect(filterByStatus(entities, 'active')).toHaveLength(2);
});

test('calculateActiveRate computes ratio', () => {
  expect(calculateActiveRate(entities)).toBeCloseTo(0.667, 2);
});

test('calculateActiveRate returns 0 for empty', () => {
  expect(calculateActiveRate([])).toBe(0);
});

test('canTransition validates allowed transitions', () => {
  expect(canTransition('draft', 'active')).toBe(true);
  expect(canTransition('draft', 'archived')).toBe(false);
});
```

---

## LEVEL 5: Context + Provider 패턴

### 5-1. 타입 안전 Context Factory (S-07, S-14)

```tsx
// shared/lib/createSafeContext.ts
// ✅ 범용 Context 생성기 — 모든 Provider에 재사용

import { createContext, useContext } from 'react';

export function createSafeContext<T>(displayName: string) {
  const Context = createContext<T | null>(null);
  Context.displayName = displayName;

  function useSafeContext(): T {
    const ctx = useContext(Context);
    if (ctx === null) {
      throw new Error(`use${displayName} must be used within ${displayName}Provider`);
    }
    return ctx;
  }

  return [Context.Provider, useSafeContext] as const;
}
```

### 5-2. 분리된 Context Provider (S-07, S-14)

```tsx
// app/providers/AuthProvider.tsx

import { useState, useMemo, useCallback } from 'react';
import type { PropsWithChildren } from 'react';
import { createSafeContext } from '@/shared/lib/createSafeContext';

interface AuthState {
  userId: string | null;
  role: 'admin' | 'member' | 'guest';
}

interface AuthActions {
  signIn: (userId: string, role: AuthState['role']) => void;
  signOut: () => void;
}

// ✅ 읽기/쓰기 Context 분리 → 읽기만 하는 컴포넌트는 actions 변경에 리렌더 안 됨
const [AuthStateProvider, useAuthState] = createSafeContext<AuthState>('AuthState');
const [AuthActionsProvider, useAuthActions] = createSafeContext<AuthActions>('AuthActions');

export { useAuthState, useAuthActions };

export function AuthProvider({ children }: PropsWithChildren) {
  const [auth, setAuth] = useState<AuthState>({ userId: null, role: 'guest' });

  // ✅ actions는 useCallback으로 안정 참조 (S-14)
  const signIn = useCallback((userId: string, role: AuthState['role']) => {
    setAuth({ userId, role });
  }, []);

  const signOut = useCallback(() => {
    setAuth({ userId: null, role: 'guest' });
  }, []);

  // ✅ Provider value useMemo (S-14)
  const stateValue = useMemo(() => auth, [auth]);
  const actionsValue = useMemo(() => ({ signIn, signOut }), [signIn, signOut]);

  return (
    <AuthStateProvider value={stateValue}>
      <AuthActionsProvider value={actionsValue}>
        {children}
      </AuthActionsProvider>
    </AuthStateProvider>
  );
}
```

---

## LEVEL 6: 합성 + 고급 컴포넌트 패턴

### 6-1. Compound Component (C-09)

```tsx
// shared/components/DataTable/DataTable.tsx

import { createContext, useContext, useMemo } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';

// ✅ 제네릭 Compound Component — 어떤 데이터 타입이든 적용 가능

interface DataTableContextValue<T> {
  data: T[];
  sortField: string | null;
  onSort: (field: string) => void;
}

const DataTableContext = createContext<DataTableContextValue<unknown> | null>(null);

function useDataTable<T>() {
  const ctx = useContext(DataTableContext) as DataTableContextValue<T> | null;
  if (!ctx) throw new Error('DataTable compounds must be within <DataTable>');
  return ctx;
}

// Root
export interface DataTableProps<T> extends PropsWithChildren {
  data: T[];
  sortField?: string | null;
  onSort?: (field: string) => void;
}

export function DataTable<T>({ data, sortField = null, onSort, children }: DataTableProps<T>) {
  const value = useMemo(
    () => ({ data, sortField, onSort: onSort ?? (() => {}) }),
    [data, sortField, onSort],
  );

  return (
    <DataTableContext.Provider value={value}>
      <table role="grid">{children}</table>
    </DataTableContext.Provider>
  );
}

// Header
function Header({ children }: PropsWithChildren) {
  return <thead><tr>{children}</tr></thead>;
}

// Column
interface ColumnProps {
  field: string;
  label: string;
  isSortable?: boolean;
}

function Column({ field, label, isSortable = false }: ColumnProps) {
  const { sortField, onSort } = useDataTable();
  const isActive = sortField === field;

  return (
    <th
      scope="col"
      aria-sort={isActive ? 'ascending' : undefined}
      onClick={isSortable ? () => onSort(field) : undefined}
      style={isSortable ? { cursor: 'pointer' } : undefined}
    >
      {label}
      {isActive ? ' ↑' : ''}
    </th>
  );
}

// Body
interface BodyProps<T> {
  renderRow: (item: T, index: number) => ReactNode;
}

function Body<T>({ renderRow }: BodyProps<T>) {
  const { data } = useDataTable<T>();
  return <tbody>{data.map((item, i) => renderRow(item, i))}</tbody>;
}

// 합성 패턴 노출
DataTable.Header = Header;
DataTable.Column = Column;
DataTable.Body = Body;
```

사용:
```tsx
<DataTable data={users} sortField={sortBy} onSort={setSortBy}>
  <DataTable.Header>
    <DataTable.Column field="name" label="이름" isSortable />
    <DataTable.Column field="email" label="이메일" />
    <DataTable.Column field="role" label="역할" isSortable />
  </DataTable.Header>
  <DataTable.Body renderRow={(user) => (
    <tr key={user.id}>
      <td>{user.name}</td>
      <td>{user.email}</td>
      <td>{user.role}</td>
    </tr>
  )} />
</DataTable>
```

### 6-2. Render Props + children 합성 (C-08)

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

사용:
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

---

## LEVEL 7: 성능 최적화 패턴

### 7-1. 가상화 리스트 (P-02)

```tsx
// shared/components/VirtualList.tsx
// ✅ 제네릭 가상화 리스트 — 50+ 항목에 사용

import { useRef, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

// ✅ 모듈 레벨 상수 (P-03)
const DEFAULT_OVERSCAN = 5;

export interface VirtualListProps<T> {
  items: T[];
  height: number;
  estimateSize: number;
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey: (item: T) => string;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  height,
  estimateSize,
  renderItem,
  getItemKey,
  overscan = DEFAULT_OVERSCAN,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return (
    <div ref={parentRef} role="list" style={{ overflow: 'auto', height }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => {
          const item = items[virtualRow.index];
          return (
            <div
              key={getItemKey(item)}
              role="listitem"
              style={{
                position: 'absolute',
                top: virtualRow.start,
                height: virtualRow.size,
                width: '100%',
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 7-2. Dynamic Import + Suspense (P-08)

```tsx
// ✅ 무거운 컴포넌트를 lazy로 분리 — 메인 번들 축소

import { lazy, Suspense, useState } from 'react';

// 코드 스플리팅: 필요 시에만 로드
const RichTextEditor = lazy(() => import('../components/RichTextEditor'));
const ChartPanel = lazy(() => import('../components/ChartPanel'));
const PDFExporter = lazy(() => import('../components/PDFExporter'));

export function DashboardPage() {
  const [activePanel, setActivePanel] = useState<string | null>(null);

  return (
    <main>
      <nav>
        <button onClick={() => setActivePanel('editor')}>에디터</button>
        <button onClick={() => setActivePanel('chart')}>차트</button>
        <button onClick={() => setActivePanel('pdf')}>PDF</button>
      </nav>

      {/* ✅ 삼항 연산자 조건부 렌더 (P-04) */}
      {activePanel === 'editor' ? (
        <Suspense fallback={<PanelSkeleton />}>
          <RichTextEditor />
        </Suspense>
      ) : null}

      {activePanel === 'chart' ? (
        <Suspense fallback={<PanelSkeleton />}>
          <ChartPanel />
        </Suspense>
      ) : null}

      {activePanel === 'pdf' ? (
        <Suspense fallback={<PanelSkeleton />}>
          <PDFExporter />
        </Suspense>
      ) : null}
    </main>
  );
}
```

### 7-3. startTransition + 빈번 변경값 (P-11, P-12)

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

### 7-4. 객체 의존성 Primitive 추출 (P-14)

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

---

## LEVEL 8: 에러 처리 + 테스트

### 8-1. 3단계 에러 바운더리 (T-10)

```tsx
// shared/components/ErrorBoundary.tsx

import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';

export interface ErrorBoundaryProps extends PropsWithChildren {
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      const { fallback } = this.props;
      return typeof fallback === 'function'
        ? fallback(this.state.error, this.reset)
        : fallback;
    }
    return this.props.children;
  }
}
```

배치 패턴:
```tsx
// ✅ 3단계 배치: 에러 영향 범위 최소화 (T-10)

// 1단계: 앱 레벨
<ErrorBoundary fallback={<FullPageError />} onError={reportToMonitoring}>
  <App />
</ErrorBoundary>

// 2단계: 라우트 레벨
<ErrorBoundary fallback={(error, reset) => (
  <section role="alert">
    <p>페이지를 불러올 수 없습니다</p>
    <button onClick={reset}>다시 시도</button>
  </section>
)}>
  <Outlet />
</ErrorBoundary>

// 3단계: 위젯 레벨
<ErrorBoundary fallback={<p>이 섹션을 불러올 수 없습니다</p>}>
  <CommentSection />
</ErrorBoundary>
```

### 8-2. 사용자 관점 테스트 (T-01, T-08)

```tsx
// {Feature}/components/ActionCard.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionCard } from './ActionCard';

describe('ActionCard', () => {
  const defaultProps: ActionCardProps = {
    title: 'Test Title',
    description: 'Test Description',
    isDisabled: false,
    onAction: vi.fn(),
    onDismiss: vi.fn(),
  };

  test('displays title and description', () => {
    render(<ActionCard {...defaultProps} />);
    // ✅ 사용자 관점 쿼리: 역할 + 텍스트 (T-08)
    expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  test('calls onAction when action button clicked', async () => {
    render(<ActionCard {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: '실행' }));
    expect(defaultProps.onAction).toHaveBeenCalledOnce();
  });

  test('disables action button when isDisabled', () => {
    render(<ActionCard {...defaultProps} isDisabled />);
    expect(screen.getByRole('button', { name: '실행' })).toBeDisabled();
  });

  test('calls onDismiss when dismiss button clicked', async () => {
    render(<ActionCard {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(defaultProps.onDismiss).toHaveBeenCalledOnce();
  });
});
```

### 8-3. MSW 네트워크 모킹 (T-02)

```tsx
// shared/testing/setupMsw.ts — 범용 MSW 설정

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// ✅ 도메인 비종속: 핸들러를 외부에서 주입
export function createMockServer(...handlers: Parameters<typeof setupServer>) {
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  return server;
}

// 사용: Feature별 테스트에서
import { createMockServer } from '@/shared/testing/setupMsw';

const server = createMockServer(
  http.get('/api/entities', () => HttpResponse.json(mockEntities)),
  http.post('/api/entities', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 'new-1', ...body }, { status: 201 });
  }),
);

// 개별 테스트에서 핸들러 오버라이드
test('handles server error', async () => {
  server.use(
    http.get('/api/entities', () => HttpResponse.json(null, { status: 500 })),
  );
  // ...
});
```

### 8-4. 훅 테스트 + QueryClient 래퍼 (T-02)

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

---

## LEVEL 9: 엔터프라이즈 패턴

### 9-1. Feature 모듈 완전체

```
src/features/{feature-name}/
├── components/
│   ├── {Component}.tsx
│   └── {Component}.test.tsx           ← 소스 옆 테스트 (T-03)
├── hooks/
│   ├── use{Feature}.ts
│   └── use{Feature}.test.ts
├── api/
│   └── {feature}Api.ts               ← httpClient 래퍼만 import (A-09)
├── domain/
│   ├── {feature}Rules.ts             ← 순수 비즈니스 로직 (A-05)
│   └── {feature}Rules.test.ts
├── types.ts                           ← named exported interfaces (T-13)
└── index.ts                           ← public API barrel (A-07)
```

```tsx
// index.ts — barrel file: named export만 (P-06)
export { EntityList } from './components/EntityList';
export { EntityDetail } from './components/EntityDetail';
export { useEntities, useEntityById } from './hooks/useEntities';
export type { Entity, EntityStatus } from './types';
// 내부 domain/, api/ 는 export하지 않음 → 모듈 경계 (A-07)
```

### 9-2. 다중 Provider 조합

```tsx
// app/providers/AppProviders.tsx
// ✅ 변경 빈도별 Context 분리 (S-07)

import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './AuthProvider';
import { ThemeProvider } from './ThemeProvider';
import { NotificationProvider } from './NotificationProvider';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 2 },
    mutations: { retry: 1 },
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary fallback={<FullPageError />}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

### 9-3. key 기반 컨텍스트 전환 (C-12)

```tsx
// ✅ 범용 패턴: 엔티티 전환 시 key로 전체 상태 리셋

interface DetailPageProps {
  entityId: string;
}

// 부모: key로 인스턴스 완전 교체
function DetailPageWrapper() {
  const { entityId } = useParams<{ entityId: string }>();
  // entityId 변경 → DetailView 완전 새 인스턴스
  return <DetailView key={entityId} entityId={entityId!} />;
}

// 자식: 깨끗한 초기 상태에서 시작 — useEffect 리셋 체인 불필요
function DetailView({ entityId }: DetailPageProps) {
  const [editBuffer, setEditBuffer] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { data } = useEntityById(entityId);
  // entityId 전환 시 editBuffer='', isEditing=false로 자동 리셋
  return ( /* ... */ );
}
```

### 9-4. Controlled/Uncontrolled 명확한 택일 (S-13)

```tsx
// shared/components/FormField.tsx
// ✅ controlled / uncontrolled를 discriminated union으로 분리 (S-13, T-14)

export type FormFieldProps =
  | {
      mode: 'controlled';
      value: string;
      onChange: (value: string) => void;
    }
  | {
      mode: 'uncontrolled';
      defaultValue?: string;
      inputRef?: React.RefObject<HTMLInputElement>;
    };

export function FormField(props: FormFieldProps) {
  if (props.mode === 'controlled') {
    return (
      <input
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
      />
    );
  }

  return (
    <input
      defaultValue={props.defaultValue}
      ref={props.inputRef}
    />
  );
}
```

---

## LEVEL 10: useEffect Cleanup 총정리

```tsx
// ✅ 모든 cleanup 패턴 — 복사해서 사용

// 1. 타이머
useEffect(() => {
  const id = setInterval(callback, intervalMs);
  return () => clearInterval(id);
}, [callback, intervalMs]);

// 2. 이벤트 리스너
useEffect(() => {
  const handler = (e: Event) => { /* ... */ };
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);

// 3. 구독
useEffect(() => {
  const subscription = observable.subscribe(handleNext);
  return () => subscription.unsubscribe();
}, [observable, handleNext]);

// 4. fetch (AbortController)
useEffect(() => {
  const controller = new AbortController();
  fetchData(controller.signal).then(setData).catch(e => {
    if (e.name !== 'AbortError') throw e;
  });
  return () => controller.abort();
}, [fetchData]);

// 5. WebSocket
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = (e) => handleMessage(JSON.parse(e.data));
  ws.onerror = (e) => handleError(e);
  return () => {
    if (ws.readyState === WebSocket.OPEN) ws.close();
  };
}, [url]);

// 6. IntersectionObserver
useEffect(() => {
  if (!elementRef.current) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => setIsVisible(entry.isIntersecting));
  }, { threshold: 0.1 });
  observer.observe(elementRef.current);
  return () => observer.disconnect();
}, []);

// 7. ResizeObserver
useEffect(() => {
  if (!elementRef.current) return;
  const observer = new ResizeObserver(entries => {
    const { width, height } = entries[0].contentRect;
    sizeRef.current = { width, height };
  });
  observer.observe(elementRef.current);
  return () => observer.disconnect();
}, []);
```
