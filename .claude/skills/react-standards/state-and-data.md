# 상태관리 & 데이터 흐름

## S-01: state 직접 변경(mutate) 금지

**분류:** NEVER

**WHY:** React는 `Object.is()`로 이전 state와 새 state를 비교하여 리렌더 여부를 결정한다. 객체를 직접 변경하면 참조가 동일하므로 React가 변경을 감지하지 못하고 UI가 갱신되지 않는다.

```tsx
// ❌ BAD: 직접 변경
const [items, setItems] = useState(['a', 'b']);
const handleAdd = () => {
  items.push('c');     // 원본 배열 직접 변경
  setItems(items);     // 같은 참조 → React가 변경 무시
};

// ✅ GOOD: 새 참조 생성
const handleAdd = () => {
  setItems(prev => [...prev, 'c']);  // 새 배열 생성
};
```

---

## S-02: useEffect 내 파생 상태 계산 금지

**분류:** NEVER

**WHY:** useEffect로 파생 상태를 계산하면 불필요한 추가 렌더 사이클이 발생한다. 렌더 1(원본 변경) → useEffect 실행 → setState → 렌더 2(파생 값 갱신). 렌더 본문에서 직접 계산하면 렌더 1번으로 끝난다.

```tsx
// ❌ BAD: useEffect로 파생 상태 → 이중 렌더
const [items, setItems] = useState<Item[]>([]);
const [total, setTotal] = useState(0);
useEffect(() => {
  setTotal(items.reduce((sum, item) => sum + item.price, 0));
}, [items]);

// ✅ GOOD: 렌더 중 직접 계산
const [items, setItems] = useState<Item[]>([]);
const total = items.reduce((sum, item) => sum + item.price, 0);

// ✅ GOOD: 비용이 크면 useMemo
const total = useMemo(
  () => items.reduce((sum, item) => sum + item.price, 0),
  [items]
);
```

---

## S-03: 파생 가능한 값 state 저장 금지

**분류:** NEVER

**WHY:** 다른 state에서 계산 가능한 값을 별도 state로 저장하면 두 개의 진실 소스(source of truth)가 생긴다. 동기화가 어긋나면 UI가 불일치한다.

```tsx
// ❌ BAD: firstName + lastName에서 파생 가능한 fullName을 state로
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [fullName, setFullName] = useState('');  // 불필요한 state

// ✅ GOOD: 렌더 중 계산
const fullName = `${firstName} ${lastName}`;
```

---

## S-04: 수동 fetch 패턴 금지

**분류:** NEVER

**WHY:** `useEffect + useState + fetch` 조합은 로딩/에러 상태, 캐싱, 중복 요청 제거, 레이스 컨디션, 리페치 등을 모두 직접 구현해야 한다. TanStack Query/SWR이 이 모든 것을 처리한다.

```tsx
// ❌ BAD: 수동 fetch
const [users, setUsers] = useState<User[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<Error | null>(null);
useEffect(() => {
  setIsLoading(true);
  fetch('/api/users')
    .then(r => r.json())
    .then(setUsers)
    .catch(setError)
    .finally(() => setIsLoading(false));
}, []);

// ✅ GOOD: TanStack Query
const { data: users, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => httpClient.get<User[]>('/api/users'),
});
```

---

## S-05: props → state 복사 패턴 금지

**분류:** NEVER

**WHY:** useEffect로 props를 state에 동기화하면 부모가 리렌더될 때마다 사용자의 로컬 수정(input 입력 등)이 덮어씌워진다. 완전 제어(controlled) 또는 완전 비제어(uncontrolled with key) 중 하나를 택한다.

