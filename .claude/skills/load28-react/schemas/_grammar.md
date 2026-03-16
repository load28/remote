# Grammar Rules — 코드의 모든 줄에 자동 적용

스키마 슬롯과 독립적으로, **생성된 모든 코드에 기계적으로 적용**되는 규칙.
Grammar는 두 단계로 나뉜다:

- **Section A (Pre-Generation):** 슬롯 채우기 직후, 코드 변환 **전에** 실행. 스키마 횡단 아키텍처 규칙을 슬롯 수준에서 검증한다.
- **Section B (Post-Generation):** 코드 변환 **후에** 실행. 코드 수준의 구문 규칙을 기계적으로 스캔한다.

문법은 선택하는 것이 아니다. 한국어를 쓸 때 조사를 "선택"하지 않듯,
이 문법은 코드의 모든 줄에 무조건 적용된다.

---

## Section A: Pre-Generation Check (슬롯 수준 의미 검증)

**코드 변환 전에** 채워진 슬롯을 아래 규칙으로 검증한다.
위반 발견 시 슬롯을 수정한 후에만 코드 변환으로 진행한다.

| # | 규칙 | 스캔 대상 (슬롯) | 위반 조건 |
|---|------|----------------|----------|
| A-01 | FSD 단방향 의존성 | Dependencies 슬롯 + layer 슬롯 | 상위→하위 위반 (예: entities→features, shared→entities), 같은 레이어 슬라이스 간 직접 참조 (비@x), 하위→상위 역방향 참조 |
| A-05 | 레이어 분리 | State/Effects 슬롯 | 컴포넌트 안에 fetch 직접 호출, 비즈니스 계산 로직 혼입 |
| A-08 | 단방향 데이터 흐름 | Events/State 슬롯 | 자식→부모 직접 state/ref 변경 설계 |
| A-09 | Anti-Corruption Layer | Dependencies 슬롯 | third-party SDK를 래퍼 없이 2개+ 파일에서 직접 import |
| S-07 | Context 분리 | State 슬롯 (context 사용 시) | 하나의 Context에 변경 빈도가 다른 값 혼합 |
| S-09 | 상태 코로케이션 | State source 슬롯 | 한 컴포넌트만 사용하는 state를 global/context에 배치 |
| S-14 | Provider value useMemo | Provider value (context 작성 시) | Provider value에 useMemo 미사용 |
| S-18 | URL 상태 수동 조작 금지 | State source/state_tool 슬롯 | URL 쿼리파라미터를 다루면서 source에 `url-query`가 아닌 값, 또는 state_tool에 `nuqs`가 아닌 수동 방식 선택 |
| S-23 | atom 모듈 레벨 선언 | Atoms 정의 슬롯 | atom() 호출이 컴포넌트/훅 함수 내부에서 실행되는 설계 |
| S-28 | 폼 상태 소유권 분리 | State 슬롯 | 폼 필드 값을 zustand/jotai/context에 동기화하는 설계 — 폼 상태는 React Hook Form이 소유 |
| A-11 | atom 파일 model/ 배치 | Atoms Identity file_path 슬롯 | atom 정의 파일이 model/ 세그먼트 외부에 배치 |

---

## Section B: Post-Generation Scan (코드 수준 구문 검증)

코드를 생성한 직후, 아래 항목을 위에서 아래로 기계적으로 스캔한다.
하나라도 위반이 있으면 코드를 수정한 후에만 제출한다.

### Naming

| # | 규칙 | 스캔 대상 | 위반 조건 |
|---|------|----------|----------|
| N-01 | 컴포넌트/파일 PascalCase | 모든 `function` 컴포넌트, 파일명 | 소문자 시작 |
| N-02 | props camelCase | 모든 interface/type의 props | snake_case 발견 |
| N-03 | on*/handle* | 모든 이벤트 함수 | props에 handle*, 내부에 on* 접두사 |
| N-04 | Boolean is/has/can/should | 커스텀 boolean props/state | 접두사 없음 (HTML 네이티브 제외) |
| N-05 | 훅 네이밍 use + 동사 | 커스텀 훅 함수명 | `use` 접두사 없는 훅 함수 |
| N-06 | 상수 UPPER_SNAKE_CASE | 모든 모듈 레벨 const | camelCase 상수. 예외: Jotai atom (N-09 camelCase+Atom), 커스텀 훅 (N-05 use+동사), Zustand 스토어 (use+PascalCase명+Store) |
| N-07 | 비컴포넌트 파일 camelCase | 유틸리티/훅/API 파일명 | PascalCase 파일명 (컴포넌트가 아닌 경우) |
| N-08 | 의미없는 이름 금지 | 모든 변수/함수명 | data, info, temp, item, value, result |
| N-09 | atom 네이밍 `___Atom` | 모든 Jotai atom 변수 | `Atom` 접미사 없는 atom 선언 (`const foo = atom(...)` → `const fooAtom = atom(...)`) |

