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

**분류:** ALWAYS (이전 값 기반 업데이트 시)

**WHY:** React는 이벤트 핸들러 내 setState를 배칭한다. `setState(count + 1)`을 3번 호출하면 3번 모두 같은 `count`를 읽어 결과는 +1이다. 함수형 업데이트 `setState(prev => prev + 1)`은 항상 최신 값을 기반으로 계산한다.

**적용 범위:** 이전 state 값을 기반으로 새 값을 계산하는 경우에 적용한다. 이전 값과 무관하게 새 값을 설정하는 경우(`setState('hello')`, `setState(newUser)`)에는 직접 값 전달이 더 명확하다.

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

**WHY:** Context Provider의 value가 변경되면 해당 Context를 구독하는 **모든** 컴포넌트가 리렌더된다. `React.memo`로 감싸도 Context 업데이트에는 효과가 없다(단, Provider 내부에서 `useMemo`로 children을 메모이제이션하면 Provider의 자식 트리 리렌더를 방지할 수 있다). 하나의 Context에 auth + theme + locale을 넣으면, theme만 바뀌어도 auth를 읽는 컴포넌트까지 리렌더된다.

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
  → 전역 UI: Zustand 또는 Jotai — 개발자에게 선택을 묻는다 (아래 Decision Tree 참조)
  → URL 상태: router params / nuqs
```

### Zustand vs Jotai 선택 (개발자에게 질문)

전역 클라이언트 상태가 필요할 때, 아래 기준을 개발자에게 제시하고 선택을 받는다:

| Zustand이 적합한 경우 | Jotai가 적합한 경우 |
|----------------------|-------------------|
| 상태+액션이 강하게 결합된 트랜잭션 | 독립적 상태를 여러 곳에서 개별 구독 |
| persist/middleware 체이닝 필요 | 파생 상태 그래프가 복잡 (A→B→C) |
| React 외부 접근이 핵심 패턴 | 단일 boolean/primitive 전역 공유 |
| (API 인터셉터, WebSocket 핸들러) | Provider scope 격리/테스트 격리 필요 |
|  | 동적으로 생성/삭제되는 상태 (atomFamily) |

**AI는 기본값을 정하지 않는다. 개발자의 선택을 받은 후 해당 스키마(store.md 또는 atom.md)를 사용한다.**

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

**WHY:** `useState(expensiveComputation())`에서 `expensiveComputation()`은 매 렌더마다 호출된다. React는 반환값을 초기 렌더에서만 사용하고 이후 렌더에서는 무시하지만, **함수 호출 자체는 매번 일어나** CPU를 낭비한다. `useState(() => expensiveComputation())`처럼 함수를 전달하면 React가 초기 렌더에서만 이 함수를 호출한다.

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

```tsx
// ⚠️ 주의: 같은 핸들러에서 ref와 state의 타이밍 차이
const countRef = useRef(0);
const [count, setCount] = useState(0);

