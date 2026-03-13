# 테스트 & 접근성 & 타입안전

## T-01: 구현 세부사항 테스트 금지

**분류:** NEVER

**WHY:** 내부 state 이름, className, 컴포넌트 인스턴스 구조를 테스트하면, 리팩토링(동작은 동일하지만 내부 구현 변경)할 때마다 테스트가 깨진다. 사용자가 보고 상호작용하는 것만 테스트한다.

```tsx
// ❌ BAD: 내부 구현에 의존
expect(wrapper.state('isOpen')).toBe(true);
expect(wrapper.find('.btn-primary')).toHaveLength(1);
expect(component.instance().handleClick).toBeDefined();

// ✅ GOOD: 사용자 관점
expect(screen.getByRole('dialog')).toBeVisible();
expect(screen.getByRole('button', { name: '저장' })).toBeEnabled();
await userEvent.click(screen.getByRole('button', { name: '열기' }));
expect(screen.getByText('내용이 표시됩니다')).toBeInTheDocument();
```

---

## T-02: MSW 네트워크 레벨 모킹

**분류:** NEVER (fetch/axios 직접 모킹)

**WHY:** `jest.mock('axios')` 또는 `global.fetch = jest.fn()`은 구현 세부사항에 결합된다. HTTP 클라이언트를 교체하면 모든 모킹이 깨진다. MSW(Mock Service Worker)는 네트워크 레벨에서 요청을 가로채므로, 코드가 어떤 HTTP 클라이언트를 사용하든 테스트가 동작한다.

```tsx
// ❌ BAD: 구현체에 결합된 모킹
jest.mock('axios');
(axios.get as jest.Mock).mockResolvedValue({ data: mockUsers });

// ✅ GOOD: MSW로 네트워크 레벨 모킹
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/users', () => HttpResponse.json(mockUsers))
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## T-03: 소스 옆 테스트 배치

**분류:** NEVER (별도 `__tests__/` 디렉토리)

**WHY:** 테스트가 소스에서 멀리 떨어져 있으면, 파일 이름 변경이나 이동 시 테스트를 찾아 함께 수정하기 어렵다. 기능 삭제 시 테스트 파일이 고아로 남는다.

```
// ❌ BAD
src/components/UserProfile.tsx
tests/components/UserProfile.test.tsx

// ✅ GOOD
src/features/user-profile/
  UserProfile.tsx
  UserProfile.test.tsx
```

---

## T-04: any 타입 금지

**분류:** NEVER

**WHY:** `any`는 TypeScript의 타입 검사를 완전히 비활성화한다. 전파성이 있어 `any`가 하나 들어가면 연쇄적으로 타입 안전성이 무너진다. `unknown`을 사용하고 type guard로 좁힌다.

```tsx
// ❌ BAD
function parseResponse(data: any) {
  return data.users.map((u: any) => u.name); // 런타임 에러 가능
}

// ✅ GOOD
function parseResponse(data: unknown): string[] {
  if (!isUserResponse(data)) throw new Error('Invalid response');
  return data.users.map(u => u.name); // 타입 안전
}

function isUserResponse(data: unknown): data is UserResponse {
  return (
    typeof data === 'object' && data !== null &&
    'users' in data && Array.isArray((data as Record<string, unknown>).users)
  );
}
```

---

## T-05: Suspense 올바른 사용

**분류:** NEVER (일반 fetch에 Suspense 기대)

**WHY:** Suspense는 **thrown Promise**를 감지하여 동작한다. `useEffect` 안의 `fetch`는 Promise를 throw하지 않으므로 Suspense fallback이 절대 표시되지 않는다. Suspense 호환 API(`React.lazy`, `use()`, TanStack Query Suspense 모드)만 동작한다.

```tsx
// ❌ BAD: Suspense가 동작하지 않음
function UserProfile() {
  const [user, setUser] = useState(null);
  useEffect(() => { fetch('/api/user').then(r => r.json()).then(setUser); }, []);
  return <div>{user?.name}</div>; // Suspense fallback 절대 안 보임
}

// ✅ GOOD: React 19 use() 사용
function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // Promise를 throw → Suspense 동작
  return <div>{user.name}</div>;
}