### State

| # | 규칙 | 스캔 대상 | 위반 조건 |
|---|------|----------|----------|
| S-01 | state 직접 변경 금지 | 모든 state 변수 | .push(), .splice(), 직접 할당 |
| S-02 | useEffect 파생 상태 금지 | 모든 useEffect | useEffect 내 setState로 계산값 저장 |
| S-03 | 파생 가능 state 금지 | 모든 useState | 다른 state에서 계산 가능한 값 |
| S-04 | 수동 fetch 금지 | 모든 useEffect | useEffect 내 fetch()/axios 직접 호출 → TanStack Query 사용 |
| S-05 | props→state 복사 금지 | 모든 useState 초기값 | props를 useState 초기값으로 사용 + useEffect 동기화 |
| S-06 | 함수형 setState | 이전값 기반 setState | setState(count + 1) → setState(prev => prev + 1) |
| S-10 | lazy state 초기화 | useState 인자 | 함수 호출(`fn()`)이 직접 인자로 전달 → `() => fn()` 래핑 필요 |
| S-16 | useEffect cleanup | 모든 useEffect | cleanup 함수 반환 없음. 예외: 구독/리스너/타이머 없는 동기적 일회성 작업은 `// S-16 예외: [사유]` 주석으로 허용 |
| S-17 | mutation onSuccess 내장 금지 | 모든 useMutation | 훅 정의에 onSuccess/onError 포함 |
| S-18 | URL 상태 수동 조작 금지 | URL 쿼리파라미터 조작 코드 | `new URLSearchParams()`로 쿼리스트링 직접 구성, `useSearchParams()` 직접 사용, `window.location.search` 직접 파싱, `router.push`/`router.replace`에 쿼리스트링 리터럴 구성. 예외: API 호출 URL 구성용은 대상 아님 |
| S-19 | 컴포넌트당 useForm 1개 | 모든 useForm 호출 | 하나의 컴포넌트에서 `useForm` 2회 이상 호출 |
| S-20 | register vs Controller 선택 | 모든 폼 필드 | 네이티브 input에 Controller 사용, 커스텀 UI에 register 사용 |
| S-21 | zod resolver 통합 | 모든 useForm | `register`에 inline validate/required/pattern 옵션 사용 + zodResolver 미사용 |
| S-22 | watch 남용 금지 | 모든 watch() 호출 | 폼 루트 컴포넌트에서 `watch()` 전체 감시 또는 `watch('field')` 사용 — `useWatch` 별도 컴포넌트로 분리 필요 |
| S-23 | atom 모듈 레벨 선언 | 모든 atom() 호출 | 컴포넌트/훅 함수 내부에서 `atom()`, `atomFamily()`, `atomWithStorage()` 호출 |
| S-24 | derived atom 비동기 금지 | 모든 derived atom | `atom((get) => ...)` 또는 `atom(async (get) => ...)` 내에서 fetch/API 호출 |
| S-25 | atomFamily 키 직렬화 | 모든 atomFamily | 파라미터 타입이 객체/배열 |
| S-26 | atom debugLabel 필수 | 모든 atom 선언 | atom 선언 직후 `debugLabel` 할당 없음 |
| S-27 | write-only atom 캡슐화 | 컴포넌트 내 다중 atom set | 하나의 핸들러에서 3개+ atom을 `set`하는 패턴이 2개+ 컴포넌트에서 반복 → write-only atom으로 캡슐화 |
| S-28 | 폼 상태 store 복제 금지 | watch 구독 코드 | `watch` 구독 결과를 Zustand/Jotai/Context에 동기화 |
| S-29 | 제출 결과만 store 반영 | 폼→store 연동 | `handleSubmit` 콜백 외부에서 폼 값을 global store에 반영 |

