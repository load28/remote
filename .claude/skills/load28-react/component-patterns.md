# 컴포넌트 설계 패턴

## C-01: 컴포넌트 내부 컴포넌트 정의 금지

**분류:** NEVER

**WHY:** 렌더 함수 안에서 컴포넌트를 정의하면 매 렌더마다 새로운 함수 참조가 생성된다. React reconciler는 이를 **다른 컴포넌트 타입**으로 인식하여 기존 인스턴스를 언마운트하고 새로 마운트한다. 결과: state 소실, input 포커스 해제, 애니메이션 리셋.

```tsx
// ❌ BAD: 매 렌더마다 Child가 새 타입으로 생성됨
function Parent() {
  const Child = () => <input />;  // 새 함수 참조
  return <Child />;               // input이 매번 언마운트 → 포커스 소실
}

// ✅ GOOD: 외부에 정의
const Child = () => <input />;

function Parent() {
  return <Child />;
}
```

---

## C-02: 조건부 훅 호출 금지

**분류:** NEVER

**WHY:** React는 Hook 호출 순서로 각 Hook의 상태를 추적한다 (linked list). 조건문/반복문 안에서 Hook을 호출하면 렌더마다 호출 순서가 달라져 상태가 뒤섞인다.

```tsx
// ❌ BAD: 조건부 Hook 호출
function UserProfile({ userId }: { userId?: string }) {
  if (!userId) return null;        // 여기서 early return
  const [user] = useState(null);   // 조건에 따라 호출 안 될 수 있음 → 에러
}

// ✅ GOOD: Hook은 항상 최상위에서 호출
function UserProfile({ userId }: { userId?: string }) {
  const [user, setUser] = useState<User | null>(null);

  if (!userId) return null;        // Hook 호출 이후에 early return
  return <div>{user?.name}</div>;
}
```

---

## C-03: 배열 인덱스 key 금지 (동적 리스트)

**분류:** NEVER (리스트가 추가/삭제/정렬되는 경우)

**WHY:** React는 `key`로 엘리먼트 identity를 추적한다. 인덱스를 key로 쓰면 항목이 추가/삭제/정렬될 때 key가 다른 데이터를 가리키게 되어, input 값이 엉뚱한 항목에 남거나 애니메이션이 틀어진다.

```tsx
// ❌ BAD: 인덱스 key → 삭제/정렬 시 상태 불일치
{items.map((item, index) => (
  <TodoItem key={index} item={item} />
))}

// ✅ GOOD: 고유 ID를 key로 사용
{items.map((item) => (
  <TodoItem key={item.id} item={item} />
))}
```

**예외:** 정적 리스트(절대 변하지 않는 메뉴 등)에서는 인덱스 key 허용.

---

## C-04: props 7개 이하

**분류:** NEVER (7개 초과)

**WHY:** props가 많다는 것은 컴포넌트가 너무 많은 일을 하고 있다는 신호다. 7개를 넘으면 SRP 위반을 의심하고 분리를 검토한다.

```tsx
// ❌ BAD: 11개 props → 역할이 너무 많음
interface Props {
  user: User; avatar: string; isOnline: boolean;
  messages: Message[]; onSendMessage: () => void;
  theme: Theme; locale: string; timezone: string;
  notifications: Notification[]; onDismiss: () => void;
  isAdmin: boolean;
}

// ✅ GOOD: 관련 props를 객체로 그룹화하거나 컴포넌트 분리
interface UserCardProps {
  user: User;
  isOnline: boolean;
  onAvatarClick: () => void;
}
```

---

## C-05: 파일 250줄 이하

**분류:** NEVER (250줄 초과)

**WHY:** 250줄을 넘는 컴포넌트 파일은 높은 확률로 여러 관심사를 혼합하고 있다. 커스텀 훅 추출, 하위 컴포넌트 분리, 비즈니스 로직 추출을 통해 줄인다.

