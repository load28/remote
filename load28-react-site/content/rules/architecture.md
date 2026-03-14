# 아키텍처 원칙

## A-01: 단방향 의존성

**분류:** NEVER (역방향/횡단 참조)

**WHY:** 양방향 의존성은 순환 참조를 만들고, 하나의 변경이 예측 불가능한 곳에 전파된다. 의존성 그래프는 반드시 DAG(Directed Acyclic Graph)여야 한다.

```
허용되는 방향:
  app → features → shared
  app → shared

금지되는 방향:
  shared → features    (공유 모듈이 특정 기능을 알면 안 됨)
  features → features  (기능 간 직접 참조 금지)
```

```tsx
// ❌ BAD: shared 컴포넌트가 특정 feature를 import
// src/components/Button.tsx
import { useAuth } from '@/features/auth/useAuth';

// ❌ BAD: feature가 다른 feature를 직접 import
// src/features/comments/CommentList.tsx
import { DiscussionHeader } from '@/features/discussions/DiscussionHeader';

// ✅ GOOD: feature는 shared만 import
// src/features/comments/CommentList.tsx
import { Card } from '@/components/Card';
import { useCurrentUser } from '@/hooks/useCurrentUser';
```

**검증:** import 경로가 features → features, shared → features로 향하면 REJECT.

---

## A-02: Feature 기반 폴더 구조

**분류:** ALWAYS

**WHY:** 타입별 구조(components/, hooks/, services/)는 하나의 기능을 추가/삭제할 때 5-6개 디렉토리를 동시에 수정해야 한다. Feature 기반 구조는 기능 단위로 자기 완결적이다.

```
// ❌ BAD: 타입별 구조
src/components/UserProfile.tsx
src/hooks/useUserProfile.ts
src/services/userProfileApi.ts
src/types/userProfile.ts

// ✅ GOOD: Feature 기반 구조
src/features/user-profile/
  components/UserProfile.tsx
  hooks/useUserProfile.ts
  api/userProfileApi.ts
  types.ts
  index.ts          ← public API
```

**검증:** 새 기능 추가 시 3개 이상의 분산된 디렉토리를 수정하면 REJECT.

---

## A-03: 느슨한 결합

**분류:** ALWAYS

**WHY:** 컴포넌트 A가 컴포넌트 B의 내부 상태나 ref를 직접 조작하면, B를 수정할 때 A도 함께 깨진다. 결합도가 높으면 변경 비용이 기하급수적으로 증가한다.

```tsx
// ❌ BAD: 컴포넌트가 다른 컴포넌트의 내부를 직접 조작
function Parent() {
  const childRef = useRef();
  const handleClick = () => {
    childRef.current.internalState = 'modified'; // 내부 직접 접근
  };
}

// ✅ GOOD: props와 콜백으로만 통신
function Parent() {
  const [value, setValue] = useState('');
  return (
    <>
      <InputComponent onValueChange={setValue} />
      <DisplayComponent value={value} />
    </>
  );
}
```

**검증:** 컴포넌트 역할을 "그리고" 없이 한 문장으로 설명할 수 없으면 분리 필요.

---

## A-04: 높은 응집도

**분류:** ALWAYS

**WHY:** 관련 없는 로직이 한 모듈에 섞이면 변경 이유가 여러 개가 되어 모듈이 불안정해진다. 관련 코드는 같은 모듈에, 무관한 코드는 분리한다.

```tsx
// ❌ BAD: UserDashboard가 인증 + 장바구니 + 알림을 모두 처리
function UserDashboard() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [notifications, setNotifications] = useState([]);
  // 500줄의 혼합된 로직...
}

// ✅ GOOD: 각 관심사별로 분리
function UserDashboard() {
  return (
    <DashboardLayout>
      <UserProfile />
      <ShoppingCart />
      <NotificationBell />
    </DashboardLayout>
  );
}
```

**검증:** 하나의 파일에서 3개 이상의 무관한 도메인 개념을 다루면 분리.

---

## A-05: 레이어 분리