### Performance

| # | 규칙 | 스캔 대상 | 위반 조건 |
|---|------|----------|----------|
| P-03 | 기본값 모듈 레벨 상수 | 함수 파라미터 기본값 | `= []`, `= {}` 인라인 기본값 |
| P-04 | 삼항 조건부 렌더 | JSX 조건부 렌더링 | `&&` 사용 (특히 number/string 조건) |
| P-04 | 중첩 삼항 금지 | 모든 삼항 표현식 | 삼항 내 삼항 |
| P-05 | inline style 금지 | JSX style prop | `style={{ ... }}` 인라인 객체. 예외: 런타임 수치(`width`, `top`, `transform` 등)·CSS 변수 주입만 허용 |
| P-06 | export * 금지 | 모든 barrel file | `export * from` |
| P-14 | deps primitive 추출 | useEffect/useMemo deps | 객체/배열이 deps에 직접 포함 |
| P-15 | 폼 validation mode | useForm mode 옵션 | `mode: 'onChange'` 설정 (프로파일링 근거 없이) |

### Component

| # | 규칙 | 스캔 대상 | 위반 조건 |
|---|------|----------|----------|
| C-01 | 내부 컴포넌트 금지 | 렌더 함수 내부 | 함수 안에 컴포넌트 정의 |
| C-02 | 조건부 훅 금지 | if/for/early return 이후 | 조건문 뒤 Hook 호출 |
| C-03 | index key 금지 | .map() 렌더링 | `key={index}` |
| C-06 | wrapper div 금지 | JSX return | 스타일/시맨틱 없는 래퍼 div |
| C-10 | 파일당 1 exported 컴포넌트 | 모든 .tsx 파일 | 2개 이상 `export function`/`export const` 컴포넌트 |
| C-13 | 클로저 트랩 | useCallback | 빈 deps에서 state 참조 |
| C-15 | React 19 제거 API | 모든 코드 | forwardRef, defaultProps, propTypes, string ref, findDOMNode |
| C-16 | 폼 필드 컴포넌트 분리 | 3개+ 필드 폼 | `FormProvider`/`useFormContext` 없이 모든 필드를 하나의 컴포넌트에 배치 |

### Module Boundary

| # | 규칙 | 스캔 대상 | 위반 조건 |
|---|------|----------|----------|
| A-07 | barrel import 강제 | 모든 import 문 | 슬라이스 내부 세그먼트 경로 직접 import (예: `features/xxx/ui/yyy`, `entities/xxx/model/yyy`) — 슬라이스 barrel(index.ts) 통해서만 import. 예외: @x 교차 import 경로 |

### Type Safety

| # | 규칙 | 스캔 대상 | 위반 조건 |
|---|------|----------|----------|
| T-04 | any 금지 | 모든 타입 선언 | `: any` 발견 |
| T-13 | Props named export | 모든 컴포넌트 props | 인라인 타입 사용 |

### Context Provider

| # | 규칙 | 스캔 대상 | 위반 조건 |
|---|------|----------|----------|
| S-14 | Provider value useMemo | Context Provider의 value prop | `value={{ ... }}` 인라인 객체 — useMemo로 감싸지 않음 |

### Accessibility

| # | 규칙 | 스캔 대상 | 위반 조건 |
|---|------|----------|----------|
| T-11 | 시맨틱 HTML | 모든 JSX | `<div onClick>`, 비시맨틱 레이아웃 |

---

## Scan 실행 방식

```
슬롯 채우기 완료 + Design Guard 확인
  ↓
Section A (Pre-Generation) 스캔 — 슬롯 수준 검증
  ↓
위반 발견 → 슬롯 수정 후 재검증
  ↓
Section A 통과 → 코드 변환
  ↓
Section B (Post-Generation) 스캔 — 코드 수준 검증
  ↓
위반 발견 → 즉시 수정
  ↓
전체 스캔 완료 → 코드 제출 가능
```

**Section A와 Section B 모두 생략할 수 없다. Section A 없이 코드 변환을 시작하지 않는다.**
