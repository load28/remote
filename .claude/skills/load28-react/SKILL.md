---
name: load28-react
description: Use when creating or modifying React, TSX, or JSX files - enforces 98 coding rules across architecture, naming, component, state, performance, and testing categories. Rules and references form a design language that code is conceived in, not checked against.
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill entirely.
</SUBAGENT-STOP>

# load28 React Coding Rules

> "규칙으로 사고한다. 규칙을 검사하지 않는다."

<EXTREMELY-IMPORTANT>
React/TSX/JSX 코드를 작성하거나 수정할 때, 이 스킬의 3단계 프로토콜을 반드시 따른다.
Phase 1(언어 습득) 없이 코드를 구상하지 않는다.
Phase 3 보고 없이 코드 제출을 완료하지 않는다.
이것은 선택이 아니다. 협상 불가능하다.

**리액트 코드를 먼저 생각하고 규칙을 매칭하는 것이 아니다.**
**규칙과 레퍼런스가 만드는 언어로 처음부터 사고한다.**
</EXTREMELY-IMPORTANT>

## 핵심 원리: 규칙은 필터가 아니라 언어다

```
❌ 기존 사고방식 (규칙 = 필터):
   리액트 코드 구상 → 규칙 매칭 → 위반 발견 → 수정

✅ 올바른 사고방식 (규칙 = 언어):
   규칙 + 레퍼런스 + 패턴 = 설계 언어
   → 그 언어의 어휘로 사고
   → 실제 코드로 변환
```

경험 많은 개발자가 "props가 7개 넘으니까 줄여야지"라고 생각하지 않는 것처럼,
처음부터 "이 컴포넌트의 인터페이스는 C-04/T-14 패턴이다"라고 사고한다.

## 동작 프로토콜

```
Phase 1: 언어 습득 → Phase 2: 언어로 설계 + 코드 작성 → Phase 3: 변환 검증 + 보고
```

---

## Phase 1: 언어 습득 (모든 것에 앞서)

### The First Law

```
언어를 모르면 말할 수 없다.
규칙을 읽지 않으면 코드를 구상하지 않는다.
```

### Step 1: 규칙 파일 전수 읽기

**반드시** 아래 6개 규칙 파일을 **전부** 읽는다. 선택적 읽기가 아니다.
이 파일들이 곧 코드를 구상할 때 사용할 **어휘와 문법**이다.

| 파일 | 어휘 | 읽기 |
|------|------|------|
| [architecture.md](architecture.md) | A-01~10: 모듈 구조, 의존성 방향, 레이어 분리 | **필수** |
| [naming-conventions.md](naming-conventions.md) | N-01~08: 이름 규칙 | **필수** |
| [component-patterns.md](component-patterns.md) | C-01~15: 컴포넌트 구조 제약 | **필수** |
| [state-and-data.md](state-and-data.md) | S-01~17: 상태 관리 패턴 | **필수** |
| [performance.md](performance.md) | P-01~14: 성능 패턴 | **필수** |
| [testing-a11y.md](testing-a11y.md) | T-01~15: 타입, 테스트, 접근성 | **필수** |

### Step 2: 레퍼런스 검색

[reference-code/](reference-code/) 디렉토리에서 작성할 코드에 관련된 **기술 패턴 태그**로 검색한다.
파일명은 `태그1--태그2--태그3.md` 형식이다.

```
Glob("reference-code/**/*{태그}*")
```

- 매칭됨 → 해당 파일을 읽어 **어휘에 추가**
- 매칭 안 됨 → Phase 1-A(레퍼런스 추가) 실행

### Step 3: 어휘 확인

Phase 1 완료 시, 다음을 알고 있어야 한다:
- 98개 규칙의 제약과 패턴
- 작성할 코드에 관련된 레퍼런스의 구조

이것이 코드를 구상할 때 사용할 **전체 어휘**다.

---

## Phase 2: 언어로 설계 + 코드 작성

### Step 1: 규칙 언어로 설계

리액트 코드를 먼저 떠올리지 않는다. **규칙 ID와 레퍼런스 패턴을 원시 단위로** 설계한다.

설계 산출물은 다음 형식이다:

```
## 설계 명세

### 파일: features/thread/types.ts
- 패턴: T-13(named exported interface), T-14(discriminated union), T-15(no optional abuse)
- 레퍼런스: discriminated-union--type-safety.md

### 파일: features/thread/domain/threadRules.ts (~200줄, C-05 준수)
- 패턴: A-05(순수 함수 비즈니스 로직), N-06(상수 UPPER_SNAKE_CASE)
- React import 없음 (A-05 검증: React 없이 테스트 가능)

### 파일: features/thread/components/ThreadPanel.tsx (~180줄, C-05 준수)
- Props: 7개 (C-04 준수) — thread, replies, authorMap, currentUserId, parentInfo, permissions, onAction
- Props 그룹화: ThreadPermissions(4필드), ThreadPanelActions(5필드) → C-04 패턴
- 조건부 렌더: P-04(삼항), N-04(isLocked, hasPermission)
- 이벤트: N-03(props=onReply/onClose, 내부=handleSubmit)

### 의존성 방향 (A-01 준수)
  app/ChatPage → features/thread (barrel import, A-07)
  app/ChatPage → features/message (barrel import, A-07)
  features/thread ✗→ features/message (금지)
```