// ✅ GOOD: React.lazy로 코드 스플리팅
const LazyComponent = lazy(() => import('./HeavyComponent'));
<Suspense fallback={<Skeleton />}><LazyComponent /></Suspense>
```

---

## T-06: ErrorBoundary 한계 인식

**분류:** NEVER (이벤트 핸들러 에러를 잡는다고 착각)

**WHY:** ErrorBoundary(`componentDidCatch`)는 **렌더링과 lifecycle** 중 발생하는 에러만 잡는다. 이벤트 핸들러, 비동기 코드(`setTimeout`, `Promise`), 서버사이드 렌더링의 에러는 잡지 못한다.

```tsx
// ❌ BAD: ErrorBoundary가 잡지 못함
<ErrorBoundary>
  <button onClick={() => { throw new Error('boom'); }}>
    Click  {/* 이 에러는 ErrorBoundary를 통과 */}
  </button>
</ErrorBoundary>

// ✅ GOOD: 이벤트 핸들러는 try-catch로 직접 처리
function SubmitButton() {
  const handleClick = () => {
    try {
      riskyOperation();
    } catch (error) {
      reportError(error);
      showErrorToast('작업에 실패했습니다');
    }
  };
  return <button onClick={handleClick}>Submit</button>;
}
```

---

## T-07: 테스트 피라미드

**분류:** ALWAYS

**WHY:** Unit 테스트는 빠르고 안정적, E2E 테스트는 느리고 불안정하다. 대부분의 로직을 unit으로 커버하고, 통합 시나리오를 integration으로, 핵심 사용자 흐름만 E2E로 검증한다.

```
Unit (많이):     순수 함수, 커스텀 훅, 유틸리티
Integration (적당히): 컴포넌트 + 훅 + API 모킹 조합
E2E (적게):      핵심 사용자 시나리오 (로그인, 결제 등)
```

---

## T-08: 사용자 관점 쿼리

**분류:** ALWAYS

**WHY:** Testing Library는 사용자가 UI를 인지하는 방식으로 요소를 찾도록 설계되었다. `getByTestId`는 구현 세부사항에 가깝고, `getByRole`은 접근성 트리를 통해 실제 사용자(스크린 리더 포함)가 인지하는 방식이다.

```tsx
// 쿼리 우선순위 (위가 가장 권장)
screen.getByRole('button', { name: '저장' })    // 1순위: 역할 + 이름
screen.getByLabelText('이메일')                   // 2순위: 레이블
screen.getByText('환영합니다')                     // 3순위: 텍스트
screen.getByTestId('submit-btn')                 // 최후수단: test-id
```

---

## T-09: 버그 → 재현 테스트 먼저

**분류:** ALWAYS

**WHY:** 먼저 수정하면 "정말 고쳤는지" 확인할 수 없다. 재현 테스트를 먼저 작성하면: (1) 버그를 정확히 이해하고, (2) 수정 후 테스트가 통과하여 검증되며, (3) 동일 버그의 재발을 영구적으로 방지한다.

---

## T-10: 3단계 에러 바운더리

**분류:** ALWAYS

**WHY:** 에러 바운더리가 앱 최상단에만 있으면, 작은 위젯의 에러가 전체 앱을 크래시시킨다. 3단계로 배치하면 에러 영향 범위를 최소화한다.

```
1. 앱 레벨: 전체 앱 크래시 시 "문제가 발생했습니다" + 새로고침 버튼
2. 라우트 레벨: 특정 페이지 에러 시 해당 페이지만 에러 표시
3. 위젯 레벨: 댓글 목록 에러 시 댓글만 에러, 나머지 정상 동작
```

---

## T-11: 시맨틱 HTML + ARIA + 키보드

**분류:** ALWAYS

**WHY:** `<div onClick>`은 키보드 포커스, 스크린 리더 인식, Enter/Space 동작이 모두 없다. 시맨틱 요소(`<button>`, `<a>`, `<nav>`, `<main>`)는 이 모든 것을 브라우저가 제공한다.

```tsx
// ❌ BAD: div로 버튼 흉내
<div onClick={handleSubmit} className="btn">제출</div>

// ✅ GOOD: 시맨틱 요소
<button onClick={handleSubmit}>제출</button>

// ❌ BAD: 시맨틱 없는 레이아웃
<div className="header"><div className="nav">...</div></div>

// ✅ GOOD
<header><nav aria-label="메인 네비게이션">...</nav></header>
```

---

## T-12: tsconfig strict: true

**분류:** ALWAYS

**WHY:** `strict: true`는 `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes` 등 7개 엄격 검사를 한번에 활성화한다. 이것 없이는 TypeScript를 쓰는 의미가 반감된다.

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

---

## T-13: Props는 named exported interface

**분류:** ALWAYS

**WHY:** inline 타입은 재사용, 확장, 문서화가 불가능하다. named exported interface는 소비자가 extends하거나 Partial로 활용할 수 있다.

```tsx
// ❌ BAD: inline 타입
function Button(props: { label: string; onClick: () => void }) { ... }