**검증:** `wc -l`로 파일 줄 수 확인. 250줄 초과 시 분리 필요.

---

## C-06: 불필요한 wrapper div 금지

**분류:** NEVER

**WHY:** 의미없는 `<div>` 래퍼는 DOM 깊이를 증가시켜 CSS 선택자 복잡도, 접근성 트리 오염, 렌더링 성능에 영향을 준다.

```tsx
// ❌ BAD
return (
  <div>
    <Header />
    <Main />
  </div>
);

// ✅ GOOD
return (
  <>
    <Header />
    <Main />
  </>
);
```

**검증:** 스타일/레이아웃/시맨틱 역할 없이 단순히 복수 자식을 감싸기 위한 `<div>`가 있으면 Fragment로 교체.

---

## C-07: 단일 책임 원칙(SRP)

**분류:** ALWAYS

**WHY:** 하나의 컴포넌트가 하나의 역할만 담당하면 테스트, 재사용, 변경이 독립적으로 가능하다.

```tsx
// ❌ BAD: 데이터 fetch + 필터링 + 렌더링 + 페이지네이션
function UserListPage() {
  // 200줄의 혼합 로직...
}

// ✅ GOOD: 역할별 분리
function UserListPage() {                    // 조합만 담당
  const { users, pagination } = useUsers();
  return (
    <PageLayout>
      <UserFilters />
      <UserList users={users} />
      <Pagination {...pagination} />
    </PageLayout>
  );
}
```

**검증:** 컴포넌트 역할을 "~하고(and) ~하는" 없이 한 문장으로 설명할 수 없으면 분리 필요.

---

## C-08: 합성(Composition) 우선

**분류:** ALWAYS

**WHY:** props로 모든 변형을 제어하면 컴포넌트가 비대해진다. `children`과 render props를 활용하면 소비자가 내부 구조를 유연하게 결정할 수 있다.

```tsx
// ❌ BAD: props로 모든 변형 제어
<Card
  title="Hello"
  subtitle="World"
  headerIcon={<Icon />}
  footerAction={<Button />}
  showDivider={true}
/>

// ✅ GOOD: 합성으로 유연하게
<Card>
  <Card.Header>
    <Icon />
    <h2>Hello</h2>
  </Card.Header>
  <Card.Body>World</Card.Body>
  <Card.Footer>
    <Button />
  </Card.Footer>
</Card>
```

**검증:** 컴포넌트에 `renderXxx`, `xxxContent`, `xxxIcon` 같은 슬롯 props가 3개 이상이면 합성으로 전환 검토.

---

## C-09: Compound Component 패턴

**분류:** ALWAYS (복잡한 멀티파트 UI)

**WHY:** 관련 컴포넌트가 암묵적으로 상태를 공유하면서도 소비자에게는 선언적 API를 제공한다. Select, Accordion, Tabs 같은 멀티파트 UI에 적합.

```tsx
// ✅ GOOD: Compound Component
<Select value={selected} onChange={setSelected}>
  <Select.Trigger>
    <Select.Value placeholder="Choose..." />
  </Select.Trigger>
  <Select.Content>
    <Select.Item value="a">Option A</Select.Item>
    <Select.Item value="b">Option B</Select.Item>
  </Select.Content>
</Select>
```

---

## C-10: 파일당 1 exported 컴포넌트

**분류:** ALWAYS

**WHY:** 파일당 하나의 exported 컴포넌트를 유지하면, 파일명으로 컴포넌트를 찾을 수 있고, 코드 스플리팅이 자연스럽다. 내부 헬퍼 컴포넌트(export하지 않는)는 같은 파일에 둘 수 있다.

**예외:** Compound Component 패턴(C-09)에서 `ParentComponent.SubComponent` 형태로 서브 컴포넌트를 부모에 할당하는 경우, 파일에서 부모만 export하고 서브 컴포넌트는 부모의 프로퍼티로 노출한다.

