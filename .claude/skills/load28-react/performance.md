# 성능 최적화

## P-01: 프로파일링 없이 최적화 금지

**분류:** NEVER

**WHY:** 추측 기반 최적화는 실제 병목이 아닌 곳에 복잡성을 추가한다. React DevTools Profiler, Lighthouse, Chrome Performance 탭으로 실제 병목을 확인한 뒤에만 최적화한다.

**검증:** `useMemo`, `useCallback`, `React.memo`를 추가할 때 프로파일링 데이터(스크린샷, 수치) 없이 "느릴 것 같아서"라는 이유면 REJECT. 단, P-03(모듈 상수), P-05(inline style), S-14(Provider value) 등 구조적으로 항상 적용하는 규칙은 예외.

---

## P-02: 대량 리스트 가상화

**분류:** ALWAYS (스크롤이 필요한 대량 리스트)

**WHY:** 1000개 항목을 모두 DOM에 렌더하면 수십만 개의 DOM 노드가 생성된다. 가상화(react-window, @tanstack/react-virtual)는 화면에 보이는 항목만 렌더하여 초기 렌더 시간과 메모리 사용량을 90%+ 줄인다.

**적용 기준:** 정확한 임계값은 항목의 복잡도에 따라 다르지만, 일반적 가이드라인으로 **스크롤이 필요한 50개 이상의 리스트**에 적용한다. 단순 텍스트 리스트는 100개까지도 괜찮을 수 있고, 복잡한 카드 UI는 20개부터 성능 이슈가 발생할 수 있다. 의심스러우면 P-01(프로파일링)로 확인한다.

```tsx
// ❌ BAD: 1000개 항목 전부 렌더
{items.map(item => <Row key={item.id} item={item} />)}

// ✅ GOOD: 가상화
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ overflow: 'auto', height: '400px' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <Row key={items[virtualRow.index].id} item={items[virtualRow.index]} />
        ))}
      </div>
    </div>
  );
}
```

---

## P-03: 모듈 레벨 기본값 상수

**분류:** NEVER (inline 기본값)

**WHY:** `options = []` 같은 기본 파라미터는 매 렌더마다 새 참조를 생성한다. 이 값이 useEffect 의존성이나 memo된 자식의 props로 전달되면 불필요한 실행/리렌더가 발생한다.

```tsx
// ❌ BAD: 매 렌더마다 새 빈 배열
function Select({ options = [] }: { options?: string[] }) {
  useEffect(() => { ... }, [options]); // 매 렌더마다 실행
}

// ✅ GOOD: 모듈 레벨 상수
const EMPTY_OPTIONS: string[] = [];

function Select({ options = EMPTY_OPTIONS }: { options?: string[] }) {
  useEffect(() => { ... }, [options]); // options가 실제로 변할 때만 실행
}
```

---

## P-04: 삼항 연산자 조건부 렌더 + 중첩 삼항 금지

**분류:** NEVER (number/string 조건에서 `&&` 사용, 중첩 삼항)

**WHY:** `count && <Component />`에서 count가 `0`이면 React가 falsy 값 `0`을 그대로 렌더한다. `""` 빈 문자열도 마찬가지. 삼항 연산자는 항상 명시적으로 null을 반환하여 이 함정을 방지한다.

**적용 범위:** `number`, `string`, `null | undefined` 타입이 조건으로 사용될 때 특히 위험하다. 이미 `boolean`임이 보장된 값(`isLoggedIn && <Dashboard />`)에서는 `&&`가 안전하지만, **일관성을 위해 삼항 연산자를 권장**한다.

```tsx
// ❌ BAD: count=0일 때 화면에 "0" 렌더됨
{count && <Badge count={count} />}

// ❌ BAD: message=""일 때 빈 문자열 렌더
{message && <Alert text={message} />}

// ✅ GOOD: 삼항 연산자로 명시적 null
{count > 0 ? <Badge count={count} /> : null}
{message ? <Alert text={message} /> : null}

// ✅ OK: boolean은 안전하지만 삼항 권장
{isLoggedIn ? <Dashboard /> : null}
```

### 중첩 삼항 연산자 금지

**분류:** NEVER

**WHY:** 삼항 연산자가 중첩되면 가독성이 급격히 떨어진다. 조건 분기가 2단계 이상 중첩되면 어떤 조건에서 어떤 값이 반환되는지 한눈에 파악할 수 없다. 변수 추출, early return, 또는 헬퍼 함수로 대체한다.

