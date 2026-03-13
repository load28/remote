# React 코딩 표준 스킬 구현 계획

## 목표
React 코드를 작성할 때 **자동으로** 코딩 표준이 적용되도록 스킬 구성

## 아키텍처

### 2-레이어 구조

```
.claude/
├── rules/
│   └── react.md                    # 트리거 지시문 (짧음, 항상 로드)
│       → "React/TSX 코드 작성 시 react-standards 스킬의 모든 규칙을 준수하라"
│       → 가장 치명적인 NEVER 규칙 요약 (빠른 참조용)
│
└── skills/
    └── react-standards/
        ├── SKILL.md                # 진입점: 철학 + 전체 규칙 요약 + 참조 링크
        ├── naming-conventions.md   # 네이밍 규칙 상세
        ├── component-patterns.md   # 컴포넌트 설계 패턴 상세
        ├── state-and-data.md       # 상태관리 & 데이터 흐름 상세
        ├── performance.md          # 성능 최적화 상세
        └── testing-a11y.md         # 테스트 & 접근성 & 타입 상세
```

### 왜 이 구조인가?

1. **rules/react.md** (항상 로드됨)
   - React 코드 감지 시 스킬 참조를 강제하는 지시문
   - 핵심 NEVER 체크리스트 포함 (즉각 참조 가능)
   - 짧게 유지 (50줄 이내) → 컨텍스트 낭비 최소

2. **skills/react-standards/** (description 매칭 시 자동 로드)
   - `user-invocable: true` → `/react-standards`로 수동 호출도 가능
   - description이 컨텍스트에 항상 있어 자동 트리거
   - 참조 파일은 필요 시에만 로드 → 컨텍스트 효율적
   - **모든 규칙이 여기에 있으므로 누락 없음**

### 동작 흐름

```
세션 시작
  → rules/react.md 로드 (항상)
  → "React 코드 작성 시 react-standards 참조" 지시 인식

React 코드 작성 요청
  → rules/react.md의 지시 + skill description 매칭
  → SKILL.md 자동 로드 (전체 규칙 요약)
  → 필요 시 상세 참조 파일 로드 (component-patterns.md 등)
  → 모든 규칙이 적용된 코드 생성
```

---

## 파일별 구현 계획

### 1. `.claude/rules/react.md` (~50줄)

**내용:**
- React/TSX/JSX 파일 작성 시 react-standards 스킬 참조 지시
- Quick NEVER 체크리스트 (전 카테고리 통합, 가장 치명적인 것들)
- "상세 규칙과 올바른 패턴은 react-standards 스킬 참조" 명시

### 2. `SKILL.md` — 스킬 진입점 (~200줄)

**frontmatter:**
```yaml
name: react-standards
description: React/TypeScript 코드 작성 시 자동 적용. 컴포넌트, 상태관리, 성능, 네이밍, 테스트 전반의 코딩 표준을 제공합니다. React, TSX, JSX 파일을 생성하거나 수정할 때 이 스킬을 참조하세요.
```

**내용:**
- 철학: "React 내부 동작 원리에 기반한 정확한 코드"
- 5개 참조 문서 링크 + 각 문서의 핵심 내용 한줄 설명
- 전체 규칙 Quick Reference (카테고리별 한줄 요약 테이블)
- 각 카테고리별 NEVER / ALWAYS 규칙 번호와 한줄 설명

### 3. `naming-conventions.md` — 네이밍 규칙 (~80줄)

8개 규칙:
- PascalCase 컴포넌트/파일
- camelCase props
- on*/handle* 이벤트 네이밍
- Boolean is*/has*/can*/should*
- 커스텀 훅 use + 동사
- 상수 UPPER_SNAKE_CASE
- 유틸리티 파일 camelCase
- 의미없는 이름 금지

각 규칙: BAD → GOOD 코드 예시 포함

### 4. `component-patterns.md` — 컴포넌트 설계 (~250줄)

14개 규칙 (NEVER 6개 + ALWAYS 8개):
- 컴포넌트 안에서 컴포넌트 정의 금지 (React reconciler가 매 렌더 새 타입으로 인식)
- 조건부 훅 호출 금지
- 배열 인덱스 key 금지
- props 7개 초과 금지 / 250줄 초과 금지
- 불필요한 wrapper div 금지
- SRP, 합성 우선, Compound Component
- key로 상태 리셋
- 클로저 트랩 설명
- Feature 기반 구조

각 규칙: WHY(React 내부 동작) + BAD → GOOD 코드

### 5. `state-and-data.md` — 상태관리 & 데이터 흐름 (~250줄)

16개 규칙 (NEVER 7개 + ALWAYS 9개):
- state 직접 변경 금지
- useEffect 파생 상태 금지 / 파생 가능한 값 state 저장 금지
- 수동 fetch 패턴 금지
- props→state 복사 금지
- setState(count+1) 금지 → functional update
- 하나의 Context에 모든 상태 금지
- 서버/클라이언트 상태 분리
- 상태 코로케이션
- ref vs state 구분
- Context 분리 + useMemo

각 규칙: WHY(배칭, 클로저, reconciliation) + BAD → GOOD 코드

### 6. `performance.md` — 성능 최적화 (~200줄)

14개 규칙 (NEVER 6개 + ALWAYS 8개):
- 프로파일링 없이 최적화 금지
- 50+ 리스트 가상화 없이 렌더 금지
- inline 기본값/style 객체 금지
- && 조건부 렌더 금지 → 삼항
- barrel file 남용 금지
- 워터폴 제거 / dynamic import
- startTransition
- AbortController (레이스 컨디션)
- 객체 의존성 → primitive 추출

각 규칙: WHY + BAD → GOOD 코드

### 7. `testing-a11y.md` — 테스트 & 접근성 & 타입 (~200줄)

14개 규칙 (NEVER 6개 + ALWAYS 8개):
- 구현 세부사항 테스트 금지
- fetch 직접 모킹 금지 → MSW
- __tests__/ 디렉토리 금지
- any 타입 금지
- Suspense/ErrorBoundary 착각 금지
- 사용자 관점 쿼리
- 3단계 에러 바운더리
- 시맨틱 HTML
- strict TypeScript

각 규칙: WHY + BAD → GOOD 코드

---

## 공통 포맷

각 참조 파일의 규칙 포맷:

```markdown
### R-XX: [규칙 제목]

**분류:** ❌ NEVER | ✅ ALWAYS

**WHY:** React 내부에서 왜 이것이 문제/중요한지 (1-2문장)

```tsx
// ❌ BAD
[잘못된 코드]

// ✅ GOOD
[올바른 코드]
```

---
```

---

## 구현 순서

1. `.claude/rules/react.md` — 트리거 지시문
2. `SKILL.md` — 스킬 진입점
3. `naming-conventions.md`
4. `component-patterns.md`
5. `state-and-data.md`
6. `performance.md`
7. `testing-a11y.md`
8. 커밋 & 푸시
