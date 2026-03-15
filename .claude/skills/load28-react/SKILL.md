---
name: load28-react
description: Use when creating or modifying React, TSX, or JSX files - enforces 79 coding rules across architecture, naming, component, state, performance, and testing categories. Rules are embedded as structural slots in schemas — fill slots to design, generate code from filled slots.
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill entirely.
</SUBAGENT-STOP>

# load28 React — Slot-Based Design Protocol

> "슬롯을 채우면 코드가 된다. 슬롯이 비면 코드를 쓸 수 없다."

<EXTREMELY-IMPORTANT>
React/TSX/JSX 코드를 작성하거나 수정할 때, 이 스킬의 슬롯 기반 프로토콜을 반드시 따른다.
스키마를 읽지 않고 코드를 구상하지 않는다.
슬롯을 채우지 않고 코드를 생성하지 않는다.
Grammar Scan 없이 코드를 제출하지 않는다.
이것은 선택이 아니다. 협상 불가능하다.

**리액트 코드를 먼저 생각하고 규칙을 매칭하는 것이 아니다.**
**스키마의 빈 슬롯을 채워서 설계하고, 채워진 슬롯에서 코드를 생성한다.**
</EXTREMELY-IMPORTANT>

## 핵심 원리: 규칙은 슬롯이다

```
❌ 기존 (규칙 = 지식):
   79개 규칙 암기 → 리액트 코드 구상 → 규칙 매칭 → 누락 발견 → 수정

✅ 현재 (규칙 = 슬롯):
   스키마 로드 → 빈 슬롯 채우기 = 설계 완료
   → 채워진 슬롯 → 코드 생성 (기계적 변환)
   → Grammar Scan → 제출
```

TypeScript 컴파일러가 타입 오류를 "검사"하는 게 아니라 **컴파일 자체가 안 되는 것**처럼,
규칙을 "확인"하는 게 아니라 **슬롯이 비어있으면 코드 생성 자체가 불가능한 구조**다.

- props 슬롯이 7칸뿐이므로 8개 props를 가질 수 없다
- cleanup 슬롯이 필수이므로 useEffect cleanup을 잊을 수 없다
- 이벤트 슬롯이 on___/handle___ 형식이므로 네이밍 규칙을 어길 수 없다
- type_strategy 슬롯을 선택해야 하므로 discriminated union 판단을 건너뛸 수 없다

---

## 동작 프로토콜

```
Phase 1: 스키마 선택 → Phase 2: 슬롯 채우기 → Phase 3: 코드 생성 + Grammar Scan → 보고
```

---

## Phase 1: 스키마 선택

### Step 1: 만들 것 식별

작성할 각 파일이 무엇인지 식별하고, 대응하는 스키마를 선택한다:

| 만들 것 | 스키마 | 읽기 |
|---------|--------|------|
| 컴포넌트 TSX | [schemas/component.md](schemas/component.md) | 필수 |
| 커스텀 훅 | [schemas/hook.md](schemas/hook.md) | 필수 |
| Context + Provider | [schemas/context.md](schemas/context.md) | 필수 |
| Zustand 스토어 | [schemas/store.md](schemas/store.md) | 필수 |
| API/데이터 레이어 | [schemas/api-layer.md](schemas/api-layer.md) | 필수 |
| 테스트 파일 | [schemas/test.md](schemas/test.md) | 필수 |
| 타입 정의 | [schemas/type.md](schemas/type.md) | 필수 |
| barrel file (index.ts) | [schemas/barrel.md](schemas/barrel.md) | 필수 |
| 피처 모듈 전체 | [schemas/module.md](schemas/module.md) | 필수 (다른 스키마의 상위) |

**여러 파일을 작성하는 경우:**
1. 먼저 [schemas/module.md](schemas/module.md)로 모듈 전체 구조를 설계
2. 그 안의 각 파일에 대해 개별 스키마를 채움