```tsx
// ❌ BAD: 중첩 삼항 — 읽기 어려움
const items = isGuest
  ? allItems.filter((i) => i.id === guestId)
  : selectedGroupId
    ? allItems.filter((i) => i.groupId === selectedGroupId)
    : allItems;

// ✅ GOOD: 조건을 변수로 분리하여 선형으로 표현
function getVisibleItems() {
  if (isGuest) {
    return allItems.filter((i) => i.id === guestId);
  }
  if (selectedGroupId) {
    return allItems.filter((i) => i.groupId === selectedGroupId);
  }
  return allItems;
}
const items = getVisibleItems();

// ✅ GOOD: 간단한 경우 early return 없이 변수 분리
const isFiltered = !isGuest && selectedGroupId !== null;
const items = isGuest
  ? allItems.filter((i) => i.id === guestId)
  : allItems.filter((i) => !isFiltered || i.groupId === selectedGroupId);
```

**검증:** 삼항 연산자 안에 또 다른 삼항 연산자가 있으면 REJECT. 변수 추출 또는 함수로 분리한다.

---

## P-05: inline style 객체 금지

**분류:** NEVER

**WHY:** `style={{ color: 'red' }}`는 매 렌더마다 새 객체를 생성한다. `React.memo`로 감싼 자식에 전달하면 memo가 무효화된다.

```tsx
// ❌ BAD: 매 렌더마다 새 style 객체
<div style={{ padding: 16, color: 'red' }}>

// ✅ GOOD: 모듈 레벨 상수 또는 CSS
const styles = { padding: 16, color: 'red' } as const;
<div style={styles}>

// ✅ BEST: CSS/CSS Modules/Tailwind 사용
<div className="p-4 text-red-500">
```

---

## P-06: barrel file(export *) 남용 금지

**분류:** NEVER

**WHY:** `export * from './ComponentA'` 형태의 barrel file은 tree-shaking을 방해할 수 있다. 하나의 컴포넌트만 필요해도 barrel을 통해 모든 모듈이 평가된다. named export로 명시하고, third-party 라이브러리용 barrel은 생성하지 않는다.

```tsx
// ❌ BAD: 모든 것을 re-export
export * from './Button';
export * from './Input';
export * from './Modal';  // Modal만 필요해도 전부 로드

// ✅ GOOD: 필요한 것만 명시
export { Button } from './Button';
export { Input } from './Input';
export type { ButtonProps } from './Button';
```

---

## P-07: 요청 워터폴 제거

**분류:** ALWAYS

**WHY:** 순차적으로 3개의 API를 호출하면(A 완료 → B 시작 → B 완료 → C 시작) 총 시간은 A+B+C다. 병렬 호출하면 max(A,B,C)로 줄어든다. Vercel은 이것을 React 성능 개선 최우선 과제로 꼽는다.

```tsx
// ❌ BAD: 순차 fetch (워터폴)
const user = await fetchUser(id);
const posts = await fetchPosts(id);
const comments = await fetchComments(id);

// ✅ GOOD: 병렬 fetch
const [user, posts, comments] = await Promise.all([
  fetchUser(id),
  fetchPosts(id),
  fetchComments(id),
]);
```

---

## P-08: 무거운 컴포넌트 dynamic import

**분류:** ALWAYS

**WHY:** 모달, 차트, 에디터, PDF 뷰어 등 무거운 컴포넌트를 메인 번들에 포함하면 초기 로딩이 느려진다. `React.lazy`로 필요할 때만 로드한다.

```tsx
// ❌ BAD: 메인 번들에 포함
import HeavyChart from './HeavyChart';

// ✅ GOOD: 필요 시 로드
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      {isChartVisible ? <HeavyChart /> : null}
    </Suspense>
  );
}
```

---

## P-09: 서드파티 스크립트 defer

**분류:** ALWAYS

**WHY:** Analytics, 광고, 챗봇 등 서드파티 스크립트는 hydration 이후에 로드해야 한다. 메인 스레드를 블로킹하면 LCP, FID 등 Core Web Vitals에 직접적인 악영향을 준다.

**검증:** `<script>` 태그에 `defer`/`async` 없이 서드파티 URL을 로드하면 REJECT. Next.js `<Script strategy="lazyOnload">` 등 프레임워크 기능 활용 권장.