```tsx
// ❌ BAD: props를 state에 복사 → 부모 리렌더 시 입력값 덮어쓰기
function EmailInput({ email }: { email: string }) {
  const [localEmail, setLocalEmail] = useState(email);
  useEffect(() => {
    setLocalEmail(email);  // 사용자가 타이핑 중인데 부모가 리렌더하면 덮어씀
  }, [email]);
  return <input value={localEmail} onChange={e => setLocalEmail(e.target.value)} />;
}

// ✅ GOOD: 완전 제어
function EmailInput({ email, onEmailChange }: {
  email: string;
  onEmailChange: (v: string) => void;
}) {
  return <input value={email} onChange={e => onEmailChange(e.target.value)} />;
}

// ✅ GOOD: 완전 비제어 + key로 리셋
<EmailInput key={userId} defaultEmail={user.email} />
```

---

## S-06: 함수형 setState 사용

**분류:** ALWAYS

**WHY:** React는 이벤트 핸들러 내 setState를 배칭한다. `setState(count + 1)`을 3번 호출하면 3번 모두 같은 `count`를 읽어 결과는 +1이다. 함수형 업데이트 `setState(prev => prev + 1)`은 항상 최신 값을 기반으로 계산한다.

```tsx
// ❌ BAD: 직접 값 → 배칭 시 마지막 값만 적용
const handleClick = () => {
  setCount(count + 1);  // count=0 읽음
  setCount(count + 1);  // count=0 읽음 → 결과: 1
  setCount(count + 1);  // count=0 읽음 → 결과: 1
};

// ✅ GOOD: 함수형 업데이트 → 항상 최신 기반
const handleClick = () => {
  setCount(prev => prev + 1);  // 0→1
  setCount(prev => prev + 1);  // 1→2
  setCount(prev => prev + 1);  // 2→3
};
```

---

## S-07: Context 분리

**분류:** NEVER (단일 Context에 모든 상태)

**WHY:** Context Provider의 value가 변경되면 해당 Context를 구독하는 **모든** 컴포넌트가 리렌더된다. `React.memo`도 Context 업데이트는 우회할 수 없다. 하나의 Context에 auth + theme + locale을 넣으면, theme만 바뀌어도 auth를 읽는 컴포넌트까지 리렌더된다.

```tsx
// ❌ BAD: 모든 것을 하나의 Context에
const AppContext = createContext<AppState | null>(null);
function AppProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  return (
    <AppContext.Provider value={{ user, setUser, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}

// ✅ GOOD: 변경 빈도별로 분리
const UserContext = createContext<UserState | null>(null);
const ThemeContext = createContext<ThemeState | null>(null);

function AppProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const userValue = useMemo(() => ({ user, setUser }), [user]);
  const themeValue = useMemo(() => ({ theme, setTheme }), [theme]);
  return (
    <UserContext.Provider value={userValue}>
      <ThemeContext.Provider value={themeValue}>
        {children}
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}
```

---

## S-08: 서버 상태 / 클라이언트 상태 분리

**분류:** ALWAYS

**WHY:** 서버 상태(API 응답)는 캐싱, 무효화, 재시도, 페이지네이션이 필요하다. 클라이언트 상태(UI 토글, 폼 입력)는 동기적이다. 이 둘을 같은 도구로 관리하면 불필요한 복잡성이 생긴다.

```
서버 상태: TanStack Query / SWR
  → 캐싱, 중복 제거, 자동 리페치, optimistic update

클라이언트 상태:
  → 로컬 UI: useState / useReducer
  → 전역 UI: Zustand / Jotai (정말 필요할 때만)
  → URL 상태: router params / nuqs
```

---

## S-09: 상태 코로케이션

**분류:** ALWAYS

**WHY:** 상태를 불필요하게 높은 레벨에 두면, 해당 상태가 변경될 때마다 불필요한 하위 트리 전체가 리렌더된다. 상태는 실제로 사용하는 곳에서 가장 가까운 곳에 둔다.

```
판단 기준:
1. 한 컴포넌트만 사용 → 해당 컴포넌트의 useState
2. 형제가 필요 → 가장 가까운 공통 부모로 lift
3. 멀리 떨어진 여러 곳 → Context 또는 global state
```