**검증:** 한 파일에서 2개 이상의 `export function`/`export const` 컴포넌트가 있으면 분리 필요 (Compound Component 제외).

---

## C-11: 외부 라이브러리 래퍼

**분류:** ALWAYS

**WHY:** UI 라이브러리(DatePicker, Toast 등)를 직접 사용하면 라이브러리 교체 시 사용처 전체를 수정해야 한다. 래퍼 컴포넌트를 통해 도메인 인터페이스로 변환한다.

A-09(Anti-Corruption Layer)의 컴포넌트 특화 적용이다. A-09가 HTTP 클라이언트/SDK 등 **서비스 계층** 래핑에 초점을 맞추는 반면, C-11은 **UI 컴포넌트** 래핑에 초점을 맞춘다.

```tsx
// ❌ BAD: 외부 DatePicker를 직접 사용 (12개 파일에서)
import { DatePicker } from 'some-datepicker-lib';
<DatePicker format="YYYY-MM-DD" locale="ko" onChange={...} />

// ✅ GOOD: 래퍼로 격리 — 교체 시 이 파일만 수정
// src/shared/components/DateInput.tsx
import { DatePicker } from 'some-datepicker-lib';

export interface DateInputProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
}

export function DateInput({ value, onChange, label }: DateInputProps) {
  return (
    <DatePicker
      format="YYYY-MM-DD"
      locale="ko"
      value={value}
      onChange={onChange}
      aria-label={label}
    />
  );
}
```

**검증:** 외부 UI 라이브러리 컴포넌트가 2개 이상 파일에서 직접 import되면 래퍼 생성 필요.

---

## C-12: key로 컴포넌트 상태 리셋

**분류:** ALWAYS (컨텍스트 전환 시)

**WHY:** React는 같은 위치의 같은 타입 컴포넌트를 재사용하고 state를 유지한다. `key`를 바꾸면 React가 완전히 새 인스턴스로 교체하므로, useEffect 체인으로 부분 리셋하는 것보다 안전하다.

```tsx
// ❌ BAD: useEffect로 수동 리셋 (한 프레임 동안 old + new 혼재)
function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  useEffect(() => {
    setMessages([]);  // 한 프레임 동안 이전 메시지가 보임
    setInput('');
  }, [roomId]);
}

// ✅ GOOD: key로 완전 리셋
function App({ roomId }: { roomId: string }) {
  return <ChatRoom key={roomId} roomId={roomId} />;
}
```

---

## C-13: 클로저 트랩 확인

**분류:** ALWAYS (검증)

**WHY:** `useCallback`이나 `addEventListener`로 등록한 콜백이 빈 의존성 배열(`[]`)로 한 번만 생성되면, 그 콜백은 생성 시점의 state를 영원히 캡처한다. 이후 state가 변해도 콜백은 옛날 값을 읽는다.

```tsx
// ❌ BAD: 빈 의존성 → count가 항상 0
const handleClick = useCallback(() => {
  alert(`Count: ${count}`);  // 항상 초기값
}, []);

// ✅ GOOD: 의존성에 count 포함
const handleClick = useCallback(() => {
  alert(`Count: ${count}`);
}, [count]);

// ✅ GOOD: ref로 최신 값 유지 (stable identity 필요 시)
const countRef = useRef(count);
countRef.current = count;
const handleClick = useCallback(() => {
  alert(`Count: ${countRef.current}`);
}, []);
```

---

## C-14: Feature 기반 폴더 구조

**분류:** ALWAYS

**WHY:** → A-02 참조. 이 규칙은 컴포넌트 설계 관점에서의 추가 가이드를 제공한다.

**컴포넌트 배치 원칙:**
- 하나의 feature에서만 사용되는 컴포넌트 → `features/<name>/components/`에 배치
- 2개 이상 feature에서 사용되는 컴포넌트 → `shared/components/`로 추출
- Feature 간 통신이 필요하면 → shared 이벤트, Context, 또는 상위 조합 컴포넌트로 해결