**핵심:** 각 파일·인터페이스·함수가 어떤 규칙의 어떤 패턴으로 구성되는지 명시한다.
이 단계에서 규칙 위반은 발생할 수 없다 — 규칙이 곧 설계의 언어이기 때문이다.

### Step 2: 코드 변환

설계 명세를 실제 TypeScript/React 코드로 변환한다.
레퍼런스의 구조를 따르되, 도메인 용어만 프로젝트에 맞게 교체한다.

#### 문법 규칙 — 코드 변환 시 항상 적용

설계 명세에는 **어휘** (구조적 결정)만 적는다.
아래 **문법** 규칙은 설계 명세에 적지 않아도 **코드의 모든 줄에 자동 적용**된다.

설계 명세의 어휘가 "무엇을 만들 것인가"를 결정한다면,
문법은 "어떻게 쓸 것인가"를 결정한다. 문법은 의식적으로 선택하는 것이 아니라 체화된 것이다.

| 카테고리 | 문법 규칙 | 적용 |
|----------|-----------|------|
| **네이밍** | N-01: 컴포넌트 PascalCase | 모든 컴포넌트/파일 |
| | N-02: props camelCase | 모든 props |
| | N-03: props `on*`, 내부 `handle*` | 모든 이벤트 핸들러 |
| | N-04: Boolean `is*/has*/can*/should*` | 모든 boolean 변수 |
| | N-05: 훅 `use` + 동사 | 모든 커스텀 훅 |
| | N-06: 상수 UPPER_SNAKE_CASE | 모든 모듈 레벨 상수 |
| **상태** | S-01: state 직접 변경 금지 | 모든 state 업데이트 |
| | S-02: useEffect 내 파생 상태 금지 → useMemo | 모든 파생 계산 |
| | S-03: 파생 가능한 값 state 금지 | 모든 state 선언 |
| | S-05: props→state 복사 금지 | 모든 state 초기화 |
| | S-06: 이전 값 기반 → 함수형 setState | 모든 prev 기반 업데이트 |
| | S-16: useEffect cleanup 필수 | 모든 useEffect |
| | S-17: mutation 훅 onSuccess 내장 금지 | 모든 useMutation |
| **성능** | P-03: 기본값 모듈 레벨 상수 | 모든 기본 파라미터 |
| | P-04: 조건부 렌더 삼항. 중첩 삼항 금지 | 모든 조건부 렌더링 |
| | P-05: inline style 객체 금지 | 모든 style prop |
| | P-06: `export *` 금지 | 모든 barrel file |
| | P-14: 객체/배열 의존성 → primitive 추출 | 모든 deps 배열 |
| **컴포넌트** | C-01: 내부 컴포넌트 정의 금지 | 모든 컴포넌트 |
| | C-02: 조건부 훅 호출 금지 | 모든 Hook 호출 |
| | C-03: 동적 리스트 인덱스 key 금지 | 모든 .map() 렌더 |
| | C-06: 불필요한 wrapper div 금지 | 모든 JSX 반환 |
| | C-13: 클로저 트랩 확인 | 모든 useCallback |
| | C-15: forwardRef/defaultProps 금지 (React 19+) | 모든 컴포넌트 |
| **타입** | T-04: any 금지 → unknown + type guard | 모든 타입 선언 |
| | T-13: Props named exported interface | 모든 props 타입 |
| **접근성** | T-11: 시맨틱 HTML + ARIA | 모든 JSX 요소 |

---

## Phase 1-A: 레퍼런스 추가 (매칭 없을 때만)

매칭되는 레퍼런스가 없을 때 실행한다. **레퍼런스 없이 코드를 작성하지 않는다.**

### 핵심 원칙: 도메인 비종속

레퍼런스 코드는 **특정 도메인에 종속되지 않는 순수 기술 패턴**이어야 한다.
레퍼런스는 "이 패턴을 어떻게 구현하는가"를 보여주는 것이지, "워크스페이스를 어떻게 만드는가"를 보여주는 것이 아니다.