---

## S-10: lazy state 초기화

**분류:** ALWAYS

**WHY:** `useState(expensiveComputation())`은 매 렌더마다 `expensiveComputation()`을 실행한다(결과는 초기화 시에만 사용되지만). 함수를 전달하면 초기 렌더에서만 실행된다.

```tsx
// ❌ BAD: 매 렌더마다 JSON.parse 실행
const [state, setState] = useState(JSON.parse(localStorage.getItem('key') ?? '{}'));

// ✅ GOOD: 초기 렌더에서만 실행
const [state, setState] = useState(() => JSON.parse(localStorage.getItem('key') ?? '{}'));
```

---

## S-11: 렌더에 안 쓰이는 값은 ref

**분류:** ALWAYS

**WHY:** 타이머 ID, 스크롤 위치, 이전 값 등은 UI에 표시되지 않는다. 이를 state로 관리하면 변경할 때마다 불필요한 리렌더가 발생한다. `useRef`는 `.current`를 변경해도 리렌더를 트리거하지 않는다.

```tsx
// ❌ BAD: 타이머 ID를 state로 → 불필요한 리렌더
const [timerId, setTimerId] = useState<number | null>(null);

// ✅ GOOD: ref로 관리
const timerRef = useRef<number | null>(null);
useEffect(() => {
  timerRef.current = window.setInterval(tick, 1000);
  return () => { if (timerRef.current) clearInterval(timerRef.current); };
}, []);
```

---

## S-12: ref/state 동기화 타이밍 확인

**분류:** ALWAYS (검증)

**WHY:** ref는 즉시 변경되지만, state는 다음 렌더까지 이전 값을 유지한다. 같은 핸들러에서 setState 후 ref.current를 읽으면 ref는 최신이지만 state는 아직 이전 값이다. 이 차이를 인지하고 사용한다.

---

## S-13: controlled vs uncontrolled 택일

**분류:** ALWAYS

**WHY:** 한 컴포넌트 안에서 controlled(value + onChange)와 uncontrolled(defaultValue + ref)를 혼합하면, 어느 쪽이 진실 소스인지 모호해져 예측 불가능한 동작이 된다. 하나를 선택하고 일관되게 사용한다.

---

## S-14: Context Provider value useMemo

**분류:** ALWAYS

**WHY:** Provider의 value prop에 매 렌더마다 새 객체를 전달하면, 내용이 동일해도 모든 소비자가 리렌더된다 (참조 불일치). useMemo로 실제 변경 시에만 새 참조를 생성한다. (→ S-07 예시 참조)

---

## S-15: localStorage 스키마 버전 관리

**분류:** ALWAYS (해당 시)

**WHY:** localStorage 데이터 구조가 변경되면 이전 버전 사용자의 브라우저에는 옛 구조의 데이터가 남아있다. 버전을 관리하지 않으면 `JSON.parse` 시 런타임 에러가 발생하거나 데이터가 조용히 잘못 해석된다.

```tsx
// ✅ GOOD: 버전 키 포함
const STORAGE_VERSION = 2;
const key = `app_settings_v${STORAGE_VERSION}`;
```

---

## S-16: useEffect cleanup 구현

**분류:** ALWAYS

**WHY:** cleanup 없는 useEffect는 메모리 누수(구독 미해제), 레이스 컨디션(취소 안 된 fetch), 좀비 리스너(언마운트 후에도 동작)를 유발한다. StrictMode 이중 실행에서 cleanup 누락이 드러난다.

```tsx
// ❌ BAD: cleanup 없음
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
  // 언마운트 시 interval 계속 동작 → 메모리 누수
}, []);

// ✅ GOOD: cleanup으로 정리
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
  return () => clearInterval(id);
}, []);

// ✅ GOOD: fetch 취소
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/search?q=${query}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setResults)
    .catch(e => { if (e.name !== 'AbortError') throw e; });
  return () => controller.abort();
}, [query]);
```
