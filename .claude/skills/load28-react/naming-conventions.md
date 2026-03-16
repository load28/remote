# 네이밍 규칙

## N-01: 컴포넌트/파일 PascalCase

**분류:** ALWAYS

**WHY:** React는 소문자로 시작하는 태그를 HTML 네이티브 요소로 인식한다. PascalCase만 커스텀 컴포넌트로 처리된다.

```tsx
// ❌ BAD
function userProfile() { ... }     // 소문자 시작
// <userProfile /> → HTML 태그로 인식, 렌더링 안 됨

// ✅ GOOD
function UserProfile() { ... }     // PascalCase
// <UserProfile /> → React 컴포넌트로 인식
```

파일명도 동일: `UserProfile.tsx`, `OrderSummary.tsx`

---

## N-02: props camelCase

**분류:** ALWAYS

**WHY:** JSX는 JavaScript 표현식이므로 JavaScript 네이밍 컨벤션(camelCase)을 따른다. 언더스코어는 React 생태계에서 비표준이다.

```tsx
// ❌ BAD
interface Props {
  user_name: string;
  is_active: boolean;
  on_click: () => void;
}

// ✅ GOOD
interface Props {
  userName: string;
  isActive: boolean;
  onClick: () => void;
}
```

---

## N-03: on*/handle* 이벤트 네이밍

**분류:** ALWAYS

**WHY:** `on` 접두사는 props 인터페이스(외부에 노출되는 이벤트), `handle` 접두사는 내부 구현 함수를 구분한다. 이 규칙으로 이벤트의 소유권(props vs 내부)을 즉시 파악할 수 있다.

```tsx
// ❌ BAD: 구분 없이 혼용
interface Props {
  handleClick: () => void;    // props에 handle 사용
}
function Button({ handleClick }: Props) {
  const click = () => { ... };  // 내부 함수에 접두사 없음
}

// ✅ GOOD: on = props, handle = 내부
interface ButtonProps {
  onClick: () => void;         // props: on 접두사
}
function Button({ onClick }: ButtonProps) {
  const handleClick = () => {  // 내부: handle 접두사
    // 내부 로직 처리
    onClick();                 // props 콜백 호출
  };
  return <button onClick={handleClick}>Click</button>;
}
```

---

## N-04: Boolean is*/has*/can*/should* 접두사

**분류:** ALWAYS (커스텀 props/state에 적용)

**WHY:** Boolean 값은 접두사 없이 `active`, `loading` 같은 형용사/동사만 사용하면 타입 추론 없이는 boolean인지 string인지 알 수 없다. 접두사로 "예/아니오 질문"임을 명시한다.

**적용 범위:** 커스텀 컴포넌트의 props와 로컬 state에 적용한다. HTML 네이티브 속성(`disabled`, `hidden`, `checked`, `required` 등)은 브라우저 표준이므로 접두사를 붙이지 않는다.

```tsx
// ❌ BAD: 커스텀 props/state에 접두사 없음
const [loading, setLoading] = useState(false);
const [admin, setAdmin] = useState(false);
<Modal visible={true} />

// ✅ GOOD: 커스텀 props/state에 접두사
const [isLoading, setIsLoading] = useState(false);
const [isAdmin, setIsAdmin] = useState(false);
<Modal isVisible={true} />

// ✅ OK: HTML 네이티브 속성은 그대로
<button disabled={isLoading}>저장</button>
<input required checked={isChecked} />

// 접두사 가이드:
// is  → 현재 상태   (isLoading, isVisible, isActive)
// has → 소유 여부   (hasError, hasPermission, hasChildren)
// can → 능력/권한   (canEdit, canDelete, canSubmit)
// should → 조건부   (shouldRender, shouldValidate, shouldFetch)
```

---

## N-05: 커스텀 훅 use + 동사

**분류:** ALWAYS

**WHY:** React는 `use` 접두사로 시작하는 함수만 Hook으로 인식하여 Rules of Hooks를 적용한다. `use` 없이 내부에서 Hook을 호출하면 린터가 위반을 감지하지 못한다. 동사를 붙여 목적을 명시한다.