**분류:** ALWAYS

**WHY:** 비즈니스 로직이 컴포넌트 안에 있으면 React 없이 테스트할 수 없고, 다른 UI(CLI, 다른 프레임워크)에서 재사용할 수 없다. 세 레이어를 분리한다: Presentation / Business Logic / Data Access.

```tsx
// ❌ BAD: 컴포넌트 안에 fetch + 비즈니스 로직 + UI 혼합
function OrderSummary({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then(res => res.json())
      .then(data => {
        const tax = data.subtotal * 0.08;         // 비즈니스 로직
        const total = data.subtotal + tax;
        setOrder({ ...data, tax, total });
      });
  }, [orderId]);
  return <div>{order?.total}</div>;
}

// ✅ GOOD: 3개 레이어 분리
// Data layer: src/features/orders/api/orderApi.ts
export const fetchOrder = (id: string): Promise<RawOrder> =>
  httpClient.get(`/orders/${id}`);

// Business layer: src/features/orders/domain/orderCalculations.ts
export function calculateOrderTotal(order: RawOrder): OrderSummary {
  const tax = order.subtotal * 0.08;
  return { ...order, tax, total: order.subtotal + tax };
}

// Presentation: src/features/orders/components/OrderSummary.tsx
function OrderSummary({ orderId }: { orderId: string }) {
  const { data: order } = useOrder(orderId);
  return <div>{order?.total}</div>;
}
```

**검증:** 비즈니스 로직을 React import 없이 테스트할 수 있는가? 불가능하면 추출 필요.

---

## A-06: 의존성 역전

**분류:** ALWAYS

**WHY:** 커스텀 훅이 Firebase/Supabase 등 특정 SDK를 직접 import하면, 테스트마다 해당 SDK를 모킹해야 하고, 라이브러리 교체 시 모든 훅을 수정해야 한다. 추상(인터페이스)에 의존하면 구현체를 자유롭게 교체할 수 있다.

**적용 범위:** 교체 가능성이 있는 외부 의존성(인증 SDK, HTTP 클라이언트, 스토리지, 분석 등)에 적용한다. React 자체, CSS 프레임워크, 빌드 도구 등 프로젝트의 기반 기술에는 적용하지 않는다. 소규모 프로젝트에서 교체 가능성이 없는 의존성까지 인터페이스화하는 것은 과잉 설계다.

```tsx
// ❌ BAD: 교체 가능성 있는 구현체에 직접 의존 (여러 파일에서)
import { supabase } from '../lib/supabase';

function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => supabase.from('users').select('*'),
  });
}

// ✅ GOOD: 추상에 의존, 구현체는 주입
interface UserRepository {
  getAll(): Promise<User[]>;
}

function useUsers(repository: UserRepository) {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => repository.getAll(),
  });
}

// 구현체는 composition root에서 제공
const supabaseUserRepo: UserRepository = {
  getAll: () => supabase.from('users').select('*').then(r => r.data ?? []),
};
```

**검증:** 교체 가능성이 있는 third-party SDK를 2개 이상 파일에서 직접 import하면 REJECT.

---

## A-07: 모듈 경계

**분류:** ALWAYS

**WHY:** 내부 파일 경로로 import하면, 내부 리팩토링(파일 이름 변경, 구조 변경)이 외부 소비자를 깨뜨린다. barrel file(index.ts)로 public API만 노출하면 내부 구조 변경이 외부에 투명하다.

```tsx
// ❌ BAD: 내부 경로 직접 import
import { TodoItem } from '@/features/todo/components/todo-list/TodoItem';
import { todoReducer } from '@/features/todo/store/reducers/todoReducer';

// ✅ GOOD: barrel file의 public API만 import
import { TodoItem, useTodos } from '@/features/todo';

// features/todo/index.ts (public API 명시)
export { TodoItem } from './components/TodoList';
export { useTodos } from './hooks/useTodos';
// 내부 helper, reducer 등은 export하지 않음
```