```
// ❌ BAD: feature 내부 컴포넌트를 다른 feature에서 직접 import
import { UserAvatar } from '@/features/user/components/UserAvatar';
// features/chat/components/ChatMessage.tsx에서 위와 같이 import

// ✅ GOOD: 공유 컴포넌트로 추출
import { Avatar } from '@/shared/components/Avatar';
// 또는 barrel을 통해
import { UserAvatar } from '@/features/user'; // user feature가 public API로 노출
```

**검증:** Feature 간 직접 import(`features/A/components/` → `features/B/components/`) 발견 시 REJECT.

---

## C-15: React 제거 예정/제거된 기능·타입 사용 금지

**분류:** NEVER

**WHY:** React 19에서 다수의 레거시 API와 타입이 제거되었다. 제거된 API를 사용하면 React 19 마이그레이션이 차단되고, 제거 예정 API는 향후 메이저 버전에서 동일한 문제를 야기한다. 현재 권장 패턴으로 대체한다.

**버전 주의:** 아래 "제거된 기능" 섹션은 **React 19 이상**에 해당한다. React 18 이하를 사용하는 프로젝트에서는 `forwardRef`, `defaultProps` 등이 여전히 유효하다. 프로젝트의 `package.json`에서 React 버전을 반드시 확인한다.

### 제거된 기능 (React 19+)

```tsx
// ❌ BAD: forwardRef (React 19에서 불필요 — ref가 일반 prop)
// ⚠️ React 18 이하에서는 forwardRef가 여전히 필요
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />;
});

// ✅ GOOD (React 19+): ref를 일반 prop으로 받음
function Input({ ref, ...props }: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}
```

```tsx
// ❌ BAD: 함수 컴포넌트 defaultProps (React 19에서 제거)
function Button({ size }: ButtonProps) { ... }
Button.defaultProps = { size: 'md' };

// ✅ GOOD: JS 기본 매개변수
function Button({ size = 'md' }: ButtonProps) { ... }
```

```tsx
// ❌ BAD: propTypes (런타임 타입 검사 — TypeScript로 대체)
import PropTypes from 'prop-types';
Button.propTypes = { size: PropTypes.oneOf(['sm', 'md', 'lg']) };

// ✅ GOOD: TypeScript interface (→ T-13 참조)
export interface ButtonProps {
  size?: 'sm' | 'md' | 'lg';
}
```

```tsx
// ❌ BAD: string ref (React 19에서 제거)
<input ref="myInput" />

// ✅ GOOD: useRef 또는 callback ref
const inputRef = useRef<HTMLInputElement>(null);
<input ref={inputRef} />
```

```tsx
// ❌ BAD: findDOMNode (React 19에서 제거)
import { findDOMNode } from 'react-dom';
const node = findDOMNode(componentInstance);

// ✅ GOOD: ref 사용
const nodeRef = useRef<HTMLDivElement>(null);
<div ref={nodeRef} />
```

```tsx
// ❌ BAD: Legacy Context API (React 19에서 제거)
class Parent extends Component {
  getChildContext() { return { theme: 'dark' }; }
  static childContextTypes = { theme: PropTypes.string };
}

// ✅ GOOD: createContext (→ S-07 참조)
const ThemeContext = createContext<string>('light');
```

```tsx
// ❌ BAD: UNSAFE_ lifecycle 메서드 (React 19에서 제거)
class MyComponent extends Component {
  UNSAFE_componentWillMount() { ... }
  UNSAFE_componentWillReceiveProps(nextProps) { ... }
  UNSAFE_componentWillUpdate(nextProps, nextState) { ... }
}

// ✅ GOOD: 함수 컴포넌트 + Hook으로 대체
function MyComponent(props: Props) {
  useEffect(() => { /* componentDidMount 대체 */ }, []);
  // props 변화 처리는 렌더 본문에서 직접 계산 (→ S-02 참조)
}
```