---

## P-10: 정적 JSX 모듈 레벨 추출

**분류:** ALWAYS (React Compiler 미사용 프로젝트)

**WHY:** 렌더 함수 안의 정적 JSX(변하지 않는 구조)도 매 렌더마다 새 React element 객체를 생성한다. 모듈 레벨에 추출하면 동일 참조를 재사용하여 reconciliation을 건너뛸 수 있다.

**참고:** React Compiler(구 React Forget)가 활성화된 프로젝트에서는 컴파일러가 이를 자동으로 최적화하므로 수동 추출이 불필요할 수 있다. 컴파일러 미사용 프로젝트에서는 여전히 유효한 최적화다.

```tsx
// ❌ BAD: 매 렌더마다 새 element
function Page() {
  return (
    <div>
      <header><h1>Welcome</h1></header>  {/* 매번 새 객체 */}
      <DynamicContent />
    </div>
  );
}

// ✅ GOOD: 정적 부분 추출
const HEADER = <header><h1>Welcome</h1></header>;

function Page() {
  return (
    <div>
      {HEADER}
      <DynamicContent />
    </div>
  );
}
```

---

## P-11: startTransition 비긴급 업데이트

**분류:** ALWAYS (해당 시)

**WHY:** 검색 입력 → 결과 필터링처럼 입력은 즉각 반응해야 하지만 결과 렌더는 지연 가능한 경우, `startTransition`으로 비긴급 업데이트를 분리하면 입력 반응성이 유지된다.

```tsx
// ✅ GOOD: 입력은 즉시, 필터는 transition으로
const [query, setQuery] = useState('');
const [filteredItems, setFilteredItems] = useState(items);

const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  setQuery(e.target.value);                          // 긴급: 입력 반영
  startTransition(() => {
    setFilteredItems(filterByQuery(items, e.target.value)); // 비긴급: 결과
  });
};
```

---

## P-12: 빈번 변경값 ref 저장

**분류:** ALWAYS

**WHY:** 스크롤 위치, 마우스 좌표, 드래그 상태 등 초당 수십~수백 번 변하는 값을 state로 관리하면 매번 리렌더가 발생한다. ref에 저장하고 필요할 때만 읽는다.

```tsx
// ❌ BAD: 스크롤 위치를 state → 초당 30+ 리렌더
const [scrollY, setScrollY] = useState(0);
useEffect(() => {
  const handler = () => setScrollY(window.scrollY);
  window.addEventListener('scroll', handler);
  return () => window.removeEventListener('scroll', handler);
}, []);

// ✅ GOOD: ref로 저장, 필요할 때만 사용
const scrollY = useRef(0);
useEffect(() => {
  const handler = () => { scrollY.current = window.scrollY; };
  window.addEventListener('scroll', handler);
  return () => window.removeEventListener('scroll', handler);
}, []);
```

---

## P-13: AbortController 비동기 취소

**분류:** ALWAYS

**WHY:** 검색어가 빠르게 바뀔 때, 이전 요청이 늦게 도착하면 최신 결과를 덮어쓴다 (레이스 컨디션). AbortController로 이전 요청을 취소하면 대역폭도 절약되고 결과도 정확하다.

```tsx
// ✅ GOOD: cleanup에서 abort
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/search?q=${query}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setResults)
    .catch(e => { if (e.name !== 'AbortError') throw e; });
  return () => controller.abort();
}, [query]);
```

---

## P-14: 객체/배열 의존성 primitive 추출

**분류:** ALWAYS

**WHY:** useEffect/useMemo의 의존성에 객체/배열을 넣으면 매 렌더마다 새 참조로 인해 항상 "변경됨"으로 판정된다. primitive 값을 추출하거나 부모에서 useMemo로 안정화한다.

```tsx
// ❌ BAD: filters 객체가 매 렌더마다 새 참조
useEffect(() => {
  fetchUsers(filters);
}, [filters]);  // 매 렌더마다 실행

// ✅ GOOD: primitive 추출
useEffect(() => {
  fetchUsers({ role: filters.role, status: filters.status });
}, [filters.role, filters.status]);  // 실제 값 변경 시에만 실행

// ✅ GOOD: 부모에서 useMemo
const filters = useMemo(() => ({ role, status }), [role, status]);
```