```tsx
// ❌ BAD
function auth() { return useContext(AuthContext); }       // use 접두사 없음
function useData() { ... }                                // 너무 모호

// ✅ GOOD
function useAuth() { return useContext(AuthContext); }
function useFetchUsers() { ... }
function useDebounce(value: string, delay: number) { ... }
function useLocalStorage<T>(key: string) { ... }
```

---

## N-06: 상수 UPPER_SNAKE_CASE

**분류:** ALWAYS

**WHY:** 모듈 레벨 상수는 UPPER_SNAKE_CASE로 작성하여 "런타임에 변경되지 않는 값"임을 시각적으로 구분한다. 특히 매직 넘버/스트링을 제거할 때 상수로 추출하면 의미가 명확해진다.

```tsx
// ❌ BAD
const maxRetries = 3;
const apiUrl = '/api/v1';
const colors = ['red', 'blue', 'green'];

// ✅ GOOD
const MAX_RETRIES = 3;
const API_BASE_URL = '/api/v1';
const AVAILABLE_COLORS = ['red', 'blue', 'green'] as const;
```

---

## N-07: 유틸리티/비컴포넌트 파일 camelCase

**분류:** ALWAYS

**WHY:** PascalCase 파일 = React 컴포넌트, camelCase 파일 = 유틸리티/서비스/타입. 파일 이름만으로 "이 파일이 컴포넌트인가 아닌가"를 즉시 판단할 수 있다.

```
// ❌ BAD
src/utils/FormatCurrency.ts    // 컴포넌트로 착각
src/services/ApiClient.ts      // 컴포넌트로 착각

// ✅ GOOD
src/utils/formatCurrency.ts    // 유틸리티 함수
src/services/apiClient.ts      // 서비스 모듈
src/hooks/useAuth.ts           // 훅 (use 접두사로 구분)
src/types/user.ts              // 타입 정의
```

---

## N-08: 의미없는 이름 금지

**분류:** NEVER

**WHY:** `data`, `info`, `temp`, `item`, `value`, `result` 같은 이름은 코드 리뷰어가 "이게 뭐지?"라고 매번 문맥을 추적해야 한다. 도메인 용어로 구체적인 이름을 사용한다.

```tsx
// ❌ BAD
const data = await fetchUsers();
const info = getUserInfo();
const items = cart.getItems();
function processData(data: any) { ... }
const temp = calculateTotal(order);

// ✅ GOOD
const users = await fetchUsers();
const userProfile = getUserProfile();
const cartProducts = cart.getProducts();
function validateOrderInput(input: OrderInput) { ... }
const orderTotal = calculateTotal(order);
```

---

## N-09: Jotai atom 네이밍 `___Atom` 접미사

**분류:** ALWAYS (Jotai 사용 시)

**WHY:** Jotai atom은 일반 변수와 구분이 어렵다. `Atom` 접미사 없이 `const count = atom(0)`으로 선언하면, 사용처에서 `count`가 atom인지 일반 값인지 알 수 없다. `countAtom`으로 명명하면 `useAtom(countAtom)`, `useAtomValue(countAtom)` 사용 시 atom임이 즉시 드러나고, DevTools에서도 식별이 용이하다.

```tsx
// ❌ BAD: Atom 접미사 없음 → 일반 변수와 구분 불가
const count = atom(0);
const filter = atom('all');
const users = atom((get) => get(allUsersAtom).filter(...));

// ✅ GOOD: Atom 접미사로 명확히 구분
const countAtom = atom(0);
const filterAtom = atom('all');
const filteredUsersAtom = atom((get) => get(allUsersAtom).filter(...));
```

**atomFamily의 경우:** `AtomFamily` 접미사 사용.

```tsx
// ✅ GOOD
const entityAtomFamily = atomFamily((id: string) => atom(null));
```

**검증:** `atom()`으로 생성된 변수에 `Atom` 접미사가 없으면 REJECT. `atomFamily()`로 생성된 변수에 `AtomFamily` 접미사가 없으면 REJECT.
