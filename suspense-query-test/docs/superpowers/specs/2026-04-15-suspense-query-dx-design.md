# Suspense Query DX 개선 설계

## 문제

현재 인증이 필요한 API에서 `useSuspenseQuery`를 사용하려면:

1. `queries.ts`에 쿼리 옵션 정의 (클라이언트용 queryFn)
2. `page.tsx`에서 QueryClient 생성 + prefetchQuery (서버용 queryFn 별도 작성) + dehydrate + HydrationBoundary + Suspense
3. 클라이언트 컴포넌트에서 useSuspenseQuery

같은 데이터인데 queryFn을 2번 작성해야 하고, 매번 HydrationBoundary 보일러플레이트를 반복해야 한다.

## 목표

- 새 API 추가 시: `endpoint`와 `auth` 플래그만 정의 (queryFn 작성 0회)
- 서버 컴포넌트: `prefetchAll([...queries])` 한 줄로 prefetch
- 클라이언트 컴포넌트: `useSuspenseQuery(query.options)` 한 줄로 사용

## 설계

### 1. `createQuery` — 쿼리 정의 팩토리

파일: `src/lib/query/create-query.ts`

```tsx
export const postsQuery = createQuery({
  key: ["posts"],
  endpoint: "/posts?_limit=5",
  auth: true,
});
```

`createQuery`가 반환하는 객체:

```tsx
{
  // 클라이언트용 — useSuspenseQuery에 그대로 전달
  options: {
    queryKey: ["posts"],
    queryFn: () => fetch("/api/proxy/posts?_limit=5").then(r => r.json()),
    staleTime: 10_000,
  },

  // 서버용 — prefetchAll 내부에서 사용
  serverQueryFn: (token?: string) =>
    fetch(`${API_BASE}/posts?_limit=5`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(r => r.json()),

  // 메타데이터
  key: ["posts"],
  endpoint: "/posts?_limit=5",
  auth: true,
}
```

인자:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `key` | `string[]` | O | TanStack Query queryKey |
| `endpoint` | `string` | O | 외부 API 경로 (쿼리 파라미터 포함 가능) |
| `auth` | `boolean` | O | 인증 필요 여부 |
| `staleTime` | `number` | X | 기본값 10초 |

내부 동작:

- `options.queryFn`: 항상 `/api/proxy/{endpoint}`로 fetch (클라이언트용)
- `serverQueryFn`: `auth: true`면 토큰을 받아서 `API_BASE/{endpoint}`로 직접 fetch, `auth: false`면 토큰 없이 fetch
- `API_BASE`는 환경 변수 `API_BASE_URL` (기본값 `https://jsonplaceholder.typicode.com`)

### 2. `prefetchAll` — 서버 컴포넌트 유틸

파일: `src/lib/query/prefetch.ts`

```tsx
export default async function DashboardPage() {
  const dehydratedState = await prefetchAll([postsQuery, commentsQuery]);

  return (
    <HydrationProvider state={dehydratedState}>
      <Suspense fallback={<Loading />}>
        <PostList />
      </Suspense>
    </HydrationProvider>
  );
}
```

`prefetchAll` 내부 동작:

1. 전달된 쿼리 중 `auth: true`인 쿼리가 있는지 확인
2. 있으면 `verifySession()` 호출하여 토큰 획득 (없으면 스킵)
3. `QueryClient` 생성
4. 각 쿼리 순회:
   - `auth: true` → `serverQueryFn(token)` 으로 prefetch
   - `auth: false` → `serverQueryFn()` 으로 prefetch (토큰 없이)
5. `dehydrate(queryClient)` 반환

핵심: `verifySession()`은 `prefetchAll` 안에서 자동 호출된다. 인증 쿼리가 하나라도 있으면 토큰을 가져오고, 없으면 가져오지 않는다. QueryClient 생성/dehydrate도 내부 처리.

### 3. `HydrationProvider` — HydrationBoundary 래퍼

파일: `src/providers/hydration-provider.tsx`

`HydrationBoundary`를 감싸는 클라이언트 컴포넌트. `dehydratedState`를 전달받아 `HydrationBoundary`에 넘기는 것이 전부.