```
❌ BAD: 도메인 종속적 — 특정 비즈니스 개념이 코드에 박혀 있음
- 파일명: zustand--workspace--client-state.md
- 코드: useWorkspaceStore, selectedWorkspaceId, Workspace 타입
- 이유: "workspace"는 특정 앱의 비즈니스 도메인 용어

✅ GOOD: 도메인 비종속 — 범용 기술 패턴
- 파일명: zustand--state--client-state.md
- 코드: useEntityStore, selectedEntityId, Entity 타입
- 이유: "Entity"는 어떤 도메인에든 대입 가능한 범용 플레이스홀더
```

**범용 플레이스홀더 용어:** `Entity`, `Resource`, `Item` 등 도메인 무관한 이름을 사용한다.
경로 표기도 `{Feature}/hooks/use{Feature}Store.ts`처럼 플레이스홀더로 작성한다.

**판별 기준:** "이 레퍼런스의 변수명/타입명에서 도메인 용어를 제거하고 다른 프로젝트에 그대로 복사해서 쓸 수 있는가?" → No면 도메인 종속적이다.

### 작성 절차

1. 도메인 비종속 일반화된 패턴으로 레퍼런스 코드 작성 (위 원칙 준수)
2. **도메인 용어 검증:** 작성한 레퍼런스에 프로젝트 특정 도메인 용어(workspace, chat, order, product 등)가 포함되어 있으면 범용 플레이스홀더로 교체
3. 관련 규칙 파일을 읽어 해당 규칙 전수 검증 → 위반 시 수정 후 재검증
4. [reference-code/_tags.md](reference-code/_tags.md)에서 태그 선택 (없으면 새 태그 등록)
5. frontmatter(`tags`, `rules`, `description`) 작성, `태그1--태그2.md` 형식으로 저장
6. **파일명에 도메인 용어가 포함되면 안 된다.** 태그 기반 기술 패턴명만 사용

---

## Phase 3: 변환 검증 + 보고

### The Iron Law

```
검증 없이 완료를 주장하지 않는다.
```

Phase 2의 설계 명세와 실제 코드를 대조하여, **변환이 충실했는지** 검증한다.

### 검증 방법

설계 명세에 적힌 각 규칙 ID를 실제 코드에서 확인한다:

1. **설계 명세의 모든 규칙 ID**가 실제 코드에 반영되었는가?
2. **정량적 제약 재측정:**
   - C-04: 각 컴포넌트의 props 수를 센다. 7개 초과 시 즉시 수정.
   - C-05: 각 파일의 줄 수를 확인한다. 250줄 초과 시 즉시 분리.
   - C-10: 파일당 exported 컴포넌트가 1개인지 확인한다.
3. **설계 시 고려하지 않은 규칙**이 코드에서 위반되었는가?
   - 6개 규칙 파일을 다시 참조하여 누락된 규칙이 없는지 확인한다.

위반 발견 시 **즉시 수정**한 뒤 다음 항목으로 넘어간다.

### 보고

**Phase 3 보고 없이 코드 제출을 완료하지 않는다.**

```
## load28 React Review

### 설계 언어 (Phase 2에서 사용한 규칙 어휘)
- 📐 ThreadPanel: C-04(props 그룹화), T-14(discriminated union), N-03(on/handle)
- 📐 threadRules.ts: A-05(순수 비즈니스 로직), T-04(no any)
- 📐 의존성 방향: A-01(단방향), A-07(barrel import)

### 변환 검증 결과
- ✅ A-01, A-05, A-07, N-01, N-03, N-04, C-01, C-02, C-04, C-05, S-06, S-16, P-03, P-04, T-04, T-13, T-14 ...

### 수정 사항 (검증 중 발견하여 수정)
- 🔧 S-02: useEffect 내 파생 상태 → useMemo로 변경
- 🔧 P-04: && 조건부 렌더 → 삼항 연산자로 변경

✅ 전체 검토 완료 — 설계 어휘 XX개, 규칙 XX개 적용, XX개 수정
```

---

## Red Flags — STOP

이런 생각이 들면 멈추고 프로토콜을 따른다:

| 생각 | 현실 |
|------|------|
| "리액트 코드부터 생각하고 규칙을 맞추자" | 순서가 틀렸다. 규칙이 언어, 코드는 번역이다. |
| "이미 규칙을 알고 있다" | 기억 ≠ 읽기. 6개 파일을 읽는다. |
| "몇 개 규칙만 관련있다" | 98개 전부가 어휘다. 선택적 읽기는 불완전한 언어다. |
| "규칙 파일 읽기가 과하다" | 읽지 않으면 불완전한 언어로 사고한다. |
| "간단한 수정이라 Phase 1 불필요" | 한 줄도 언어의 일부다. 규칙을 읽는다. |
| "Phase 3 보고는 형식적" | 보고는 변환의 증거다. 생략 불가. |
| "이번만 예외" | 예외는 없다. |