const handleClick = () => {
  countRef.current = 1;           // 즉시 반영
  setCount(1);                    // 다음 렌더까지 대기
  console.log(countRef.current);  // 1 (최신)
  console.log(count);             // 0 (아직 이전 값)
};
```

**검증:** 같은 핸들러 내에서 setState 직후 해당 state 값을 읽어 로직에 사용하는 코드가 있으면, 함수형 업데이트(S-06) 또는 ref 기반으로 전환 필요.

---

## S-13: controlled vs uncontrolled 택일

**분류:** ALWAYS

**WHY:** 한 컴포넌트 안에서 controlled(value + onChange)와 uncontrolled(defaultValue + ref)를 혼합하면, 어느 쪽이 진실 소스인지 모호해져 예측 불가능한 동작이 된다. 하나를 선택하고 일관되게 사용한다.

**검증:** 동일 input 요소에 `value`와 `defaultValue`가 동시에 존재하거나, `value` props를 받으면서 내부 useState로 별도 상태를 관리하면 REJECT.

---

## S-14: Context Provider value useMemo

**분류:** ALWAYS

**WHY:** Provider의 value prop에 매 렌더마다 새 객체를 전달하면, 내용이 동일해도 모든 소비자가 리렌더된다 (참조 불일치). useMemo로 실제 변경 시에만 새 참조를 생성한다. (→ S-07 예시 참조)

**검증:** Context Provider의 `value` prop에 inline 객체(`value={{ user, setUser }}`)가 있으면 `useMemo`로 감싸야 한다.

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

---

## S-17: mutation 훅에 onSuccess/onError 내장 금지

**분류:** NEVER

**WHY:** mutation 훅 내부에 `onSuccess`, `onError`, `onSettled` 콜백을 내장하면, 훅의 재사용성이 떨어지고 사용처마다 다른 후속 처리(모달 닫기, 페이지 이동, 토스트 표시 등)를 할 수 없다. 특히 `queryClient.invalidateQueries`를 훅 내부에 넣으면 훅이 쿼리 캐시 전략에 종속되어 단일 책임 원칙을 위반한다. 훅은 mutationFn만 정의하고, 후속 로직은 사용처에서 `mutate(data, { onSuccess, onError })`로 주입한다.

```tsx
// ❌ BAD: 훅 내부에 onSuccess 내장 → 재사용 불가
export function useUpdateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) => entityApi.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] }); // 캐시 전략 종속
      toast.success('저장 완료');  // UI 로직 종속
    },
  });
}

// ✅ GOOD: 훅은 mutationFn만, 후속 로직은 사용처에서
export function useUpdateEntity() {
  return useMutation({
    mutationFn: (input: UpdateInput) => entityApi.update(input),
  });
}

// 사용처 A: 모달 닫기 + invalidation
const updateEntity = useUpdateEntity();
const queryClient = useQueryClient();
updateEntity.mutate(input, {
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['entities'] });
    closeModal();
  },
});

// 사용처 B: 페이지 이동
updateEntity.mutate(input, {
  onSuccess: (data) => {
    navigate(`/entities/${data.id}`);
  },
});
```

---

## S-18: URL 상태 수동 조작 금지

**분류:** NEVER

**WHY:** URL 상태를 URLSearchParams·router.push 쿼리스트링·useSearchParams로 직접 조작하면, 특정 파라미터만 설정할 때 기존 파라미터가 유실된다(`?page=2&sort=asc`에서 page만 바꾸려다 sort 유실). 수동 파싱(`parseInt(params.get(...))`)은 타입 안전성이 없고 직렬화/역직렬화 불일치를 유발한다. nuqs는 내부적으로 기존 쿼리파람을 merge하고 타입 안전한 파서를 제공하여 이 문제를 원천 방지한다.

**전제 조건:** NuqsAdapter가 앱 최상위(layout.tsx 또는 main.tsx)에 설정되어 있어야 함.

```tsx
// ❌ BAD: URLSearchParams 직접 조작 → 기존 파라미터 유실
const handleSearch = (query: string) => {
  const params = new URLSearchParams();
  params.set('q', query);
  navigate(`?${params.toString()}`); // page, sort 등 전부 유실!
};

// ❌ BAD: useSearchParams 직접 조작
const [searchParams, setSearchParams] = useSearchParams();
searchParams.set('page', '2');
setSearchParams(searchParams);

// ❌ BAD: 수동 파싱 → 타입 불안전, 기본값 처리 누락
const params = new URLSearchParams(location.search);
const page = parseInt(params.get('page') || '1', 10);

// ❌ BAD: router.push로 쿼리스트링 직접 구성
router.push(`${pathname}?q=${query}&page=1`);

// ✅ GOOD: nuqs로 URL 상태 관리
const [filters, setFilters] = useQueryStates(searchParams);
setFilters({ q: query, page: 1 }); // 나머지 파라미터 자동 보존