**barrel file 규칙:**
- named export 사용 (`export *` 금지 — tree-shaking 파괴)
- third-party 라이브러리용 barrel file 생성 금지

**검증:** feature 내부 경로(features/xxx/components/yyy)를 직접 import하면 REJECT.

---

## A-08: 단방향 데이터 흐름

**분류:** NEVER (역방향 데이터 흐름)

**WHY:** 자식이 부모 상태를 직접 변경하면, 상태 변경의 출처를 추적할 수 없다. React의 렌더링 최적화도 단방향 흐름을 전제로 설계되었다.

```tsx
// ❌ BAD: 자식이 부모의 ref/state를 직접 변경
function Child({ parentRef }: { parentRef: MutableRefObject<any> }) {
  const handleClick = () => {
    parentRef.current.count = 5; // 부모 내부 직접 변경
  };
}

// ❌ BAD: 형제 간 모듈 레벨 변수 통신
let shared = { value: '' };

// ✅ GOOD: props down, events up
function Parent() {
  const [count, setCount] = useState(0);
  return <Child count={count} onIncrement={() => setCount(c => c + 1)} />;
}

function Child({ count, onIncrement }: { count: number; onIncrement: () => void }) {
  return <button onClick={onIncrement}>{count}</button>;
}
```

**검증:** 자식→부모 직접 state/ref 변경, 모듈 레벨 mutable 변수 공유 발견 시 REJECT.

---

## A-09: Anti-Corruption Layer

**분류:** ALWAYS

**WHY:** axios를 47개 파일에서 직접 import하면, axios를 fetch로 교체할 때 47개 파일을 수정해야 한다. 래퍼로 격리하면 1개 파일만 수정하면 된다. 라이브러리 고유 에러 타입(AxiosError 등)이 도메인에 누출되는 것도 방지한다.

```tsx
// ❌ BAD: 47개 파일에서 axios 직접 import
import axios from 'axios';
const users = await axios.get('/api/users');

// ✅ GOOD: 래퍼 1개만 axios를 알고 있음
// src/lib/httpClient.ts
import axios from 'axios'; // 이 파일만 axios를 import

export interface HttpClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, data: unknown): Promise<T>;
}

export const httpClient: HttpClient = {
  get: (url) => axios.get(url).then(r => r.data),
  post: (url, data) => axios.post(url, data).then(r => r.data),
};

// 나머지 파일은 래퍼만 import
import { httpClient } from '@/lib/httpClient';
const users = await httpClient.get<User[]>('/api/users');
```

**래핑 대상:** HTTP 클라이언트, 인증 SDK, 분석 SDK, 스토리지
**래핑 불필요:** React 자체, CSS 프레임워크 (= 도메인 그 자체인 경우)

**검증:** third-party 라이브러리가 2개 이상 파일에서 직접 import되면 래퍼 생성 필요.

---

## A-10: 코로케이션

**분류:** ALWAYS

**WHY:** 테스트가 src/에서 먼 `__tests__/` 디렉토리에 있으면, 파일 이름 변경 시 테스트를 찾아 수정하기 어렵다. 상태가 불필요하게 전역에 있으면 모든 키 입력에 앱 전체가 리렌더된다. 관련 코드는 가까이 둔다.

```
// ❌ BAD: 관련 파일이 분산
src/components/UserProfile.tsx
src/styles/UserProfile.css
tests/components/UserProfile.test.tsx
src/types/UserProfile.ts

// ✅ GOOD: 관련 파일이 같은 디렉토리
src/features/user-profile/
  UserProfile.tsx
  UserProfile.test.tsx
  UserProfile.module.css
  types.ts
  index.ts
```

**상태 코로케이션 판단:**
1. 한 컴포넌트만 사용 → `useState` 해당 컴포넌트에
2. 형제가 필요 → 가장 가까운 공통 부모로 lift
3. 앱 전체가 필요 → 그때만 context/global state

**검증:** 기능 삭제 시 5개 이상 분산된 디렉토리를 수정해야 하면 코로케이션 위반.
