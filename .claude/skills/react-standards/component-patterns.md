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

---

## C-11: 외부 라이브러리 래퍼

**분류:** ALWAYS

**WHY:** UI 라이브러리(DatePicker, Toast 등)를 직접 사용하면 라이브러리 교체 시 사용처 전체를 수정해야 한다. 래퍼 컴포넌트를 통해 도메인 인터페이스로 변환한다. (→ A-09 Anti-Corruption Layer 참조)

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

**WHY:** → A-02 참조. Feature 간 직접 import 금지, 공유 필요 시 shared/ 추출.