Suspense 바운더리는 개발자가 직접 배치한다. 어떤 컴포넌트를 어떤 단위로 묶을지, fallback을 무엇으로 할지는 UI 관심사.

### 4. 타입 정의

파일: `src/lib/query/types.ts`

```tsx
interface QueryDefinition<T = unknown> {
  key: string[];
  endpoint: string;
  auth: boolean;
  staleTime?: number;
  options: {
    queryKey: string[];
    queryFn: () => Promise<T>;
    staleTime: number;
  };
  serverQueryFn: (token?: string) => Promise<T>;
}

interface CreateQueryInput {
  key: string[];
  endpoint: string;
  auth: boolean;
  staleTime?: number;
}
```

## 데이터 흐름

### 초기 로드 (SSR)

```
브라우저 → Next.js 서버
  → prefetchAll 내부:
      verifySession() → 쿠키에서 토큰
      postsQuery.serverQueryFn(token) → 외부 API 직접 호출
      commentsQuery.serverQueryFn() → 외부 API 직접 호출 (토큰 없이)
      dehydrate → 데이터만 클라이언트에 전달
  → useSuspenseQuery → 캐시 히트 → queryFn 실행 안 함
  → 완성된 HTML 응답
```

### 클라이언트 refetch

```
브라우저 → fetch("/api/proxy/posts")
  → Proxy: 쿠키에서 토큰 → Authorization 헤더 주입
  → rewrites → 외부 API
  → 응답
```

## 파일 구조

```
src/
├── lib/
│   ├── dal.ts                          (기존 유지)
│   ├── query/
│   │   ├── create-query.ts             (신규) createQuery 팩토리
│   │   ├── prefetch.ts                 (신규) prefetchAll 유틸
│   │   └── types.ts                    (신규) 타입 정의
│   └── queries/
│       └── posts.ts                    (기존 대체) createQuery로 재정의
├── providers/
│   ├── query-provider.tsx              (기존 유지)
│   └── hydration-provider.tsx          (신규) HydrationProvider
├── app/
│   ├── (authenticated)/
│   │   └── dashboard/
│   │       ├── page.tsx                (변경) prefetchAll 한 줄로 단순화
│   │       └── post-list.tsx           (변경) postsQuery.options 사용
│   └── ...
└── proxy.ts                            (기존 유지)
```

## 기존 코드 변경 범위

| 파일 | 변경 |
|------|------|
| `lib/queries.ts` | 삭제 → `lib/queries/posts.ts`로 이동, createQuery 방식 |
| `dashboard/page.tsx` | prefetchAll 한 줄로 단순화 |
| `dashboard/post-list.tsx` | `postsQuery.options` 사용으로 변경 |
| `dal.ts` | 변경 없음 |
| `proxy.ts` | 변경 없음 |
| `query-provider.tsx` | 변경 없음 |
| `next.config.ts` | 변경 없음 |

## 개발자 사용 예시: 새 API 추가

### Before (현재)

```tsx
// 1. queries.ts — queryFn 작성 (클라이언트용)
export const usersQueryOptions = {
  queryKey: ["users"],
  queryFn: () => fetch("/api/proxy/users").then(r => r.json()),
  staleTime: 10_000,
};

// 2. page.tsx — QueryClient + prefetch + queryFn 또 작성 (서버용) + dehydrate + HydrationBoundary
const session = await verifySession();
const queryClient = new QueryClient();
await queryClient.prefetchQuery({
  queryKey: usersQueryOptions.queryKey,
  queryFn: async () => {
    const res = await fetch(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    return res.json();
  },
});
// <HydrationBoundary state={dehydrate(queryClient)}>...

// 3. client component
const { data } = useSuspenseQuery(usersQueryOptions);
```

### After (개선)

```tsx
// 1. lib/queries/users.ts — endpoint만 정의
export const usersQuery = createQuery({
  key: ["users"],
  endpoint: "/users",
  auth: true,
});

// 2. page.tsx — 한 줄
const dehydratedState = await prefetchAll([postsQuery, usersQuery]);

// 3. client component — 한 줄
const { data } = useSuspenseQuery(usersQuery.options);
```