// ✅ GOOD: 개별 파라미터도 nuqs로
const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
```

**예외:** API 호출 URL 구성용 URLSearchParams는 대상 아님 (httpClient 내부 등).

**검증:** 컴포넌트/훅에서 URL 쿼리파라미터를 읽거나 쓰면서 nuqs(useQueryState/useQueryStates/createSerializer)를 사용하지 않으면 REJECT.

---

## S-19: 컴포넌트당 useForm 1개

**분류:** NEVER (복수 useForm)

**WHY:** 하나의 컴포넌트에서 여러 `useForm`을 호출하면 폼 상태가 충돌하고, 어떤 `handleSubmit`이 어떤 필드를 관리하는지 추적이 불가능해진다. 복잡도가 기하급수적으로 증가하며, `FormProvider`/`useFormContext` 사용 시 중첩 Provider로 인한 혼란도 발생한다.

```tsx
// ❌ BAD: 하나의 컴포넌트에서 복수 useForm
function SettingsPage() {
  const profileForm = useForm<ProfileInput>();
  const passwordForm = useForm<PasswordInput>();
  // 어떤 form이 어떤 필드를 관리하는지 혼란
  return (
    <div>
      <input {...profileForm.register('name')} />
      <input {...passwordForm.register('currentPassword')} />
    </div>
  );
}

// ✅ GOOD: 폼 단위로 컴포넌트 분리
function SettingsPage() {
  return (
    <div>
      <ProfileForm />
      <PasswordForm />
    </div>
  );
}