### Step 2: 스키마 + Grammar 읽기

선택한 스키마 파일을 **반드시 읽는다**. 추가로 [schemas/_grammar.md](schemas/_grammar.md)를 읽는다.
이 두 가지가 코드를 생성하기 위한 전부다.

### Step 3: 레퍼런스 검색

[reference-code/](reference-code/) 디렉토리에서 관련 패턴을 검색한다:

```
Glob("reference-code/**/*{태그}*")
```

- 매칭됨 → 해당 파일을 읽어 구현 참고
- 매칭 안 됨 → Phase 1-A(레퍼런스 추가) 실행

---

## Phase 2: 슬롯 채우기

### The Iron Law

```
빈 슬롯이 하나라도 있으면 코드를 생성하지 않는다.
```

### 실행

스키마의 모든 슬롯을 채운다. 출력 형식:

```
## Filled Schema: component

### Identity
- name: ThreadPanel
- file_path: features/thread/components/ThreadPanel.tsx
- responsibility: 스레드 패널의 메시지 목록과 입력을 렌더링한다
- line_budget: 180/250
- exports: 1

### Props Interface
- interface_name: ThreadPanelProps
- type_strategy: grouped
- slots:
  1. thread: Thread
  2. replies: Reply[]
  3. permissions: ThreadPermissions (그룹)
  4. actions: ThreadPanelActions (그룹)
  5. currentUserId: string
  6. —
  7. —

### Events
| prop        | handler       | 설명         |
|-------------|---------------|-------------|
| onReply     | handleReply   | 답글 제출     |
| onClose     | handleClose   | 패널 닫기     |

### State
| name       | type    | source       | 근거         |
|------------|---------|-------------|-------------|
| isExpanded | boolean | local       | 이 컴포넌트만 사용 |

### Derived
| name         | 계산 원본  | 방식     |
|-------------|----------|---------|
| replyCount  | replies  | 직접 계산 |

### Effects
없음

### Conditionals
| condition           | expression                          |
|--------------------|-------------------------------------|
| replies.length > 0 | replies.length > 0 ? <List /> : null |

### Dependencies
- imports_from: [features/thread (barrel), shared/components]
- forbidden: [features/message, features/chat]
- import_style: barrel import

### Composition
- slot_props_count: 0
- composition_needed: no
- children_usage: none

### 슬롯 완료: 전부 채움 ✓
```

**채워진 슬롯이 곧 설계다.** 별도의 "설계 문서"가 필요 없다.

---

## Phase 3: 코드 생성 + Grammar Scan

### Step 1: 슬롯 → 코드 변환

채워진 슬롯을 TypeScript/React 코드로 기계적으로 변환한다.
레퍼런스의 구조를 따르되, 도메인 용어만 프로젝트에 맞게 교체한다.

**변환 규칙:**
- Identity → 파일 생성, 컴포넌트 함수 선언
- Props Interface → interface 정의 + export
- Events → on/handle 함수 쌍
- State → useState/useQuery 등 선언
- Derived → useMemo 또는 렌더 중 계산
- Effects → useEffect + cleanup
- Conditionals → 삼항 연산자 JSX
- Dependencies → import 문

### Step 2: Grammar Scan

[schemas/_grammar.md](schemas/_grammar.md)의 테이블을 위에서 아래로 기계적으로 스캔한다.
위반 발견 시 즉시 수정. **이 스캔은 생략할 수 없다.**

### Step 3: 보고

위반이 없으면 1줄 요약, 위반이 있으면 수정 내역만 보고:

```
## load28 React Review

### 채워진 스키마
- 📋 component: ThreadPanel (슬롯 12/12 완료)
- 📋 hook: useThreadReplies (슬롯 8/8 완료)

### Grammar Scan: 전체 통과 (34개 규칙 스캔)
- 🔧 P-04: && → 삼항으로 수정 (1건)

✅ 전체 완료
```

