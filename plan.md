# React 코딩 표준 스킬 구현 계획

## 목표
React 코드 작성 후 **강제 검토 단계**를 통해 모든 코딩 표준 준수를 보장

## 핵심 철학

> "기억에 의존하지 않는다. 검증을 강제한다."

rules/에 규칙을 넣어도 Claude가 잊어버릴 수 있다.
→ 코드 작성 후 **모든 규칙을 체크리스트로 검토하는 단계를 강제**한다.

## 아키텍처

### 단일 스킬 구조 (rules/ 없음)

```
.claude/skills/
└── react-standards/
    ├── SKILL.md                # 진입점: 동작 프로토콜 + 검토 체크리스트
    ├── architecture.md         # 아키텍처 원칙 (의존성 방향, 레이어, 결합도)
    ├── naming-conventions.md   # 네이밍 규칙 상세
    ├── component-patterns.md   # 컴포넌트 설계 패턴 상세
    ├── state-and-data.md       # 상태관리 & 데이터 흐름 상세
    ├── performance.md          # 성능 최적화 상세
    └── testing-a11y.md         # 테스트 & 접근성 & 타입 상세
```

### 동작 프로토콜 (SKILL.md 핵심)

```
React 코드 작성/수정 요청
  │
  ▼
[Phase 1: 참조] 관련 규칙 파일 로드 → 규칙에 맞게 코드 작성
  │
  ▼
[Phase 2: 강제 검토] 작성한 코드를 전체 체크리스트로 검증
  │  - 각 카테고리별 NEVER 규칙 위반 여부 확인
  │  - 각 카테고리별 ALWAYS 규칙 적용 여부 확인
  │  - 위반 발견 시 즉시 수정
  │
  ▼
[Phase 3: 검토 결과 보고] 사용자에게 검토 결과 출력
  │  - ✅ 통과한 규칙
  │  - 🔧 수정한 항목 (있으면)
  │  - 검토 완료 확인
  │
  ▼
코드 제출
```

### 왜 이 방식인가?

| 기존 접근 (rules/) | 새 접근 (강제 검토) |
|---|---|
| 규칙을 "기억"에 의존 | 체크리스트로 "검증"을 강제 |
| 잊어버리면 그대로 통과 | 검토 단계 없이는 완료 불가 |
| 수동적 (읽기만) | 능동적 (각 규칙 대조 확인) |
| 부분 적용 가능 | 전체 적용 강제 |

---

## 파일별 구현 계획

### 1. `SKILL.md` — 스킬 진입점 + 검토 프로토콜 (~200줄)

**frontmatter:**
```yaml
name: react-standards
description: React/TypeScript 코드를 작성하거나 수정할 때 자동 적용. 코드 작성 후 강제 검토 단계를 통해 컴포넌트, 상태관리, 성능, 네이밍, 테스트 전반의 코딩 표준 준수를 보장합니다.
```

**내용:**
1. **동작 프로토콜** — Phase 1(참조) → Phase 2(강제 검토) → Phase 3(보고)
2. **참조 문서 안내** — 6개 파일 + 각 파일의 역할 한줄 설명
3. **강제 검토 체크리스트** — 전체 규칙의 카테고리별 검증 항목
   - 아키텍처: 10개 항목
   - 네이밍: 8개 항목
   - 컴포넌트: 14개 항목
   - 상태/데이터: 16개 항목
   - 성능: 14개 항목
   - 테스트/접근성/타입: 14개 항목
4. **검토 결과 출력 포맷**

### 2. `architecture.md` — 아키텍처 원칙 (~250줄)