function ProfileForm() {
  const { register, handleSubmit } = useForm<ProfileInput>();
  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

**검증:** 하나의 컴포넌트에서 `useForm`이 2회 이상 호출되면 REJECT. 폼 단위로 컴포넌트를 분리한다.

---

## S-20: register vs Controller 선택 기준

**분류:** ALWAYS

**WHY:** `register`는 비제어(uncontrolled) 방식으로 DOM에 직접 연결되어 re-render가 발생하지 않는다. `Controller`는 제어(controlled) 방식으로 렌더 사이클에 값을 동기화한다. 네이티브 HTML input에 `Controller`를 사용하면 불필요한 re-render가 발생하고, 커스텀 UI 컴포넌트에 `register`를 사용하면 ref 전달이 불가능하여 동작하지 않는다.

```tsx
// ❌ BAD: 네이티브 input에 Controller 사용 → 불필요한 re-render
<Controller
  name="email"
  control={control}
  render={({ field }) => <input {...field} />}
/>

// ✅ GOOD: 네이티브 input은 register
<input {...register('email')} />

// ✅ GOOD: 커스텀 UI 컴포넌트는 Controller
<Controller
  name="category"
  control={control}
  render={({ field }) => (
    <CustomSelect
      value={field.value}
      onChange={field.onChange}
      options={categories}
    />
  )}
/>
```

**검증:** 네이티브 HTML input(`<input>`, `<select>`, `<textarea>`)에 `Controller`를 사용하면 REJECT. 커스텀 UI 컴포넌트에 `register`를 사용하면 REJECT.

---

## S-21: validation은 zod resolver로 통합

**분류:** ALWAYS

**WHY:** `register`의 inline `validate` 옵션으로 규칙을 분산하면, 검증 로직이 여러 필드에 흩어져 전체 폼의 유효성 규칙을 파악할 수 없다. zod 스키마를 단일 진실 원천으로 사용하면 검증 규칙이 한곳에 집중되고, 스키마에서 TypeScript 타입이 자동 추론(`z.infer<typeof schema>`)되어 타입 안전성도 확보된다.

```tsx
// ❌ BAD: inline validate로 규칙 분산
const { register } = useForm<FormInput>();
<input {...register('email', {
  required: '이메일 필수',
  pattern: { value: /^[^\s@]+@[^\s@]+$/, message: '이메일 형식' },
})} />
<input {...register('age', {
  min: { value: 18, message: '18세 이상' },
  validate: v => v <= 100 || '100세 이하',
})} />

// ✅ GOOD: zod 스키마로 통합
const formSchema = z.object({
  email: z.string().min(1, '이메일 필수').email('이메일 형식'),
  age: z.number().min(18, '18세 이상').max(100, '100세 이하'),
});

type FormInput = z.infer<typeof formSchema>;

const { register } = useForm<FormInput>({
  resolver: zodResolver(formSchema),
});
```

**예외:** 서버 응답 기반 비동기 검증(예: 이메일 중복 확인)은 zod 스키마로 표현이 어려울 수 있다. 이 경우 `setError`로 서버 에러를 주입하되, 클라이언트 검증은 여전히 zod로 통합한다.

**검증:** `register`에 `validate`, `required`, `pattern`, `min`, `max` 등 inline 검증 옵션이 있으면서 `zodResolver`를 사용하지 않으면 REJECT.

---

## S-22: watch 남용 금지 — formState.errors 구독 우선

**분류:** NEVER (불필요한 watch)

**WHY:** `watch()`는 감시 대상 필드가 변경될 때마다 컴포넌트 전체를 re-render한다. 폼 전체를 `watch()`하면 어떤 필드든 한 글자만 타이핑해도 전체 폼이 re-render된다. 에러 표시만 필요하면 `formState.errors`로 충분하고, 특정 필드 값이 필요하면 `useWatch`를 별도 컴포넌트에서 사용하여 re-render 범위를 격리한다.

```tsx
// ❌ BAD: 전체 watch → 모든 타이핑에 전체 re-render
function SignupForm() {
  const { watch, register } = useForm();
  const values = watch(); // 모든 필드 감시 → 전체 re-render
  return (
    <div>
      <input {...register('name')} />
      <input {...register('email')} />
      {values.name && <span>Welcome, {values.name}</span>}
    </div>
  );
}

// ✅ GOOD: useWatch를 별도 컴포넌트에서 사용 → re-render 격리
function WelcomeMessage() {
  const name = useWatch({ name: 'name' });
  return name ? <span>Welcome, {name}</span> : null;
}

function SignupForm() {
  const { register, formState: { errors } } = useForm();
  return (
    <FormProvider {...methods}>
      <input {...register('name')} />
      {errors.name ? <span>{errors.name.message}</span> : null}
      <WelcomeMessage />
    </FormProvider>
  );
}
```

**검증:** `watch()`가 폼 전체를 감시하거나, `useWatch`를 사용하지 않고 `watch('fieldName')`을 폼 루트 컴포넌트에서 호출하면 REJECT. `useWatch`를 별도 컴포넌트로 분리하거나 `formState.errors`로 대체한다.

---

## S-23: atom은 모듈 레벨에서 선언

**분류:** NEVER (컴포넌트 내부 atom 선언)

**WHY:** `atom()`은 호출할 때마다 새로운 atom 인스턴스를 생성한다. 컴포넌트 내부에서 `atom()`을 호출하면 매 렌더마다 새 atom이 생성되어, 이전 atom의 구독이 끊기고 상태가 유실된다. 메모리 누수도 발생한다 (GC되지 않는 atom store 참조).

```tsx
// ❌ BAD: 컴포넌트 내부 atom 생성 → 매 렌더마다 새 atom
function Counter() {
  const countAtom = atom(0); // 렌더마다 새 인스턴스!
  const [count, setCount] = useAtom(countAtom);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// ✅ GOOD: 모듈 레벨에서 선언
const countAtom = atom(0);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**검증:** 컴포넌트/훅 함수 내부에서 `atom()`, `atomFamily()`, `atomWithStorage()` 등 atom 생성 함수가 호출되면 REJECT. 모듈 레벨(파일 최상위)에서만 선언한다.

---

## S-24: derived atom에서 비동기 호출 금지

**분류:** NEVER (암묵적 비동기 derived atom)

**WHY:** `atom((get) => ...)` 형태의 derived atom에서 비동기 호출을 하면, 해당 atom을 읽는 컴포넌트에서 암묵적으로 Suspense가 트리거된다. 상위에 `<Suspense>` boundary가 없으면 앱 전체가 중단된다. 비동기가 필요한 경우 명시적으로 async atom으로 분리하고, 서버 데이터 fetch가 목적이면 TanStack Query를 사용한다.

```tsx
// ❌ BAD: derived atom에 비동기 혼입 → 암묵적 Suspense
const userProfileAtom = atom(async (get) => {
  const userId = get(userIdAtom);
  const response = await fetch(`/api/users/${userId}`); // 서버 fetch!
  return response.json();
});

// ✅ GOOD: 서버 데이터는 TanStack Query [S-08]
function useUserProfile() {
  const userId = useAtomValue(userIdAtom);
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => httpClient.get<User>(`/users/${userId}`),
  });
}

