# React Transitions + Suspense 심층 정리

> 이 문서는 `Transition`, `Suspense`, `useDeferredValue`, 그리고 React Query를 결합한 검색 UX 최적화에 대한 대화를 **주제 기준**으로 재편집한 것입니다. 시간순 토론 흐름이 아니라 개념의 위계에 맞춰 목차를 구성했습니다.

---

## 목차

1. [Transition 기본 개념](#1-transition-기본-개념)
2. [Suspense와 Transition의 결합](#2-suspense와-transition의-결합)
3. [내부 동작 원리 — Concurrent Rendering](#3-내부-동작-원리--concurrent-rendering)
4. [Transition의 적용 범위](#4-transition의-적용-범위)
5. [Transition이 정말 유용한가? — 수동 isLoading과의 비교](#5-transition이-정말-유용한가--수동-isloading과의-비교)
6. [라우팅과 Transition](#6-라우팅과-transition)
7. [useDeferredValue 심층 분석](#7-usedeferredvalue-심층-분석)
8. [검색 자동완성 최적화 패턴](#8-검색-자동완성-최적화-패턴)
9. [React Query와의 조합 — 패턴 A / 패턴 B](#9-react-query와의-조합--패턴-a--패턴-b)
10. [캐시 수명 관리 — staleTime vs gcTime](#10-캐시-수명-관리--staletime-vs-gctime)
11. [검증 데모 프로젝트](#11-검증-데모-프로젝트)
12. [전체 요약](#12-전체-요약)

---

## 1. Transition 기본 개념

`Transition`은 React 18에서 도입된, **긴급하지 않은 상태 업데이트를 표시하는 메커니즘**이다. `startTransition` / `useTransition`으로 래핑된 업데이트는 낮은 우선순위로 처리되어, 사용자 입력 같은 긴급 업데이트를 방해하지 않는다.

```tsx
const [isPending, startTransition] = useTransition();

startTransition(() => {
  setTab('posts'); // 긴급하지 않음 → 중단 가능
});
```

### 핵심 특성
- **중단 가능(interruptible)**: 더 급한 업데이트가 오면 작업을 버리고 최신 상태로 재시작
- **이전 UI 유지**: 새 화면이 준비되는 동안 기존 화면을 그대로 보여줌
- **`isPending`** 으로 진행 중 상태를 UI에 반영 가능

### 활용 패턴
1. **탭/라우트 전환**: 페이지 이동 시 스피너 대신 이전 페이지를 보여주며 새 데이터를 로드
2. **검색/필터**: 입력 중에는 이전 결과를 유지하면서 새 결과가 준비되면 교체 (`useDeferredValue`와 함께)
3. **낙관적 UI와 조합**: `useOptimistic`으로 즉시 반영 + transition으로 서버 확정 처리

### 주의사항
- `startTransition` 콜백은 동기적이어야 하며, 내부의 `set` 호출만 transition으로 표시됨 (React 19부터 async 함수 지원 강화)
- 입력값 같이 즉각 반영되어야 하는 상태는 transition에 넣지 말 것 — 별도 state로 분리
- Suspense 경계가 없으면 data fetching fallback 억제 효과를 얻을 수 없음

---

## 2. Suspense와 Transition의 결합

`Suspense`는 컴포넌트가 데이터를 기다리는 동안 `fallback`을 렌더링한다. 문제는 **이미 보여지던 화면이 갑자기 로딩 스피너로 바뀌는 현상("receded state")** 이다. Transition은 이 문제를 해결한다.

### 동작 비교

| 상황 | Transition 없이 | Transition 사용 |
|------|---------------|---------------|
| 탭 전환 시 데이터 로딩 | 기존 UI → fallback(스피너) → 새 UI | 기존 UI 유지 → 새 UI (fallback 스킵) |
| 사용자 경험 | 깜빡임 발생 | 부드러운 전환 |

### 예시

```tsx
function TabSwitcher() {
  const [tab, setTab] = useState('home');
  const [isPending, startTransition] = useTransition();

  const selectTab = (next: string) => {
    startTransition(() => {
      setTab(next); // Suspense가 던지는 promise를 transition이 잡음
    });
  };

  return (
    <>
      <nav className={isPending ? 'dimmed' : ''}>
        <button onClick={() => selectTab('posts')}>Posts</button>
      </nav>
      <Suspense fallback={<Spinner />}>
        <TabContent tab={tab} />
      </Suspense>
    </>
  );
}
```

### 핵심 포인트
- `startTransition` 내부에서 발생한 상태 변경이 Suspense를 트리거하면, React는 기존에 resolved된 UI를 유지한다.
- `isPending`으로 "전환 중" 시각적 피드백(dimmed, progress bar 등)을 제공할 수 있다.
- `fallback`은 **처음 마운트될 때만** 보이고, 이후 탐색에서는 나타나지 않는다.

> Transition은 "**언제**" 업데이트하는지(우선순위)를 제어하고, Suspense는 "**무엇을**" 보여주는지(로딩 경계)를 제어한다. 둘을 결합하면 깜빡임 없는 부드러운 비동기 UI를 만들 수 있다.

---

## 3. 내부 동작 원리 — Concurrent Rendering

Transition이 "이전 화면 유지 + 자연스러운 페인팅"을 만드는 원리는 세 가지 기술의 조합이다.

### 3.1 Two-Tree 아키텍처 (Double Buffering)

React는 내부적으로 두 개의 Fiber 트리를 유지한다.

```
┌─────────────────┐          ┌─────────────────┐
│  Current Tree   │          │ WorkInProgress  │
│  (화면에 표시)   │   ←→     │    (작업 중)     │
└─────────────────┘          └─────────────────┘
                              commit 전까지 DOM에 반영되지 않음
```

- **Current Tree**: 현재 DOM에 commit되어 화면에 보이는 트리
- **WorkInProgress Tree**: 백그라운드에서 새로 만들고 있는 트리

Transition 업데이트는 WorkInProgress 트리에서 조용히 진행되며, 완성되기 전까지 Current 트리는 화면에 그대로 남아있다.

### 3.2 우선순위 기반 스케줄링 (Lanes Model)

React는 업데이트에 Lane(우선순위 비트)을 부여한다.

| Lane | 예시 | 특성 |
|------|------|------|
| `SyncLane` | `onClick`의 `setState` | 즉시, 블로킹 |
| `InputContinuousLane` | `onChange` | 높은 우선순위 |
| `TransitionLane` | `startTransition` 내부 | 낮은 우선순위, 중단 가능 |
| `IdleLane` | - | 가장 낮음 |

스케줄러(Scheduler 패키지)는 `MessageChannel` 기반으로 **5ms 단위의 time slice**를 나눠 브라우저에 제어권을 돌려준다. 매 슬라이스마다 `shouldYield()`를 체크해서 더 급한 이벤트가 있으면 렌더링을 중단한다.

```
[렌더 5ms] → yield → [브라우저가 paint/input 처리] → [렌더 5ms] → ...
```

### 3.3 Suspense의 "기존 콘텐츠 유지" 규칙

Transition 중 자식 컴포넌트가 promise를 throw하면, React는:

1. WorkInProgress 트리에서 해당 Suspense 경계를 "pending" 상태로 마크
2. `fallback`으로 바로 교체하지 않고, Current 트리의 이전 콘텐츠를 유지한 채 commit 연기
3. promise가 resolve되면 다시 렌더를 시도

React 소스의 `ShouldCapture` / `DidCapture` 플래그와 `SuspenseContext`가 "이 경계는 transition 중이니 fallback을 보여주지 말고 기다려라"를 신호한다.

### 3.4 Commit Phase의 원자성

```
Render Phase (비동기, 중단 가능)
    ↓ (트리 완성)
Commit Phase (동기, 원자적)
    ↓
Browser Paint
```

WorkInProgress 트리가 완전히 준비될 때까지 DOM 변경은 일어나지 않으므로 중간 상태가 사용자에게 노출되지 않는다. 준비가 끝나면 한 번에 swap되어 자연스럽게 페인팅된다.

### 3.5 전체 흐름 요약

```
사용자 클릭
  ↓
startTransition(() => setTab('posts'))
  ↓
[TransitionLane으로 스케줄링]
  ↓
Current 트리 = 그대로 화면 유지
  ↓
WorkInProgress 트리에서 렌더 시작
  ├─ 5ms 작업 → yield → 브라우저가 입력/paint 처리
  ├─ 5ms 작업 → yield → ...
  ├─ Suspense 경계에서 promise throw → 대기
  └─ 데이터 resolve → 렌더 재개
  ↓
트리 완성 → Commit (원자적 DOM swap)
  ↓
Browser Paint (새 화면)
```

> **세 가지 기술의 조합**: ① Double Buffering(중간 상태 노출 방지), ② Cooperative Scheduling(time slicing으로 메인 스레드 양보), ③ Suspense Boundary Policy(transition 중 기존 콘텐츠 우선).

---

## 4. Transition의 적용 범위

**"핸들러 소유 컴포넌트와 그 하위"가 아니라, `transition`으로 표시된 `setState`가 리렌더시키는 서브트리** 이다.

### 4.1 원칙: 업데이트에 꼬리표를 붙인다

`startTransition(() => setX(...))`의 동작:

1. `setX`가 생성하는 update 객체에 `TransitionLane` 부여
2. `x`라는 state가 선언된 컴포넌트(`useState`가 있는 곳)가 **리렌더 시작점**이 됨
3. 거기서 흘러가는 렌더 작업 전체가 transition 컨텍스트에서 실행됨

**핸들러의 위치는 무관**. 중요한 건 어떤 state가 바뀌었는가이다.

### 4.2 예시로 보는 범위

```tsx
function App() {
  const [tab, setTab] = useState('home'); // ← state는 여기
  return (
    <>
      <Sidebar onSelect={(next) => {
        startTransition(() => setTab(next)); // ← 핸들러는 Sidebar에 전달
      }} />
      <Suspense fallback={<Spinner />}>
        <Content tab={tab} /> {/* 이 서브트리가 리렌더됨 */}
      </Suspense>
    </>
  );
}
```

- **핸들러 실행 주체**: `Sidebar` 내부 (버튼 클릭)
- **리렌더 시작점**: `App` (state가 여기 있음)
- **Transition 영향 범위**: `tab` 변경으로 리렌더되는 서브트리 → 실제로는 `Content`와 그 자식들
- **Suspense fallback 억제 대상**: `Content` 서브트리에서 throw되는 promise

`Sidebar`는 핸들러를 가지고 있지만 `tab`에 의존하지 않으므로 리렌더되지 않고, transition과도 관계없다.

### 4.3 판단 기준 요약

| 항목 | 판단 기준 |
|------|----------|
| Transition이 붙는 대상 | `startTransition` 내부의 `setState` 호출 (update 객체) |
| 리렌더 시작점 | 해당 state가 선언된 컴포넌트 |
| 영향 받는 서브트리 | state 변경으로 인한 리렌더 전파 경로 |
| Fallback 억제 대상 Suspense | 그 경로에서 promise가 throw되고, 경계가 transition 중일 때 |
| 이벤트 핸들러 위치 | 무관 |

### 4.4 미묘한 지점
- 여러 state를 같은 transition으로 묶을 수 있다 — 한 콜백 안의 여러 `setState`는 모두 같은 lane
- state가 하위에 있으면 범위는 그 하위만 — 만약 `tab` state가 `Content` 내부에 있다면 `App`이나 `Sidebar`는 리렌더 대상이 아님

---

## 5. Transition이 정말 유용한가? — 수동 isLoading과의 비교

### 5.1 흔한 회의론

> "이전 화면을 유지하면 변경됐다는 것을 감지하기 어려우니 오히려 opacity + 로딩이 더 좋지 않나?"

이 직관이 **정답에 가깝다**. React 팀이 권장하는 패턴은 **Transition + 시각적 피드백의 조합**이지, Transition만 쓰는 게 아니다.

```tsx
const [isPending, startTransition] = useTransition();

return (
  <>
    {isPending && <TopProgressBar />}
    <div style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 0.2s' }}>
      <Suspense fallback={<Spinner />}>
        <Content tab={tab} />
      </Suspense>
    </div>
  </>
);
```

### 5.2 Transition vs 수동 isLoading — 4가지 결정적 차이

#### ① Suspense와의 상호작용 (가장 큰 차이)

**수동 isLoading** — Suspense 경계를 만나면 fallback이 강제로 보임. `opacity: 0.6`이 적용된 상태에서 내부가 Spinner로 바뀌어 의도한 UX 실패.

**Transition** — Suspense fallback을 자동으로 억제. 이전 화면이 실제로 유지되고 opacity만 적용됨.

> Suspense 기반 data fetching(`use()`, React Query의 suspense 모드, Next.js App Router 등)에서는 수동 isLoading으로 이 문제를 풀 방법이 아예 없다.

#### ② 중단(Interruption) 가능성

```
타이핑: "r" → "re" → "rea" → "reac" → "react"

수동 isLoading:  렌더 ✓ ✓ ✓ ✓ ✓  (5번 전부)
Transition:     렌더 시작→폐기→폐기→폐기→✓ (최종만 commit)
```

React가 stale한 작업을 자동으로 버린다. 디바운스/throttle로 흉내 낼 수 있지만 근본적으로 다르다.

#### ③ CPU 무거운 동기 렌더

```tsx
const [query, setQuery] = useState('');
const deferredQuery = useDeferredValue(query);
<HeavyList query={deferredQuery} /> // time-slicing으로 백그라운드 렌더
```

수동 isLoading은 렌더 자체가 메인 스레드를 잡아 입력이 끊긴다. `useDeferredValue`는 5ms 단위로 쪼개 브라우저에 양보.

#### ④ 상태 관리의 정확성

- 수동 isLoading: try/catch, cancel token, race condition을 직접 관리
- Transition: React가 "렌더 완료 여부"로 자동 판단

### 5.3 실용 비교표

| 시나리오 | 수동 isLoading | Transition |
|---------|--------------|-----------|
| 단순 fetch → setState | 잘 작동 | 잘 작동 (차이 미미) |
| Suspense 기반 fetching | 실패 (fallback 깜빡임) | ✅ |
| 빠른 연속 입력 | 중간 렌더 낭비 | stale 렌더 자동 폐기 |
| 무거운 동기 렌더 | 입력 차단됨 | time-slicing으로 해결 |
| 로딩 상태 관리 | 수동, 에러 취약 | 자동 |
| 에러/취소 처리 | 직접 구현 | React 위임 |

### 5.4 솔직한 결론

**Transition이 실질적으로 필요한 경우는 제한적이다:**

1. **Suspense 기반 프레임워크 사용** (Next.js App Router 등) — 선택의 여지 없음
2. **CPU 무거운 렌더** — `useDeferredValue`로 time-slicing
3. **빠른 연속 입력에서 stale 요청 자동 폐기** — 검색 자동완성 등

이 세 가지 중 하나에 해당하지 않으면, 수동 `isLoading + opacity`가 더 나은 선택일 수 있다.

### 5.5 "성능이 좋아진다"는 오해

| 지표 | 변화 |
|------|------|
| 전체 렌더 시간 | 거의 동일 (오히려 스케줄링 오버헤드로 살짝 증가) |
| 입력 지연 | 크게 개선 |
| 프레임 드롭 | 크게 개선 |
| 체감 속도 | 크게 개선 |

> Transition은 **성능(총 CPU 작업량)이 좋아지는 게 아니라, 반응성(responsiveness)이 좋아지는 것**. "성능" 대신 "반응성" 또는 "체감 속도"라고 말해야 정확하다.

---

## 6. 라우팅과 Transition

### 6.1 반응 속도의 진짜 결정 요인

반응 속도의 근본 원인은 **라우팅 전략**이고, Transition은 "대기 시간을 어떻게 보여줄지"를 담당하는 별개 레이어이다.

| 전략 | 특성 | 체감 속도 |
|------|------|----------|
| Static (SSG) | 빌드 타임에 미리 생성 | 거의 즉시 |
| Static + Prefetch | `Link` 호버/viewport 진입 시 미리 로드 | 즉시 |
| ISR / Cache | 캐시 히트 시 빠름 | 빠름 |
| Dynamic (SSR) | 매 요청마다 서버 fetch | 느림 (수백 ms) |
| Client fetch | 클라이언트에서 fetch | 네트워크 의존 |

- 라우트가 정적 → 대기 자체가 거의 없음 → Transition의 "이전 화면 유지" 효과가 체감되지 않음
- 라우트가 동적 → 실제 대기 시간 발생 → Transition이 그 대기를 어떻게 보여줄지 결정

### 6.2 Next.js App Router의 내부 Transition

`<Link>` 클릭이나 `router.push()`는 프레임워크가 이미 `startTransition`으로 감싸서 실행한다.

- 정적 라우트라도 hydration/컴포넌트 교체에 transition 적용
- 동적 라우트면 "이전 페이지 유지 + 로딩 바" UX가 자동

> Transition은 "켜고 끄는 기능"이 아니라 **프레임워크가 기본 제공하는 전환 메커니즘**이다. 정적 라우팅에서 효과가 안 보이는 것은 대기가 없기 때문이지, 작동 안 하는 게 아니다.

### 6.3 레이어 분리

```
┌─────────────────────────────────┐
│ 라우팅 전략 (SSG/SSR/Prefetch)    │ ← 대기 시간의 양 결정
├─────────────────────────────────┤
│ Transition + Suspense            │ ← 대기를 "어떻게" 보여줄지
├─────────────────────────────────┤
│ isPending UI (dim, progress bar) │ ← 사용자에게 피드백
└─────────────────────────────────┘
```

### 6.4 `startTransition`으로 `router.push`만 감싼다면?

**`isPending`을 쓰지 않는다면 의미 없고, 쓴다면 유용하다.**

```tsx
const [isPending, startTransition] = useTransition();
const goToPosts = () => {
  startTransition(() => {
    router.push('/posts');
  });
};

return (
  <button onClick={goToPosts} disabled={isPending}>
    {isPending ? '이동 중...' : 'Posts'}
  </button>
);
```

`router.push` 단독으로는 "네비게이션이 진행 중인지" 알 수 없다. `useTransition`으로 감싸면 `isPending`이 네비게이션 완료까지 `true`로 유지되어 버튼 비활성화/스피너 표시에 활용 가능하다.

| 코드 | 의미 |
|------|------|
| `router.push('/posts')` | 네비게이션 발생. 끝. |
| `startTransition(() => router.push('/posts'))` (단독) | 동작 동일. `useTransition` 없이는 쓸모 없음 |
| `useTransition` + 위 코드 | `isPending`으로 진행 상태 추적 가능 |

Next.js 15부터는 `useLinkStatus` 훅으로 `<Link>`의 pending 상태를 얻을 수 있다.

---

## 7. useDeferredValue 심층 분석

### 7.1 본질: "값의 transition 버전"

```tsx
const deferred = useDeferredValue(value);
```

`value`를 받아 **지연된 사본**을 반환한다. `value`가 바뀌면:

1. **이번 렌더**: `deferred`는 이전 값으로 남음 (input은 새 `value` 즉시 반영)
2. **백그라운드**: React가 `deferred = new value`로 재렌더를 transition lane에 스케줄
3. 백그라운드 렌더가 완료되면 swap

> `useTransition`이 "setState를 감싸는 쪽"이라면, `useDeferredValue`는 **"받은 값을 사용하는 쪽"의 같은 메커니즘**이다.

### 7.2 진짜 효과 두 가지

#### (a) 연타 시 호출 횟수 감소

```
입력:            r → e → a → c → t
파생 렌더 스케줄: 폐기 → 폐기 → 폐기 → 폐기 → 실행
```

디바운스와 결과가 비슷하지만:

| | 디바운스 | useDeferredValue |
|---|---------|-----------------|
| 임계 시간 | 명시적 (300ms 등) | React가 가용 시간으로 판단 |
| 입력 자체 반영 | 같이 늦어질 수 있음 | 항상 즉시 |
| 빠른 기기 | 불필요한 대기 | 즉시 시작 |
| 느린 기기 | 고정 대기 | 자동으로 더 늦춰짐 |

#### (b) Suspense와 결합 시 이전 결과 유지 (진짜 가치)

```tsx
function SearchPage() {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <Suspense fallback={<Spinner />}>
        <Results query={deferred} /> {/* use(fetch(deferred)) */}
      </Suspense>
    </>
  );
}
```

- `query`가 바뀌면 input은 즉시 반영
- `deferred`가 바뀌면 `<Results>`가 새 promise를 throw
- transition이라 Suspense fallback이 안 보이고 **이전 결과 유지** ← 진짜 가치

### 7.3 못하는 것 (핵심 한계)

> **한 번의 무거운 동기 호출은 못 끊는다.**

```tsx
useMemo(() => busyFilter(ITEMS, q), [q]); // 한 번의 동기 함수 호출
```

이 한 줄이 2000ms 걸리면 그 2000ms 동안 메인 스레드는 무조건 블록된다. JavaScript는 단일 스레드고 React는 함수 호출 **중간**을 끊을 수 없다.

React의 time-slicing은 **fiber 경계(컴포넌트 렌더 단위)에서만** yield한다.

| 경계 | yield 가능? |
|------|-----------|
| 컴포넌트 A 렌더 끝 → 컴포넌트 B 렌더 시작 | ✅ |
| 한 컴포넌트의 `useMemo` 콜백 실행 중 | ❌ |
| `busyFilter`의 for loop 안 | ❌ |

따라서 한 글자만 쳐도:
- input은 즉시 반영됨 ✅
- 그 직후 deferred 렌더가 시작되어 2000ms 블록 ❌
- 이 동안 다음 키 입력은 큐잉됨

### 7.4 실제 효과 범위 정리

| 시나리오 | `useDeferredValue` | 결과 |
|---------|-------------------|------|
| 빠르게 5글자 연타 | 중간 4번의 deferred 렌더가 시작 전 폐기 | 5번 → 1번 호출 |
| 무거운 호출이 이미 시작된 후 추가 입력 | 못 끊음 | 입력 블록 |
| 한 번의 입력 후 무거운 계산 | 도움 안 됨 | 200ms든 2000ms든 그대로 블록 |

### 7.5 진짜 해결책 (useDeferredValue가 대체 못 하는 것)

1. **작업 쪼개기 (chunking)** — `scheduler.yield()` 또는 `MessageChannel`로 양보
2. **Web Worker** — 메인 스레드에서 계산 자체를 옮김
3. **알고리즘 개선** — 인덱스, Trie, Bitmap 등으로 O(N) → O(log N)
4. **Virtualization** — `react-window`, `@tanstack/react-virtual` 등
5. **Debounce** — N ms 동안 입력 없을 때만 실행
6. **외부 서비스** — 서버 검색 인덱스 (Algolia, ES)

### 7.6 `useTransition`과의 차이

```tsx
// 호출하는 쪽이 통제
startTransition(() => setQuery(input));

// 받는 쪽이 통제
const deferred = useDeferredValue(query);
```

- `useTransition`: `setState` 호출 시점에서 결정. 자기가 owns한 state에 사용.
- `useDeferredValue`: prop으로 받은 값을 어떻게 쓸지 결정. 호출자가 transition으로 안 감쌌어도 받는 쪽에서 보호 가능.

**라이브러리 컴포넌트가 외부에서 받은 prop을 안전하게 다루고 싶을 때 `useDeferredValue`가 유일한 선택.**

### 7.7 요청 최적화와 렌더 최적화는 별개

> `useDeferredValue`는 **순수하게 렌더링 레이어 도구**다. 요청 자체를 줄이거나 취소하지 않는다.

- 렌더 폐기 ≠ 요청 폐기
- Transition lane에서 렌더가 폐기되더라도, 이미 만든 fetch promise는 살아 있음
- 요청 최적화는 `AbortController` / React Query / debounce의 영역

---

## 8. 검색 자동완성 최적화 패턴

### 8.1 3-레이어 역할 분담

```
[입력]
  ↓ 즉시 commit
[query state] ──────────▶ input UI (즉시 반영)
  ↓
debounce(300ms)
  ↓
[debouncedQuery] ────────▶ fetch 호출 (요청 횟수 최적화)
  ↓
useDeferredValue
  ↓
[deferred] ──────────────▶ <Results> (이전 결과 유지)
```

| 레이어 | 줄이는 비용 |
|--------|-----------|
| `query` 즉시 반영 | 입력 지연 (체감) |
| `debouncedQuery` | 네트워크 요청 횟수 |
| `useDeferredValue` + `Suspense` | fallback 깜빡임 (시각적) |

### 8.2 표준 코드

```tsx
function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const deferred = useDeferredValue(debouncedQuery);

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <Suspense fallback={<Spinner />}>
        <Results query={deferred} />
      </Suspense>
    </>
  );
}
```

### 8.3 첫 진입 시 동작

```
[t=0] 페이지 진입, query="" → debounced="" → deferred=""
     → Results 렌더 → searchPromise("") suspend
     → 보여줄 이전 결과 없음 → Suspense fallback (Spinner) 표시 ✅
```

이후 입력부터는 이전 commit된 결과가 있으므로 fallback 대신 이전 결과 유지 + 새 결과로 swap.

### 8.4 주의할 미묘한 부분

#### (a) debounce를 어디에 거느냐

```tsx
// ❌ 안 좋음: 입력 자체가 늦어짐
<input onChange={(e) => debouncedSet(e.target.value)} />

// ✅ 좋음: 입력은 즉시, 파생값만 debounce
const [query, setQuery] = useState("");
const debouncedQuery = useDebounce(query, 300);
<input value={query} onChange={(e) => setQuery(e.target.value)} />
```

#### (b) debounce는 요청 누락을 막지 못한다

**정상 케이스**: trailing edge 방식이 표준 — 사용자가 잠시만 멈추면 마지막 값에 대한 요청은 반드시 발사됨.

**누락처럼 보이는 케이스 ①**: 사용자가 끝까지 안 멈춤
- `maxWait` 옵션으로 "최대 N ms마다 한 번은 무조건 발사"
- `leading edge` 추가

**누락처럼 보이는 케이스 ② — Race condition (진짜 위험)**:

```
t=0   "react"  → debounce 만료 → 요청 A 발사 (느림, 800ms)
t=400 "reacts" → debounce 만료 → 요청 B 발사 (빠름, 200ms)
t=600 B 응답 → "reacts" 결과 표시 ✅
t=800 A 응답 → "react" 결과 덮어씀 ❌
```

**해결법**:
1. **AbortController** — `useEffect` cleanup에서 이전 요청 abort
2. **React Query** — `queryKey` 바뀌면 자동 abort + 캐시
3. **버전/스탬프 비교** — `versionRef`로 최신 요청만 반영

#### (c) 부수적 누락 위험

| 케이스 | 원인 | 해결 |
|--------|------|------|
| 컴포넌트 unmount 후 debounce 발사 | 타이머가 살아 있음 | `useEffect` cleanup에서 `clearTimeout` |
| Strict Mode 이중 실행 | 개발 모드 | 제대로 cleanup하면 자연스럽게 처리 |
| 빠른 unmount/remount | 새 인스턴스가 stale 요청 받음 | `AbortController` + cleanup |

---

## 9. React Query와의 조합 — 패턴 A / 패턴 B

React Query에는 두 가지 변형이 있고, **Suspense와는 양자택일**이다.

| API | `placeholderData` | Suspense |
|-----|------------------|----------|
| `useQuery` | ✅ 지원 | ❌ |
| `useSuspenseQuery` | ❌ 불지원 (suspend의 본질과 충돌) | ✅ |

### 9.1 패턴 A — `useQuery` + `keepPreviousData`

```tsx
const { data, isPlaceholderData, isFetching } = useQuery({
  queryKey: ["search", debouncedQuery],
  queryFn: ({ signal }) => fetch(`/api/search?q=${debouncedQuery}`, { signal })
    .then((r) => r.json()),
  placeholderData: keepPreviousData,
});

return (
  <div style={{ opacity: isPlaceholderData ? 0.5 : 1 }}>
    <Results items={data ?? []} />
  </div>
);
```

- Suspense 안 씀, `data` 직접 다룸
- 이전 데이터 유지는 **라이브러리가 처리**
- `isPlaceholderData` / `isFetching`으로 세밀한 UI 제어
- "조용한 백그라운드 갱신"에 가장 깔끔

### 9.2 패턴 B — `useSuspenseQuery` + `useDeferredValue`

```tsx
function Search() {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);

  return (
    <Suspense fallback={<Spinner />}>
      <Results query={deferred} />
    </Suspense>
  );
}

function Results({ query }: { query: string }) {
  const { data } = useSuspenseQuery({
    queryKey: ["search", query],
    queryFn: ({ signal }) => fetch(`/api/search?q=${query}`, { signal })
      .then((r) => r.json()),
  });
  return <List items={data} />;
}
```

- Suspense 사용, `data` 항상 정의됨 (선언적)
- 이전 렌더 유지는 **React가 처리** (transition + fiber)
- `useDeferredValue` 없으면 매번 fallback 깜빡임
- RSC, Streaming SSR과 일관성

### 9.3 책임 위치 비교

```
┌────────────────────────────────────────────────────┐
│               컴포넌트                              │
│  data는 "이전 값이 남아있는 것처럼" 보임 ← 같은 UX  │
├─────────────── 패턴 A ──────┬── 패턴 B ─────────────┤
│ React Query 내부에          │ React 렌더 레이어     │
│ 이전 `data` 값 저장         │ 이전 committed tree    │
│ (isPlaceholderData)         │ 유지                   │
│                              │ (transition + Suspense)│
│ Suspense 무관               │ useDeferredValue 필요 │
│ use() 무관                  │ useSuspenseQuery throw│
└─────────────────────────────┴──────────────────────┘
```

### 9.4 첫 진입 시 동작 차이

| | 패턴 A | 패턴 B |
|---|-------|-------|
| 첫 렌더 | `data: undefined`, `isLoading: true` | Suspense fallback (throw) |
| 개발자가 다뤄야 함 | `if (isLoading) return ...` | Suspense 경계 하나 배치 |

### 9.5 SSR / RSC 친화성

- **패턴 A**: 순수 클라이언트 state 로직. SSR 시 dehydrate/hydrate 필요.
- **패턴 B**: Suspense 기반이라 Streaming SSR이나 RSC와 자연스럽게 호환. Next.js App Router와 궁합 좋음.

### 9.6 핵심 요약

> 기능적으로 비슷한 UX지만 **책임 위치가 다르다**.
>
> - 패턴 A: 데이터 레이어가 "이전 결과" 관리 → 컴포넌트는 그냥 `data` 받아 그림
> - 패턴 B: 렌더 레이어가 "이전 화면" 관리 → 컴포넌트는 항상 fresh `data` 받음
>
> **"이전 것"의 본체가 데이터냐 렌더 결과냐가 본질적 차이.**

---

## 10. 캐시 수명 관리 — staleTime vs gcTime

### 10.1 완전히 분리된 두 개념

```
┌─────────────────────────────────────────┐
│ staleTime: "데이터가 fresh한 기간"        │ → refetch 여부만 결정
│ gcTime   : "비활성 데이터가 메모리에       │ → 실제 메모리 제거
│            남아있는 기간"                  │
└─────────────────────────────────────────┘
```

**`staleTime`을 아무리 짧게 해도 캐시는 안 사라진다.** 그냥 "이 데이터는 stale이니 접근하면 백그라운드에서 refetch해" 표시일 뿐.

### 10.2 캐시가 실제로 제거되는 조건

| 이벤트 | 캐시 제거? |
|--------|-----------|
| `staleTime` 경과 | ❌ (stale 마크만) |
| `gcTime` 경과 + 관찰자 없음 | ✅ |
| 컴포넌트 언마운트 (다른 관찰자 있음) | ❌ |
| 컴포넌트 언마운트 (관찰자 0 + `gcTime` 경과) | ✅ |
| `queryClient.removeQueries(...)` | ✅ (즉시) |
| `queryClient.resetQueries(...)` | ✅ (즉시 + refetch) |
| `queryClient.invalidateQueries(...)` | ❌ (stale 마크 + refetch) |

### 10.3 React Query 철학

> "**항상 뭔가는 보여줘라.**"
>
> 캐시를 stale이 되자마자 지워버리면 매번 로딩 스피너를 봐야 한다. 그래서 캐시는 "display용"으로 유지하고, refetch는 "최신성 확보용"으로 따로 돌리는 구조. **Stale-While-Revalidate (SWR)** 패턴.

### 10.4 `staleTime: 0`의 정확한 동작

| 동작 | 발생 여부 |
|------|----------|
| 마운트 시 refetch | ✅ |
| 창 포커스 복귀 시 refetch | ✅ (`refetchOnWindowFocus` 기본 true) |
| 네트워크 재연결 시 refetch | ✅ (`refetchOnReconnect` 기본 true) |
| 다른 컴포넌트에서 같은 key 사용 시 refetch | ✅ |

하지만 **캐시 자체는 남아 있다**:
1. 같은 key로 접근 → 캐시 즉시 반환 (UX 인스턴트)
2. 동시에 백그라운드 refetch 발사
3. 응답 오면 캐시 갱신 + UI 업데이트

### 10.5 "항상 최신"을 강하게 보장하려면

```tsx
// (a) 마운트마다 강제 refetch
useQuery({
  ...,
  staleTime: 0,
  refetchOnMount: "always",
});

// (b) 주기적 polling
useQuery({
  ...,
  refetchInterval: 5000,
  refetchIntervalInBackground: false,
});

// (c) Mutation 후 수동 invalidation
const mutation = useMutation({
  mutationFn: createPost,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  },
});

// (d) 서버 푸시 (WebSocket / SSE)
socket.on("post:updated", (id) => {
  queryClient.invalidateQueries({ queryKey: ["posts", id] });
});
```

### 10.6 데이터 성격별 권장 `staleTime`

| 데이터 성격 | 추천 `staleTime` |
|-----------|-----------------|
| 검색 자동완성 결과 | 0 ~ 30초 |
| 사용자 프로필 | 1~5분 |
| 설정/메타데이터 | 10분 이상 |
| 정적 목록 (국가, 카테고리) | `Infinity` |

### 10.7 캐시 제거 방법들

#### ① `gcTime: 0` — 관찰자 없어지면 즉시 제거 (가장 간단)

```tsx
new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 0,
      staleTime: 0,
    },
  },
});
```

- 같은 `queryKey` 관찰 중에는 유지
- `queryKey`가 바뀌어 이전 키의 관찰자가 0이 되면 즉시 제거
- `keepPreviousData`는 placeholder로 **복사**해 쓰므로 영향 없음

#### ② 수동으로 이전 쿼리만 제거

```tsx
const queryClient = useQueryClient();
const prevRef = useRef(debounced);

useEffect(() => {
  if (prevRef.current !== debounced) {
    queryClient.removeQueries({ queryKey: ["search", prevRef.current] });
    prevRef.current = debounced;
  }
}, [debounced, queryClient]);
```

#### ③ 현재 키 외 모두 제거 (predicate)

```tsx
queryClient.removeQueries({
  queryKey: ["search"],
  predicate: (q) => q.queryKey[1] !== debounced,
});
```

#### ④ 특정 트리거에만 전체 초기화

```tsx
queryClient.clear(); // 전부
queryClient.removeQueries({ queryKey: ["search"] }); // 검색 전부
```

### 10.8 "관찰자" 개념의 세밀한 이해

**컴포넌트가 마운트돼 있어도, 관찰자는 현재 사용 중인 `queryKey` 하나에만 붙는다.**

```tsx
useQuery({ queryKey: ["search", debounced], ... });
// debounced="vue" → 관찰자 on ["search", "vue"]
// debounced="react"로 바뀌는 순간 → 관찰자 on ["search", "react"]
//                                 → ["search", "vue"]는 관찰자 0
```

즉 컴포넌트가 살아있어도 `queryKey`가 바뀌면 이전 key는 **비활성**이 된다. `gcTime: 0`은 이때 작동한다.

### 10.9 실제 trace (`gcTime: 0` 적용 시)

```
t=0  "vue"   검색
     queryKey=["search","vue"], 관찰자 1
     cache: { "vue": [...] }

t=5  "react" 검색
     queryKey=["search","react"], 관찰자 이동
     "vue"는 관찰자 0 → gcTime:0 → 즉시 GC
     cache: { "react": [...] }
     keepPreviousData: "vue" data를 placeholder로 복사 (캐시와 별개)

t=10 "vue"   재검색
     queryKey=["search","vue"], 관찰자 이동
     "react" 관찰자 0 → 즉시 GC
     "vue" 캐시 없음 → refetch 발생 ✅
     cache: { "vue": [...] }
```

### 10.10 목적별 선택 가이드

| 원하는 것 | 방법 |
|---------|------|
| 과거 검색어들만 제거 (현재 key는 유지) | `gcTime: 0` — 자동 처리 |
| 현재 검색어도 refetch 강제 | `resetQueries` 또는 `invalidateQueries` |
| "검색 기록을 세션 내내 캐시하고 싶지 않다" | `gcTime: 0` (QueryProvider에 추가) |
| "현재 검색만 유지, 나머지는 메모리에서 삭제" | 수동 `removeQueries` / predicate |
| "로그아웃/리셋 같은 명확한 이벤트에서만" | `queryClient.clear()` |

---

## 11. 검증 데모 프로젝트

Next.js 16.2.4 + React 19.2.4 기반 `transitions-suspense-demo/` 프로젝트로 위 내용을 모두 검증.

### 11.1 데모 구성

| 경로 | 검증 내용 |
|------|---------|
| `/demo1-no-transition` | Suspense 단독 → fallback 깜빡임 |
| `/demo2-with-transition` | `useTransition` + Suspense → 이전 화면 유지 + dim, fallback은 첫 진입 시만 |
| `/demo3-deferred-value` | 수동 (no React Query): 검색 자동완성, `useDeferredValue` + 수동 `AbortController` + Map 캐시 |
| `/demo4-manual-vs-transition` | 수동 `isLoading` vs `useTransition` 좌우 비교 |
| `/demo5-router-transition/{home,slow-a,slow-b}` | `router.push` 단독 vs `startTransition` 래핑 → `isPending` 추적 차이 |
| `/demo6-react-query-pattern-a` | 패턴 A: `useQuery` + `keepPreviousData` |
| `/demo7-react-query-pattern-b` | 패턴 B: `useSuspenseQuery` + `useDeferredValue` |

### 11.2 공유 인프라

- `src/lib/search-api.ts`: `AbortSignal`을 지원하는 가짜 검색 API + 호출/취소 카운터
- `src/lib/use-debounce.ts`: 공통 debounce 훅
- `src/lib/use-network-metrics.ts`: 모든 데모에서 공유하는 메트릭 표시
- `src/components/QueryProvider.tsx`: `QueryClientProvider` 제공 (`staleTime: 30_000`, `gcTime: 0`)
- `src/mocks/handlers.ts` + MSW: 실제 fetch가 DevTools Network 탭에서 보이고 취소됨

### 11.3 관찰 가능한 것

- **Build 출력이 라우팅 토론을 입증**: `home`은 `○ Static`, `slow-a/b`는 `ƒ Dynamic` — 정적/동적 체감 속도 차이
- **Demo 3/6/7**: 빠르게 검색어를 바꾸면 Network 탭에 `cancelled`가 찍히고 최종 요청만 200 OK
- **Demo 6**: `"vue" → "react" → "vue"` 시 세 번 모두 네트워크 요청 (캐시 hit 없음) — `gcTime: 0` 효과

### 11.4 주요 버그 수정 이력

1. **Demo 4 무한 suspend**: `fetchItems(tab)`이 매 렌더마다 새 promise를 만들어 `use()`가 영원히 suspend → `tab` 키의 Map 캐시 추가
2. **Demo 3 무의미한 시뮬레이션**: "useDeferredValue가 무거운 렌더를 마법처럼 해결"하는 것처럼 오해를 줌 → 검색 자동완성 시나리오로 재작성
3. **Demo 3 race condition**: 수동 `AbortController` 추가 + `searchAPI`에 `settled` 플래그로 resolve 후 abort는 카운트에서 제외
4. **MSW 도입**: 모든 setTimeout 시뮬레이션을 실제 fetch로 전환 → DevTools에서 진짜 요청/취소 관찰 가능

---

## 12. 전체 요약

### 12.1 개념 한 줄 정리

- **Transition**: "언제 업데이트하는지(우선순위)"를 제어. 긴급하지 않은 것은 낮은 우선순위로.
- **Suspense**: "무엇을 보여주는지(로딩 경계)"를 제어. data 준비 전까지 fallback.
- **Concurrent Rendering**: Double Buffering + Cooperative Scheduling + Suspense Boundary Policy.
- **useDeferredValue**: 파생 렌더를 입력과 분리해 낮은 우선순위로 보내고, 새 값이 오면 진행 예정 렌더를 시작 전에 폐기.
- **`useTransition` vs `useDeferredValue`**: 호출하는 쪽 통제 vs 받는 쪽 통제.

### 12.2 Transition이 진짜 필요한 3가지 경우

1. Suspense 기반 프레임워크 (Next.js App Router 등) — **선택의 여지 없음**
2. CPU 무거운 렌더 (단, 하나의 동기 호출은 못 끊음)
3. 빠른 연속 입력에서 stale 요청 자동 폐기

### 12.3 검색 UX 3가지 최적화

| 레이어 | 도구 | 막는 비용 |
|--------|------|---------|
| 입력 | `useState` 즉시 반영 | 입력 지연 |
| 네트워크 | `debounce` | 요청 폭주 |
| 렌더 | `useDeferredValue` + Suspense / `keepPreviousData` | fallback 깜빡임 |
| race | `AbortController` / React Query `signal` | stale 응답 |

### 12.4 React Query 두 패턴 핵심

| | 패턴 A (`useQuery` + `keepPreviousData`) | 패턴 B (`useSuspenseQuery` + `useDeferredValue`) |
|---|---|---|
| 이전 것 보존 위치 | 데이터 레이어 (라이브러리) | 렌더 레이어 (React) |
| Suspense | 불필요 | 필수 |
| `data` 타입 | `T \| undefined` | 항상 `T` |
| RSC / Streaming | 추가 작업 필요 | 자연스럽게 호환 |

### 12.5 캐시 수명 한 줄

> **`staleTime`은 "언제 refetch할지"를 결정할 뿐, "언제 캐시를 지울지"는 `gcTime` + 관찰자 유무가 결정한다.**
>
> 검색 기록처럼 세션 내내 캐시를 쌓기 싫다면 → `gcTime: 0`. 현재 key까지 버리려면 → `resetQueries` / `invalidateQueries`.

### 12.6 오해 주의

- ❌ Transition을 쓰면 "성능"이 좋아진다 → ✅ **반응성**이 좋아진다. 총 작업량은 거의 동일.
- ❌ `useDeferredValue`가 무거운 렌더를 마법처럼 쪼갠다 → ✅ **한 번의 동기 호출은 못 끊는다**. 연타 시 중간 렌더만 폐기.
- ❌ `useDeferredValue`가 요청을 줄인다 → ✅ **순수 렌더 레이어 도구**. 요청 최적화는 debounce/AbortController 담당.
- ❌ `staleTime: 0`으로 하면 캐시가 사라진다 → ✅ 캐시는 그대로, **refetch 여부만 변경**.
- ❌ `router.push`를 `startTransition`으로 감싸면 빨라진다 → ✅ 동작 동일. **`isPending` 추적할 때만 의미**.
