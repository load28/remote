# useQuery vs useSuspenseQuery — "이전 화면 유지"의 두 패턴

> 같은 UX(검색어가 바뀌어도 이전 결과가 화면에 남아있는 동작)를 구현하는 두 가지 접근법을,
> **"이전 것"을 어느 레이어가 보존하느냐**의 관점에서 정리한 문서.

---

## 목차

1. [핵심 요약](#1-핵심-요약)
2. [책임 분리 다이어그램](#2-책임-분리-다이어그램)
3. [패턴 A — useQuery + placeholderData (데이터 레이어)](#3-패턴-a--usequery--placeholderdata-데이터-레이어)
4. [패턴 B — useSuspenseQuery + useDeferredValue (렌더 레이어)](#4-패턴-b--usesuspensequery--usedeferredvalue-렌더-레이어)
5. [왜 `useSuspenseQuery`는 `placeholderData`를 지원하지 않는가](#5-왜-usesuspensequery는-placeholderdata를-지원하지-않는가)
6. [첫 진입 시 동작 비교](#6-첫-진입-시-동작-비교)
7. [SSR / RSC 친화성](#7-ssr--rsc-친화성)
8. [선택 가이드](#8-선택-가이드)

---

## 1. 핵심 요약

| 구분 | 패턴 A | 패턴 B |
|------|--------|--------|
| 훅 | `useQuery` | `useSuspenseQuery` |
| "이전 것"의 정체 | **이전 `data` 값** | **이전 committed tree** |
| 보존 주체 | React Query (라이브러리) | React (렌더러) |
| 핵심 옵션/API | `placeholderData` (구 `keepPreviousData`) | `useDeferredValue` + `<Suspense>` |
| 반환 방식 | 동기로 이전 값 반환 | 준비 안 되면 Promise throw |
| React transition 필요성 | 불필요 | 필수 (deferred value가 transition lane 사용) |

> **한 줄 요약**
> - 패턴 A: 라이브러리가 **데이터**를 들고 있다가 동기로 돌려준다.
> - 패턴 B: 라이브러리는 그냥 throw하고, React가 **이전 렌더 결과(tree)** 를 화면에 유지한다.

---

## 2. 책임 분리 다이어그램

```
┌────────────────────────────────────────────────────┐
│                     컴포넌트                         │
│                                                    │
│   data는 "이전 값이 남아있는" 것처럼 보임             │ ← 같은 UX
│                                                    │
├─────────── 패턴 A ──────┬────── 패턴 B ─────────────┤
│                         │                          │
│  React Query 내부에      │  React 렌더 레이어        │
│  이전 `data` 값 저장     │  이전 committed tree 유지  │
│  (isPlaceholderData)    │  (transition + Suspense) │
│                         │                          │
│  Suspense 무관           │  useDeferredValue 필요    │
│  use() 무관              │  useSuspenseQuery가 throw │
└─────────────────────────┴──────────────────────────┘
```

---

## 3. 패턴 A — useQuery + placeholderData (데이터 레이어)

React Query가 쿼리 키가 바뀌었을 때 **이전 쿼리의 `data`를 복사해 동기로 즉시 반환**한다.
React는 이 과정에 개입하지 않는다. 그냥 state가 바뀌어 리렌더가 여러 번 일어날 뿐.

### 3.1 렌더 타임라인

```
render N:   useQuery({ queryKey: ["search", "vue"] })
            → { data: vueResults, isPlaceholderData: false }

render N+1: queryKey가 ["search", "react"]로 변경
            → React Query가 이전 데이터를 복사해 placeholder로 넘김
            → { data: vueResults, isPlaceholderData: true }  ← 동기 반환
            → 백그라운드에서 fetch("react")

render N+2: fetch 완료
            → { data: reactResults, isPlaceholderData: false }
```

### 3.2 특징

- **Suspense 무관.** `<Suspense>` 경계가 없어도 동작한다.
- **`use()` 무관.** Promise throw도, transition lane 진입도 없다.
- 개발자가 `isLoading` / `isPlaceholderData` 상태를 직접 다뤄야 한다.
- 순수 클라이언트 state 로직이라 SSR 시 별도 dehydrate/hydrate가 필요하다.

### 3.3 예시 시그니처

```ts
const { data, isPlaceholderData } = useQuery({
  queryKey: ["search", query],
  queryFn: () => fetchSearch(query),
  placeholderData: (prev) => prev, // 이전 쿼리 결과를 그대로 유지
});
```

---

## 4. 패턴 B — useSuspenseQuery + useDeferredValue (렌더 레이어)

`useSuspenseQuery`는 데이터가 없으면 **무조건 Promise를 throw**한다.
이전 값을 보존하는 책임은 전적으로 React가 진다 — `useDeferredValue`로 만든 transition 안에서 **이전 committed tree를 그대로 화면에 유지**한다.

### 4.1 렌더 타임라인

```
render N:   useSuspenseQuery(["search", "vue"])
            → Promise resolve 대기 (Suspense throw)
            → 완료 → vueResults 반환 → tree A 커밋

render N+1: debounced="react", deferred는 아직 "vue" (transition 시작)
            deferred="react"로 백그라운드 재렌더 시작
            useSuspenseQuery(["search", "react"]) throws promise
            → transition이라 tree A를 화면에 계속 유지
            → fallback 안 보임 ← React의 "이전 tree 유지" 마법

render N+2: fetch 완료 → 백그라운드 렌더 완성 → tree B 커밋 swap
```

### 4.2 특징

- React Query는 단순히 Promise를 throw할 뿐, 이전 값을 들고 있지 않는다.
- 이전 화면이 남는 이유는 **React가 committed tree를 직접 관리**하기 때문이다.
- `useDeferredValue`가 입력값을 transition lane에 넘겨주어 Suspense fallback이 뜨지 않도록 막아준다.
- 로딩 상태 처리는 `<Suspense fallback>` 경계 하나로 끝난다.

### 4.3 예시 시그니처

```ts
const deferredQuery = useDeferredValue(query);
const { data } = useSuspenseQuery({
  queryKey: ["search", deferredQuery],
  queryFn: () => fetchSearch(deferredQuery),
});
```

---

## 5. 왜 `useSuspenseQuery`는 `placeholderData`를 지원하지 않는가

`useSuspenseQuery`는 계약 상 **데이터가 없으면 반드시 throw**해야 한다.
만약 `placeholderData`를 허용한다면,

- throw 할 것인가?
- placeholder 값을 반환할 것인가?

둘 중 하나를 고를 수 없는 모순이 생긴다. 그래서 API는 **둘 중 하나만** 허용한다 — suspend **또는** placeholder, 같이는 안 됨.

> 그 결과 패턴 B는 라이브러리가 이전 값을 줄 수 없으므로,
> React(`useDeferredValue`)가 대신 "이전 화면 유지"를 담당한다.

---

## 6. 첫 진입 시 동작 비교

| | 패턴 A (`useQuery`) | 패턴 B (`useSuspenseQuery`) |
|---|---|---|
| 첫 렌더 | `data: undefined`, `isLoading: true` | Suspense fallback (throw) |
| 개발자가 다뤄야 할 것 | `if (isLoading) return <Spinner />` | `<Suspense>` 경계 하나 배치 |
| 이후 재조회 시 이전 값 | 라이브러리가 동기 반환 | React가 이전 tree 유지 |

패턴 B는 "로딩 UI가 컴포넌트 내부 분기문이 아니라 트리 구조(Suspense 경계)로 올라간다"는 점이 핵심.

---

## 7. SSR / RSC 친화성

### 패턴 A
- 순수 클라이언트 state 로직.
- SSR 시 `dehydrate` / `hydrate`로 QueryClient를 서버→클라이언트 이동시켜야 한다.
- 초기 상태 구성이 수동.

### 패턴 B
- Suspense 기반이라 **Streaming SSR**과 **RSC**에 자연스럽게 호환된다.
- Next.js App Router와 궁합이 좋다 — 서버에서 throw된 Promise가 스트림 조각으로 흘러가고, 클라이언트에서 resume된다.
- "data fetching = Suspense" 라는 React의 장기 방향과 일치.

---

## 8. 선택 가이드

| 상황 | 추천 |
|------|------|
| 레거시 프로젝트, Suspense 경계 구성이 어려운 환경 | 패턴 A |
| `isLoading` / `isError` 플래그를 컴포넌트 내부에서 세밀하게 다뤄야 하는 UX | 패턴 A |
| Next.js App Router, RSC, Streaming SSR | 패턴 B |
| 로딩 UI를 트리 구조(경계)로 끌어올려 선언적으로 다루고 싶을 때 | 패턴 B |
| 동일 화면 안에서 여러 쿼리의 로딩 상태를 하나의 fallback으로 묶고 싶을 때 | 패턴 B |

---

## 부록 — 한 문장으로 기억하기

> **"이전 것"의 본체가 `데이터`냐 `렌더 결과`냐 — 그것이 본질적 차이다.**
>
> - 패턴 A는 **React Query가 이전 `data` 값을 내장**하고 동기로 돌려준다. React는 그걸 그냥 렌더할 뿐.
> - 패턴 B는 **React Query는 그냥 throw**. React가 **이전 committed tree**를 transition lane으로 유지한다.