// ✅ GOOD: 순수 클라이언트 계산만 derived atom으로
const fullNameAtom = atom((get) => {
  const first = get(firstNameAtom);
  const last = get(lastNameAtom);
  return `${first} ${last}`;
});
```

**검증:** `atom((get) => ...)` 또는 `atom(async (get) => ...)` 내부에서 `fetch`, `httpClient`, API 호출이 있으면 REJECT. 서버 데이터는 TanStack Query, 순수 클라이언트 계산만 derived atom.

---

## S-25: atomFamily 키 직렬화 보장

**분류:** ALWAYS

**WHY:** `atomFamily`는 파라미터를 `===` (참조 비교)로 비교하여 기존 atom을 재사용할지 결정한다. 객체를 키로 사용하면 내용이 같아도 매번 새 참조이므로 새 atom이 생성된다. 이는 메모리 누수와 상태 불일치를 유발하며, 디버깅이 매우 어렵다.

```tsx
// ❌ BAD: 객체 키 → 매번 새 atom 생성
const entityAtomFamily = atomFamily((params: { type: string; id: string }) =>
  atom(null)
);
// 호출할 때마다 새 atom:
entityAtomFamily({ type: 'user', id: '1' }); // atom A
entityAtomFamily({ type: 'user', id: '1' }); // atom B (다른 인스턴스!)

// ✅ GOOD: primitive 키 사용
const entityAtomFamily = atomFamily((id: string) => atom(null));

// ✅ GOOD: 복합 키가 필요하면 문자열로 직렬화
const entityAtomFamily = atomFamily((key: string) => atom(null));
// 사용: entityAtomFamily(`${type}:${id}`)
```

**검증:** `atomFamily`의 파라미터 타입이 객체/배열이면 REJECT. primitive(string, number) 사용하거나 문자열 직렬화로 변환한다.

---

## S-26: atom debugLabel 필수

**분류:** ALWAYS (개발 환경)

**WHY:** Jotai DevTools에서 atom은 기본적으로 `atom1`, `atom2` 같은 익명 라벨로 표시된다. 상태 그래프가 복잡해지면 어떤 atom이 어떤 역할인지 구분할 수 없어 디버깅이 불가능해진다. `debugLabel`을 설정하면 DevTools에서 `countAtom`, `userNameAtom` 같은 의미있는 이름으로 표시된다.

```tsx
// ❌ BAD: debugLabel 없음 → DevTools에서 "atom1", "atom2"
const countAtom = atom(0);
const userNameAtom = atom('');

// ✅ GOOD: debugLabel 설정
const countAtom = atom(0);
countAtom.debugLabel = 'countAtom';

const userNameAtom = atom('');
userNameAtom.debugLabel = 'userNameAtom';
```

**검증:** atom 선언 직후 `debugLabel` 할당이 없으면 REJECT.

---

## S-27: write-only atom으로 복잡한 업데이트 캡슐화

**분류:** ALWAYS (복수 atom 동시 업데이트 시)

**WHY:** 여러 atom을 동시에 업데이트하는 로직이 컴포넌트에 흩어지면, 동일한 업데이트 패턴이 여러 곳에서 중복되고 일관성이 깨진다. write-only atom(`atom(null, (get, set, arg) => ...)`)으로 캡슐화하면 업데이트 로직이 한곳에 집중되고 컴포넌트는 `useSetAtom`으로 액션만 디스패치한다.

```tsx
// ❌ BAD: 컴포넌트에서 여러 atom을 직접 업데이트 → 로직 분산
function ResetButton() {
  const setCount = useSetAtom(countAtom);
  const setFilter = useSetAtom(filterAtom);
  const setPage = useSetAtom(pageAtom);

  const handleReset = () => {
    setCount(0);
    setFilter('all');
    setPage(1);
  };
  return <button onClick={handleReset}>Reset</button>;
}

