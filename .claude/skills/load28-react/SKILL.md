---
name: load28-react
description: Use when creating or modifying React, TSX, or JSX files - enforces 78 coding rules across architecture, naming, component, state, performance, and testing categories through mandatory reference lookup and post-write verification
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill entirely.
</SUBAGENT-STOP>

# load28 React Coding Rules

> "기억에 의존하지 않는다. 검증을 강제한다."

<EXTREMELY-IMPORTANT>
React/TSX/JSX 코드를 작성하거나 수정할 때, 이 스킬의 3단계 프로토콜을 반드시 따른다.
Phase 2 검증과 Phase 3 보고 없이 코드 제출을 완료하지 않는다.
이것은 선택이 아니다. 협상 불가능하다.

**규칙의 문언을 위반하는 것은 규칙의 정신을 위반하는 것이다.**
</EXTREMELY-IMPORTANT>

## 동작 프로토콜

```
Phase 1: 레퍼런스 참조 → 코드 작성 → Phase 2: 최종 검증 → Phase 3: 보고
```

## Phase 1: 레퍼런스 참조 (코드 작성 전)

### Step 1: 구현 계획 + 태그 식별

작성할 코드의 목록을 계획하고, 각 코드에 필요한 기술 패턴 태그를 식별한다.

### Step 2: 파일명 기반 레퍼런스 검색

[reference-code/](reference-code/) 디렉토리에서 **파일명의 태그**로 검색한다.
파일명은 `태그1--태그2--태그3.md` 형식이다.

```
Glob("reference-code/**/*{태그}*")
```

- 매칭됨 → 해당 파일을 읽고 패턴을 참조하여 코드 작성
- 매칭 안 됨 → Phase 1-A(레퍼런스 추가) 실행

### Step 3: 레퍼런스 기반 코드 작성

레퍼런스의 구조와 패턴을 따라 코드를 작성한다. 도메인 용어만 프로젝트에 맞게 교체한다.

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

❌ BAD: 도메인 종속적
- 파일명: pdf-upload--form--mutation.md
- 코드: usePdfUpload, PdfFile 타입, validatePdfSize
- 이유: "PDF"는 특정 파일 형식에 종속

✅ GOOD: 도메인 비종속 — 범용 기술 패턴
- 파일명: zustand--state--client-state.md
- 코드: useEntityStore, selectedEntityId, Entity 타입
- 이유: "Entity"는 어떤 도메인에든 대입 가능한 범용 플레이스홀더

✅ GOOD: 도메인 비종속
- 파일명: file-upload--form--mutation.md
- 코드: useFileUpload, UploadedFile 타입, validateFileSize
- 이유: "파일 업로드"는 도메인이 아니라 기술 패턴 자체
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

## Phase 2: 최종 검증 (코드 작성 완료 후)

### The Iron Law

```
검증 없이 완료를 주장하지 않는다.
```

**작성한 코드의 모든 변경 사항**을 검증한다.
위반 발견 시 **즉시 수정**한 뒤 다음 항목으로 넘어간다.
해당 없는 항목은 건너뛴다.

### 검증 방법

**반드시 아래 규칙 파일을 읽고** 해당 규칙을 하나씩 검증한다:

| 파일 | 카테고리 | 규칙 |
|------|----------|------|
| [architecture.md](architecture.md) | A-01~10 | 의존성 방향, 레이어 분리, 결합도, 모듈 경계 |
| [naming-conventions.md](naming-conventions.md) | N-01~08 | PascalCase, camelCase, on/handle, Boolean 접두사 |
| [component-patterns.md](component-patterns.md) | C-01~15 | SRP, 합성, 훅 규칙, key, 클로저, 제거 예정 API |
| [state-and-data.md](state-and-data.md) | S-01~17 | 함수형 setState, 파생 상태, Context, 비동기 |
| [performance.md](performance.md) | P-01~14 | 가상화, dynamic import, 워터폴, 의존성 배열 |
| [testing-a11y.md](testing-a11y.md) | T-01~15 | Testing Library, MSW, strict TS, 에러 바운더리 |

### 자주 위반되는 규칙 (반드시 확인)

이 규칙들은 위반 빈도가 높아 **모든 검증에서 반드시 확인**한다:

- **C-01**: 컴포넌트 내부 컴포넌트 정의 없음
- **C-02**: 조건부 훅 호출 없음
- **S-02**: useEffect 내 파생 상태 계산 없음 (useMemo 사용)
- **S-03**: 파생 가능한 값 state 미저장
- **S-05**: props→state 복사 패턴 없음
- **S-06**: 함수형 setState (prev => prev + 1)
- **S-16**: useEffect cleanup 구현
- **P-03**: 모듈 레벨 기본값 상수 (inline 기본값 금지)
- **P-04**: 삼항 연산자 조건부 렌더 (number/string 조건에서 && 미사용)
- **P-05**: inline style 객체 없음
- **T-04**: any 타입 미사용 (unknown + type guard)
- **N-03**: on*/handle* 이벤트 네이밍
- **N-04**: Boolean is*/has*/can*/should*
- **C-15**: React 제거 예정 API 미사용 (forwardRef, defaultProps 등)

## Phase 3: 보고

**Phase 3 보고 없이 코드 제출을 완료하지 않는다.**

검토 결과를 사용자에게 다음 포맷으로 출력한다:

```
## load28 React Review

### 적용된 규칙
- ✅ A-01, A-08, N-01, N-03, C-01, C-02, S-06, P-13 ...

### 수정 사항 (검토 중 발견하여 수정)
- 🔧 S-02: useEffect 내 파생 상태 → useMemo로 변경
- 🔧 P-04: && 조건부 렌더 → 삼항 연산자로 변경

✅ 전체 검토 완료 — XX개 적용, XX개 수정
```

## Red Flags — STOP

이런 생각이 들면 멈추고 프로토콜을 따른다:

| 생각 | 현실 |
|------|------|
| "간단한 수정이라 검증 불필요" | 간단한 코드도 규칙을 위반한다. 검증한다. |
| "이미 패턴을 알고 있다" | 기억 ≠ 검증. 레퍼런스를 읽는다. |
| "규칙 파일 읽기가 과하다" | 읽지 않으면 위반을 놓친다. |
| "한 줄 변경이라 Phase 2 생략" | 한 줄도 S-06, P-04를 위반할 수 있다. |
| "Phase 3 보고는 형식적" | 보고는 검증의 증거다. 생략 불가. |
| "시간이 부족하다" | 검증 없는 코드는 더 많은 시간을 낭비한다. |
| "이번만 예외" | 예외는 없다. |