10개 규칙:
- A-01: 단방향 의존성 (Feature→Shared OK, Shared→Feature NEVER, Feature→Feature NEVER)
- A-02: Feature 기반 폴더 구조 (기능별 자기 완결 디렉토리)
- A-03: 느슨한 결합 (컴포넌트 역할을 "그리고" 없이 한 문장으로 설명 가능)
- A-04: 높은 응집도 (관련 코드는 같은 모듈에)
- A-05: 레이어 분리 (Presentation / Business Logic / Data Access)
- A-06: 의존성 역전 (구현이 아닌 추상에 의존, third-party SDK 직접 import 금지)
- A-07: 모듈 경계 (barrel file로 public API만 노출, 내부 경로 import 금지)
- A-08: 단방향 데이터 흐름 (props down, events up, 모듈 레벨 mutable 변수 금지)
- A-09: Anti-Corruption Layer (third-party 라이브러리 래퍼로 격리)
- A-10: 코로케이션 (관련 파일 같은 디렉토리, 상태는 사용처 가까이)

각 규칙: WHY + BAD → GOOD 코드 + 검증 기준

### 3. `naming-conventions.md` — 네이밍 규칙 (~80줄)

8개 규칙 (변경 없음):
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
- 컴포넌트 안에서 컴포넌트 정의 금지
- 조건부 훅 호출 금지
- 배열 인덱스 key 금지
- props 7개 초과 / 250줄 초과 금지
- 불필요한 wrapper div 금지
- SRP, 합성 우선, Compound Component
- key로 상태 리셋
- 클로저 트랩
- Feature 기반 구조

각 규칙: WHY(React 내부 동작) + BAD → GOOD 코드

### 5. `state-and-data.md` — 상태관리 & 데이터 흐름 (~250줄)

16개 규칙 (NEVER 7개 + ALWAYS 9개):
- state 직접 변경 금지
- useEffect 파생 상태 금지
- 파생 가능한 값 state 저장 금지
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
- AbortController
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

\```tsx
// ❌ BAD
[잘못된 코드]

// ✅ GOOD
[올바른 코드]
\```
```

---

## SKILL.md 강제 검토 체크리스트 (핵심)

코드 작성 완료 후 반드시 아래 체크리스트를 실행:

### 아키텍처 (A)
- [ ] A-01: 의존성 방향이 단방향 (shared→feature, feature→feature 참조 없음)
- [ ] A-02: Feature 기반 폴더 구조 (기능별 자기 완결 디렉토리)
- [ ] A-03: 느슨한 결합 (컴포넌트 역할 한 문장 설명 가능, "그리고" 없이)
- [ ] A-04: 높은 응집도 (관련 코드가 같은 모듈에 위치)
- [ ] A-05: 레이어 분리 (비즈니스 로직이 컴포넌트 밖 순수 함수로 존재)
- [ ] A-06: 의존성 역전 (third-party SDK 직접 import 없음, 추상에 의존)
- [ ] A-07: 모듈 경계 (barrel file public API만 사용, 내부 경로 import 없음)
- [ ] A-08: 단방향 데이터 흐름 (props down, events up)
- [ ] A-09: Anti-Corruption Layer (third-party 라이브러리 래퍼로 격리)
- [ ] A-10: 코로케이션 (관련 파일 같은 디렉토리, 상태는 사용처 가까이)

### 네이밍 (N)
- [ ] N-01: 컴포넌트/파일 PascalCase
- [ ] N-02: props camelCase
- [ ] N-03: on*/handle* 이벤트 네이밍
- [ ] N-04: Boolean is*/has*/can*/should*
- [ ] N-05: 커스텀 훅 use + 동사
- [ ] N-06: 상수 UPPER_SNAKE_CASE
- [ ] N-07: 유틸 파일 camelCase
- [ ] N-08: 의미없는 이름 미사용

### 컴포넌트 (C)
- [ ] C-01: 컴포넌트 내부 컴포넌트 정의 없음
- [ ] C-02: 조건부 훅 호출 없음
- [ ] C-03: 배열 인덱스 key 미사용
- [ ] C-04: props 7개 이하
- [ ] C-05: 파일 250줄 이하
- [ ] C-06: 불필요한 wrapper div 없음
- [ ] C-07: SRP 준수
- [ ] C-08: 합성(children) 활용
- [ ] C-09: Compound Component (해당 시)
- [ ] C-10: 파일당 1 exported 컴포넌트
- [ ] C-11: 외부 라이브러리 래퍼 사용
- [ ] C-12: key로 상태 리셋 (해당 시)
- [ ] C-13: 클로저 트랩 확인
- [ ] C-14: Feature 기반 폴더 구조