// ✅ GOOD: named exported interface
export interface ButtonProps {
  label: string;
  onClick: () => void;
}

function Button({ label, onClick }: ButtonProps) { ... }
```

---

## T-14: discriminated union 타입

**분류:** ALWAYS (variant 컴포넌트)

**WHY:** 상태별로 다른 props를 받는 컴포넌트에서 모든 props를 optional로 만들면, 존재하지 않는 조합을 타입이 허용한다. discriminated union은 유효한 조합만 타입으로 허용한다.

```tsx
// ❌ BAD: 모든 optional → 잘못된 조합 허용
interface AlertProps {
  type?: 'success' | 'error';
  message?: string;
  errorCode?: number;  // success일 때도 errorCode 전달 가능
}

// ✅ GOOD: discriminated union
type AlertProps =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string; errorCode: number };

function Alert(props: AlertProps) {
  if (props.type === 'error') {
    // props.errorCode가 타입 안전하게 접근 가능
    return <div>Error {props.errorCode}: {props.message}</div>;
  }
  return <div>{props.message}</div>;
}
```

---

## T-15: optional 프로퍼티 남용 금지 — 조건부 프로퍼티는 타입 분리

**분류:** NEVER (무분별한 optional)

**WHY:** optional(`?`)을 남용하면 모든 사용처에서 불필요한 undefined 체크가 강제되고, 실제로는 반드시 존재하는 값이 타입상으로는 없을 수도 있는 것처럼 표현된다. 특정 프로퍼티 값에 따라 동적으로 달라지는 프로퍼티는 optional이 아니라 별도 타입으로 분리하여 union으로 합친다. (→ T-14 discriminated union 참조)

### 원칙 1: optional 자제 — 실제로 없을 수 있는 값만 optional

```tsx
// ❌ BAD: 항상 존재하는 값을 optional로 표시
interface UserProfile {
  id?: string;        // 항상 존재하는데 optional → 모든 곳에서 user.id! 또는 user.id ?? '' 필요
  name?: string;
  email?: string;
  bio?: string;       // 이것만 진짜 optional
}

// ✅ GOOD: 실제로 없을 수 있는 값만 optional
interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;       // 사용자가 입력하지 않을 수 있음
}
```

### 원칙 2: 프로퍼티에 따라 동적으로 달라지는 타입은 분리

```tsx
// ❌ BAD: mode에 따라 필요한 props가 다른데 전부 optional
interface EditorProps {
  mode: 'view' | 'edit' | 'create';
  content: string;
  onSave?: () => void;       // edit/create에서는 필수인데 optional
  initialDraft?: string;     // create에서만 필요한데 optional
  lastEditedBy?: string;     // view/edit에서만 존재하는데 optional
  publishedAt?: Date;        // view에서만 존재하는데 optional
}

// ✅ GOOD: mode별로 타입 분리 후 union
interface ViewEditorProps {
  mode: 'view';
  content: string;
  lastEditedBy: string;
  publishedAt: Date;
}

interface EditEditorProps {
  mode: 'edit';
  content: string;
  onSave: () => void;
  lastEditedBy: string;
}

interface CreateEditorProps {
  mode: 'create';
  content: string;
  onSave: () => void;
  initialDraft: string;
}

type EditorProps = ViewEditorProps | EditEditorProps | CreateEditorProps;
```

```tsx
// ❌ BAD: 응답 상태에 따라 달라지는 데이터를 optional로
interface ApiResponse {
  status: 'loading' | 'success' | 'error';
  data?: User[];          // success일 때 반드시 존재
  error?: Error;          // error일 때 반드시 존재
  retryCount?: number;    // error일 때만 의미 있음
}

// ✅ GOOD: 상태별 타입 분리
type ApiResponse =
  | { status: 'loading' }
  | { status: 'success'; data: User[] }
  | { status: 'error'; error: Error; retryCount: number };

// 사용처에서 타입 가드 없이 안전하게 접근
function renderResponse(response: ApiResponse) {
  switch (response.status) {
    case 'loading':
      return <Spinner />;
    case 'success':
      return <UserList users={response.data} />;    // data가 반드시 존재
    case 'error':
      return <ErrorView error={response.error} />;  // error가 반드시 존재
  }
}
```

**판단 기준:** "이 프로퍼티가 없을 수 있는 이유가 다른 프로퍼티의 값 때문인가?" → Yes면 타입 분리, No면 optional 허용.