### 제거된 타입

```tsx
// ❌ BAD: 제거된 타입
const App: React.SFC<Props> = () => { ... };                // React.SFC 제거됨
const App: React.StatelessComponent<Props> = () => { ... }; // 동일, 제거됨
const App: React.VFC<Props> = () => { ... };                // React.VFC 제거됨
const App: React.VoidFunctionComponent<Props> = () => { ... }; // 동일, 제거됨

// ✅ GOOD: 일반 함수 선언
function App(props: Props) { ... }
```

**참고:** `React.FC`는 제거되지 않았으나, children을 더 이상 암묵적으로 포함하지 않는다. 일반 함수 선언을 권장한다.

### React 19 신규 API (활용 권장)

React 19 이상을 사용하는 프로젝트에서는 다음 새 API를 적극 활용한다:

| API | 용도 | 이전 패턴 |
|-----|------|-----------|
| `use()` | Promise/Context 읽기 (조건부 호출 가능) | `useContext` + `useEffect`+`useState` |
| `useOptimistic()` | 서버 응답 전 낙관적 UI 업데이트 | 수동 optimistic update 로직 |
| `useFormStatus()` | 폼 제출 상태 (pending 등) | 수동 isSubmitting state |
| `useActionState()` | 폼 액션 결과 + 에러 상태 관리 | useState + try/catch |

```tsx
// ✅ React 19: use()로 조건부 Context/Promise 읽기
function UserProfile({ shouldLoad }: { shouldLoad: boolean }) {
  if (!shouldLoad) return null;
  const user = use(userPromise); // 조건부 호출 가능 (useContext와 달리)
  return <div>{user.name}</div>;
}
```

**검증:** `forwardRef`, `defaultProps`, `propTypes`, string ref, `findDOMNode`, `UNSAFE_` lifecycle, Legacy Context, `React.SFC/VFC` 사용 시 REJECT (React 19+).

---

## C-16: 폼 필드 컴포넌트 분리 + useFormContext

**분류:** ALWAYS (React Hook Form 사용 시)

**WHY:** 모든 폼 필드를 하나의 컴포넌트에 넣으면 `formState` 변경(에러, dirty, touched 등)이 폼 전체를 re-render한다. 필드를 별도 컴포넌트로 분리하면 해당 필드의 상태만 변경될 때 그 컴포넌트만 re-render된다. `useFormContext`로 props drilling 없이 폼 메서드에 접근한다.

```tsx
// ❌ BAD: 모든 필드가 하나의 컴포넌트 → 한 필드 에러에 전체 re-render
function SignupForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name ? <span>{errors.name.message}</span> : null}
      <input {...register('email')} />
      {errors.email ? <span>{errors.email.message}</span> : null}
      <input {...register('password')} />
      {errors.password ? <span>{errors.password.message}</span> : null}
      {/* 더 많은 필드... */}
    </form>
  );
}

// ✅ GOOD: 필드별 컴포넌트 분리 + FormProvider
function SignupForm() {
  const methods = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <NameField />
        <EmailField />
        <PasswordField />
        <button type="submit">가입</button>
      </form>
    </FormProvider>
  );
}

function EmailField() {
  const { register, formState: { errors } } = useFormContext<SignupInput>();
  return (
    <div>
      <input {...register('email')} />
      {errors.email ? <span>{errors.email.message}</span> : null}
    </div>
  );
}
```

**적용 기준:** 폼 필드가 3개 이상이면 분리를 권장한다. 2개 이하의 단순 폼은 분리하지 않아도 된다.

**검증:** 3개 이상 필드를 가진 폼에서 `FormProvider`/`useFormContext` 없이 모든 필드를 하나의 컴포넌트에 배치하면 REJECT.