---

## Phase 1-A: 레퍼런스 추가 (매칭 없을 때만)

매칭되는 레퍼런스가 없을 때 실행한다.

**탈출 조건:** 정확히 매칭되는 레퍼런스가 없더라도,
태그가 1개 이상 겹치는 유사 레퍼런스가 존재하면 Phase 1-A를 건너뛰고
해당 레퍼런스를 구조적 참고로 사용하여 Phase 2로 진행할 수 있다.
단, 보고 시 "유사 레퍼런스 참고: [파일명]"을 명시한다.

유사 레퍼런스도 전혀 없는 새로운 패턴인 경우에만 아래 절차로 레퍼런스를 생성한다.

### 핵심 원칙: 도메인 비종속

레퍼런스 코드는 **특정 도메인에 종속되지 않는 순수 기술 패턴**이어야 한다.

```
❌ BAD: 도메인 종속적
- 파일명: zustand--workspace--client-state.md
- 코드: useWorkspaceStore, selectedWorkspaceId

✅ GOOD: 도메인 비종속
- 파일명: zustand--state--client-state.md
- 코드: useEntityStore, selectedEntityId
```

**범용 플레이스홀더:** `Entity`, `Resource`, `Item` 등 도메인 무관한 이름 사용.

### 작성 절차 — 스키마 기반

레퍼런스 코드도 **동일한 슬롯 기반 프로토콜**로 작성한다:

1. 레퍼런스에 포함될 코드 구성물 식별 (컴포넌트, 훅, 타입 등)
2. 각 구성물의 스키마를 읽고 슬롯 채우기 (도메인 비종속 플레이스홀더 사용)
3. 슬롯 → 코드 변환 + Grammar Scan
4. 도메인 용어 검증 → 범용 플레이스홀더로 교체
5. [reference-code/_tags.md](reference-code/_tags.md)에서 태그 선택 (없으면 새 태그 등록)
6. frontmatter(`tags`, `rules`, `description`) 작성, `태그1--태그2.md` 형식으로 저장
7. **파일명에 도메인 용어가 포함되면 안 된다.** 태그 기반 기술 패턴명만 사용

**핵심:** 레퍼런스는 "스키마를 채워서 만든 모범 코드"다.
스키마 없이 자유롭게 작성된 레퍼런스는 규칙을 누락할 수 있다.

---

## 기존 코드 수정 시

새 파일이 아니라 기존 파일을 수정하는 경우에도 프로토콜은 동일하다:

1. 수정 대상 파일을 읽는다
2. 해당 파일 유형의 스키마를 읽는다
3. **수정할 부분에 해당하는 슬롯만 채운다** (전체 스키마를 다시 채울 필요 없음)
4. 슬롯 → 코드 변환
5. Grammar Scan

```
예: 컴포넌트에 새 이벤트 핸들러 추가
→ component.md의 Events 슬롯과 Props 슬롯만 채움
→ 코드 변환 → Grammar Scan
```

---

## Red Flags — STOP

이런 생각이 들면 멈추고 프로토콜을 따른다:

| 생각 | 현실 |
|------|------|
| "스키마 읽기 없이 바로 코드 쓰자" | 스키마 없이는 슬롯이 없고, 슬롯 없이는 코드 없다. |
| "슬롯 채우기가 과하다" | 슬롯이 곧 설계다. 설계 없이 코드를 쓰는 것이 과한 것이다. |
| "간단한 수정이라 스키마 불필요" | JSX 구조가 변하면 해당 슬롯 채우기 필수. JSX 변경 없는 수정(변수 리네이밍, import 수정 등)은 Grammar Scan만 필수. |
| "이미 규칙을 알고 있다" | 기억이 아니라 슬롯이다. 슬롯을 채워라. |
| "이번만 예외" | 예외는 없다. |
| "Grammar Scan은 형식적" | Scan은 변환의 증거다. 생략 불가. |