### 상태 & 데이터 (S)
- [ ] S-01: state 직접 변경(mutate) 없음
- [ ] S-02: useEffect 내 파생 상태 계산 없음
- [ ] S-03: 파생 가능 값 state 미저장
- [ ] S-04: 수동 fetch 패턴 미사용 (TanStack Query/SWR)
- [ ] S-05: props→state 복사 패턴 없음
- [ ] S-06: functional setState 사용
- [ ] S-07: Context 분리 (단일 Context에 모든 상태 없음)
- [ ] S-08: 서버/클라이언트 상태 분리
- [ ] S-09: 상태 코로케이션
- [ ] S-10: lazy state 초기화
- [ ] S-11: 렌더에 안 쓰이는 값 ref 사용
- [ ] S-12: ref/state 동기화 타이밍 확인
- [ ] S-13: controlled vs uncontrolled 택일
- [ ] S-14: Context Provider useMemo
- [ ] S-15: localStorage 스키마 버전관리
- [ ] S-16: useEffect cleanup 구현

### 성능 (P)
- [ ] P-01: 프로파일링 기반 최적화
- [ ] P-02: 50+ 리스트 가상화
- [ ] P-03: 모듈 레벨 기본값 상수
- [ ] P-04: 삼항 연산자 조건부 렌더 (&&  미사용)
- [ ] P-05: inline style 객체 없음
- [ ] P-06: barrel file 미남용
- [ ] P-07: 요청 워터폴 제거
- [ ] P-08: 무거운 컴포넌트 dynamic import
- [ ] P-09: 서드파티 스크립트 defer
- [ ] P-10: 정적 JSX 모듈 레벨 추출
- [ ] P-11: startTransition 비긴급 업데이트
- [ ] P-12: 빈번 변경값 ref 저장
- [ ] P-13: AbortController 비동기 취소
- [ ] P-14: 객체 의존성 primitive 추출

### 테스트 & 타입 (T)
- [ ] T-01: 구현 세부사항 테스트 없음
- [ ] T-02: MSW 네트워크 모킹
- [ ] T-03: 소스 옆 테스트 배치
- [ ] T-04: any 타입 미사용 (unknown + guard)
- [ ] T-05: Suspense 올바른 사용
- [ ] T-06: ErrorBoundary 한계 인식
- [ ] T-07: 테스트 피라미드 준수
- [ ] T-08: 사용자 관점 쿼리 (getByRole 등)
- [ ] T-09: 버그 → 재현 테스트 먼저
- [ ] T-10: 3단계 에러 바운더리
- [ ] T-11: 시맨틱 HTML + ARIA
- [ ] T-12: strict TypeScript
- [ ] T-13: Props named exported interface
- [ ] T-14: discriminated union 타입

---

## 검토 결과 출력 포맷

```
## React Standards Review

### 적용된 규칙
- ✅ N-01, N-03, C-01, C-02, S-06, P-13 ...

### 해당 없음 (이번 코드에 적용 불가)
- ⬜ C-09 (Compound Component 해당 없음)
- ⬜ P-02 (리스트 50개 미만)

### 수정 사항 (검토 중 발견하여 수정)
- 🔧 S-02: useEffect 내 파생 상태 → useMemo로 변경
- 🔧 P-04: && 조건부 렌더 → 삼항 연산자로 변경

✅ 검토 완료
```

---

## 구현 순서

1. `SKILL.md` — 동작 프로토콜 + 강제 검토 체크리스트
2. `architecture.md` — 아키텍처 원칙
3. `naming-conventions.md`
4. `component-patterns.md`
5. `state-and-data.md`
6. `performance.md`
7. `testing-a11y.md`
8. 커밋 & 푸시
