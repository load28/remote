# 아키텍처 원칙

## A-01: 단방향 의존성 (FSD Import Rule)

**분류:** NEVER (역방향/횡단 참조)

**WHY:** 양방향 의존성은 순환 참조를 만들고, 하나의 변경이 예측 불가능한 곳에 전파된다. 의존성 그래프는 반드시 DAG(Directed Acyclic Graph)여야 한다. FSD에서는 **상위 레이어만 하위 레이어를 import할 수 있다.**

```
FSD 레이어 계층 (위→아래 방향만 import 허용):

  ┌─────────┐
  │   app   │  ← 라우팅, 프로바이더, 글로벌 설정
  ├─────────┤
  │  pages  │  ← 페이지 단위 조합 (widgets, features, entities 조합)
  ├─────────┤
  │ widgets │  ← 자기 완결적 UI 블록 (features, entities 조합)
  ├─────────┤
  │features │  ← 재사용 가능한 사용자 인터랙션 (entities, shared 사용)
  ├─────────┤
  │entities │  ← 비즈니스 도메인 모델 (shared만 사용)
  ├─────────┤
  │ shared  │  ← 프로젝트 비종속 재사용 코드 (외부 의존 없음)
  └─────────┘

허용되는 방향 (상위 → 하위만):
  app → pages, widgets, features, entities, shared
  pages → widgets, features, entities, shared
  widgets → features, entities, shared
  features → entities, shared
  entities → shared

금지되는 방향:
  shared → entities/features/…  (하위가 상위를 알면 안 됨)
  entities → features           (하위가 상위를 알면 안 됨)
  features → widgets/pages      (하위가 상위를 알면 안 됨)
  같은 레이어 내 슬라이스 간 직접 참조 금지 (예외: @x 교차 import)
```

```tsx
// ❌ BAD: shared가 상위 레이어를 import
// src/shared/ui/Button.tsx
import { useAuth } from '@/features/auth';

// ❌ BAD: 같은 레이어 슬라이스 간 직접 import
// src/features/comments/ui/CommentList.tsx
import { DiscussionHeader } from '@/features/discussions';

// ❌ BAD: 하위 레이어가 상위 레이어를 import
// src/entities/user/model/useUser.ts
import { useLoginForm } from '@/features/auth';

// ✅ GOOD: 상위 → 하위 방향만
// src/features/comments/ui/CommentList.tsx
import { UserAvatar } from '@/entities/user';
import { Card } from '@/shared/ui';

// ✅ GOOD: @x 교차 import (entities 간 명시적 공개 API)
// src/entities/comment/@x/post.ts  ← post 엔티티를 위한 공개 API
export { CommentPreview } from '../ui/CommentPreview';
// src/entities/post/ui/PostCard.tsx
import { CommentPreview } from '@/entities/comment/@x/post';
```

**@x 교차 import 규칙 (FSD v2.1):**
- 같은 레이어의 슬라이스 간 참조가 불가피할 때만 사용
- `entities/[source]/@x/[consumer].ts` 파일로 명시적 공개 API 생성
- 무분별한 사용 금지 — 교차 참조가 많으면 설계 재검토

**검증:** import 경로가 하위→상위, 또는 같은 레이어 슬라이스 간 직접 참조(비@x)면 REJECT.

---

## A-02: FSD 디렉토리 구조

**분류:** ALWAYS

**WHY:** 타입별 구조(components/, hooks/, services/)는 하나의 기능을 추가/삭제할 때 5-6개 디렉토리를 동시에 수정해야 한다. FSD는 레이어 > 슬라이스 > 세그먼트로 코드를 조직하여 예측 가능한 구조를 만든다.