// ✅ GOOD: write-only atom으로 캡슐화
const resetActionAtom = atom(null, (_get, set) => {
  set(countAtom, 0);
  set(filterAtom, 'all');
  set(pageAtom, 1);
});
resetActionAtom.debugLabel = 'resetActionAtom';

function ResetButton() {
  const reset = useSetAtom(resetActionAtom);
  return <button onClick={reset}>Reset</button>;
}
```

**검증:** 하나의 핸들러에서 3개 이상 atom을 `set`하는 패턴이 2개 이상 컴포넌트에서 반복되면 REJECT. write-only atom으로 캡슐화한다.

---

## S-28: 폼 상태는 React Hook Form이 소유

**분류:** NEVER (폼 값을 외부 store에 복제)

**WHY:** React Hook Form은 내부적으로 폼 상태를 비제어(uncontrolled) 방식으로 관리하여 re-render를 최소화한다. 폼 필드 값을 Zustand/Jotai에 동기화하면 React Hook Form의 성능 최적화가 무효화되고, 두 곳의 상태가 불일치할 수 있는 동기화 버그가 발생한다.

```tsx
// ❌ BAD: 폼 값을 Jotai atom에 동기화 → 이중 상태 관리
const formDataAtom = atom<FormInput | null>(null);

function SignupForm() {
  const { register, watch } = useForm<FormInput>();
  const setFormData = useSetAtom(formDataAtom);

  useEffect(() => {
    const subscription = watch((values) => {
      setFormData(values as FormInput); // 매 타이핑마다 atom 업데이트
    });
    return () => subscription.unsubscribe();
  }, [watch, setFormData]);
}

// ✅ GOOD: 폼 상태는 React Hook Form이 소유
function SignupForm() {
  const { register, handleSubmit } = useForm<FormInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = (data: FormInput) => {
    // 제출 시에만 외부로 전달
    submitToServer(data);
  };

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

**검증:** `watch`의 구독 결과를 Zustand store/Jotai atom/React Context에 동기화하는 코드가 있으면 REJECT. 폼 라이프사이클 내에서는 React Hook Form이 유일한 상태 소유자다.

---

## S-29: 폼 제출 결과만 외부 store에 반영

**분류:** ALWAYS

**WHY:** S-28에서 폼 상태의 소유권을 React Hook Form에 두었다. 앱 전역 상태(Zustand/Jotai)에는 폼 **제출이 성공한 결과**만 반영해야 한다. 이렇게 하면 폼 라이프사이클(입력 중 → 검증 → 제출)과 앱 상태의 경계가 명확해지고, 사용자가 폼을 취소해도 앱 상태가 오염되지 않는다.

```tsx
// ❌ BAD: 폼 입력 중에 store 업데이트
function ProfileForm() {
  const { register, watch } = useForm<ProfileInput>();
  const setProfile = useSetAtom(profileAtom);

  // 입력할 때마다 store 반영 → 취소해도 store가 오염됨
  useEffect(() => {
    const sub = watch((values) => setProfile(values as ProfileInput));
    return () => sub.unsubscribe();
  }, [watch, setProfile]);
}

// ✅ GOOD: 제출 성공 시에만 store 반영
function ProfileForm() {
  const { register, handleSubmit } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });
  const setProfile = useSetAtom(profileAtom);
  const updateProfile = useUpdateProfile();

  const onSubmit = (data: ProfileInput) => {
    updateProfile.mutate(data, {
      onSuccess: (saved) => {
        setProfile(saved); // 서버 응답 성공 후에만 store 반영
      },
    });
  };

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

**검증:** `handleSubmit`의 콜백 외부에서 폼 값을 global store에 반영하는 코드가 있으면 REJECT. `onSubmit` 콜백 (또는 mutation의 `onSuccess`) 내에서만 외부 store를 업데이트한다.