```
// ❌ BAD: 타입별 구조
src/components/UserProfile.tsx
src/hooks/useUserProfile.ts
src/services/userProfileApi.ts
src/types/userProfile.ts

// ✅ GOOD: FSD 구조
src/
├── app/                        ← 앱 초기화, 라우팅, 프로바이더
│   ├── providers/
│   ├── routes/
│   └── styles/
│
├── pages/                      ← 페이지 단위 (슬라이스 구조)
│   ├── home/
│   │   ├── ui/
│   │   └── index.ts
│   └── profile/
│       ├── ui/
│       ├── model/
│       └── index.ts
│
├── widgets/                    ← 자기 완결적 UI 블록
│   ├── header/
│   │   ├── ui/
│   │   ├── model/
│   │   └── index.ts
│   └── sidebar/
│       ├── ui/
│       └── index.ts
│
├── features/                   ← 사용자 인터랙션 (재사용 가능)
│   ├── auth/
│   │   ├── ui/
│   │   ├── model/
│   │   ├── api/
│   │   └── index.ts
│   └── comments/
│       ├── ui/
│       ├── model/
│       ├── api/
│       └── index.ts
│
├── entities/                   ← 비즈니스 도메인 모델
│   ├── user/
│   │   ├── ui/                 ← UserAvatar, UserCard 등
│   │   ├── model/              ← useUser, userStore 등
│   │   ├── api/                ← userApi
│   │   ├── @x/                 ← 교차 import 공개 API (필요 시)
│   │   └── index.ts
│   └── post/
│       ├── ui/
│       ├── model/
│       ├── api/
│       └── index.ts
│
└── shared/                     ← 프로젝트 비종속 재사용 코드
    ├── ui/                     ← Button, Card, Modal 등
    ├── api/                    ← httpClient, API 유틸
    ├── lib/                    ← 유틸 함수
    ├── config/                 ← 환경 변수, 상수
    └── types/                  ← 공통 타입
```

**세그먼트 (슬라이스 내부 기술 분류):**
| 세그먼트 | 용도 | 예시 |
|---------|------|------|
| `ui/` | UI 컴포넌트, 포매터, 스타일 | `UserCard.tsx`, `formatDate.ts` |
| `model/` | 비즈니스 로직, 스토어, 스키마 | `useUser.ts`, `userStore.ts` |
| `api/` | 백엔드 통신, 요청 함수 | `userApi.ts`, `types.ts` |
| `lib/` | 슬라이스 내부 유틸리티 | `validation.ts` |
| `config/` | 설정, 피처 플래그 | `constants.ts` |

**FSD v2.1 "Pages First" 원칙:**
- 다른 페이지에서 재사용하지 않는 코드는 해당 page 슬라이스 내부에 유지
- Widgets도 자체 store, 비즈니스 로직, API 호출을 가질 수 있음
- 재사용 필요가 생겼을 때 하위 레이어(features, entities, shared)로 이동

**검증:** 새 기능 추가 시 3개 이상의 분산된 레이어를 수정하면 구조 재검토. 슬라이스 안에서 세그먼트로 분류되어야 한다.

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
// Data layer (api 세그먼트): src/features/orders/api/orderApi.ts
export const fetchOrder = (id: string): Promise<RawOrder> =>
  httpClient.get(`/orders/${id}`);

// Business layer (model 세그먼트): src/features/orders/model/orderCalculations.ts
export function calculateOrderTotal(order: RawOrder): OrderSummary {
  const tax = order.subtotal * 0.08;
  return { ...order, tax, total: order.subtotal + tax };
}

// Presentation (ui 세그먼트): src/features/orders/ui/OrderSummary.tsx
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
// ❌ BAD: 내부 경로(세그먼트) 직접 import
import { TodoItem } from '@/features/todo/ui/todo-list/TodoItem';
import { todoReducer } from '@/features/todo/model/reducers/todoReducer';

// ✅ GOOD: barrel file(슬라이스의 index.ts)의 public API만 import
import { TodoItem, useTodos } from '@/features/todo';

// features/todo/index.ts (public API 명시)
export { TodoItem } from './ui/TodoList';
export { useTodos } from './model/useTodos';
// 내부 helper, reducer 등은 export하지 않음
```

**barrel file 규칙:**
- named export 사용 (`export *` 금지 — tree-shaking 파괴)
- third-party 라이브러리용 barrel file 생성 금지

**검증:** 슬라이스 내부 세그먼트 경로(features/xxx/ui/yyy, entities/xxx/model/yyy)를 직접 import하면 REJECT. 반드시 슬라이스의 barrel file(index.ts)을 통해서만 import.

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

// ✅ GOOD: FSD 세그먼트 내 코로케이션
src/entities/user/
  ui/
    UserProfile.tsx
    UserProfile.test.tsx
    UserProfile.module.css
  model/
    useUser.ts
    useUser.test.ts
  api/
    userApi.ts
  index.ts
```

**상태 코로케이션 판단:**
1. 한 컴포넌트만 사용 → `useState` 해당 컴포넌트에
2. 형제가 필요 → 가장 가까운 공통 부모로 lift
3. 앱 전체가 필요 → 그때만 context/global state

**검증:** 기능 삭제 시 5개 이상 분산된 디렉토리를 수정해야 하면 코로케이션 위반.
