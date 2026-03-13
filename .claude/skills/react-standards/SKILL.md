---
name: react-standards
description: React/TypeScript 코드를 작성하거나 수정할 때 자동 적용. 코드 작성 후 강제 검토 단계를 통해 아키텍처, 컴포넌트, 상태관리, 성능, 네이밍, 테스트 전반의 코딩 표준 준수를 보장합니다. React, TSX, JSX 파일을 생성하거나 수정할 때 반드시 이 스킬을 참조하세요.
---

# React Coding Standards

> "기억에 의존하지 않는다. 검증을 강제한다."

## 동작 프로토콜

React/TSX/JSX 코드를 작성하거나 수정할 때 **반드시** 아래 3단계를 따른다.

```
Phase 1: 레퍼런스 참조 → Phase 2: 최종 검증 → Phase 3: 보고
```

### Phase 1: 레퍼런스 참조 (코드 작성 전)

> **핵심:** 먼저 구현 계획을 세우고, 태그로 레퍼런스를 검색하여 패턴을 참조한다.
> 레퍼런스 없이 코드를 작성하지 않는다.

#### Step 1: 구현 계획 수립

작성할 코드의 목록을 먼저 계획하고, 각 코드에 필요한 기술 패턴(하위 태그)을 식별한다.

#### Step 2: 태그 기반 레퍼런스 검색

[reference-code/](reference-code/) 디렉토리에서 태그로 검색한다.

1. **상위 태그(목적)로 디렉토리 검색**: `Glob("reference-code/{목적}/*")`
2. **하위 태그(패턴)로 파일 검색**: frontmatter `tags` 필드에서 정확 매칭
   - 부분 문자열 매칭 주의 (예: `hook` 검색 시 `custom-hook`, `hook-test` 제외)
   - 패턴 예시: `Grep("([\[, ])hook([\], ])")` 또는 frontmatter 읽은 후 정확 비교
3. **매칭된 파일만 읽는다**

복수 매칭 시:
- 여러 파일이 매칭되면 가장 구체적인 태그로 좁힌다
- 하나의 파일이 모든 필요 태그를 커버하지 못하면 여러 파일을 읽고 패턴을 조합한다
- 3개 이상 파일을 읽어야 하면 태그 식별이 너무 넓은지 재검토한다

#### Step 3: 레퍼런스 존재 여부 판단

- **매칭됨** → 레퍼런스 기반으로 코드 작성 (Step 4로)
- **매칭 안 됨** → 레퍼런스 추가 프로세스 (Phase 1-A) 실행

#### Step 3-1: 상세 규칙 확인 (필요 시)

레퍼런스 코드의 주석에 표시된 규칙 ID(예: S-06, P-13)의 상세 근거가 필요하면 해당 규칙 파일을 참조한다.

| 파일 | 내용 | 규칙 수 |
|------|------|---------|
| [architecture.md](architecture.md) | 의존성 방향, 레이어 분리, 결합도, 모듈 경계 | 10 |
| [naming-conventions.md](naming-conventions.md) | PascalCase, camelCase, on/handle, Boolean 접두사 | 8 |
| [component-patterns.md](component-patterns.md) | SRP, 합성, 훅 규칙, key 활용, 클로저 트랩, 제거 예정 API 금지 | 15 |
| [state-and-data.md](state-and-data.md) | 함수형 setState, 파생 상태, Context, 비동기 | 16 |
| [performance.md](performance.md) | 가상화, dynamic import, 워터폴, 의존성 배열 | 14 |
| [testing-a11y.md](testing-a11y.md) | Testing Library, MSW, strict TS, 에러 바운더리, optional 남용 금지 | 15 |

#### Step 4: 레퍼런스 기반 코드 작성

레퍼런스의 구조와 패턴을 따라 코드를 작성한다. 도메인 용어만 프로젝트에 맞게 교체한다.

### Phase 1-A: 레퍼런스 추가 프로세스

매칭되는 레퍼런스가 없을 때 실행한다. **레퍼런스 없이 코드를 작성하지 않는다.**

#### Step 1: 레퍼런스 코드 작성

도메인 비종속 일반화된 패턴으로 작성한다. 기존 레퍼런스의 스타일(주석에 규칙 ID 표시 등)을 따른다.

#### Step 2: 규칙 검증 (강제)

78개 규칙(A/N/C/S/P/T) 중 해당 규칙을 전수 검증한다. 위반 발견 시 즉시 수정 후 재검증. 검증 통과한 코드만 등록 가능.

#### Step 3: 태그 선택 및 생성

- [reference-code/_tags.md](reference-code/_tags.md)에서 하위 태그 선택
- 기존 태그로 표현 불가 시 → 동의어/유사 태그 없음을 확인 후 새 하위 태그 생성하고 `_tags.md`에 등록
- 상위 태그(디렉토리) 필요 시 생성

#### Step 4: 메타데이터 작성 및 등록

- frontmatter 작성: `tags`, `rules`(검증 통과 증명), `description`
- 파일명에 핵심 하위 태그 2~4개를 `--` 구분자로 표시
- 상위 태그 디렉토리에 배치 (없으면 루트)
- 동일 디렉토리에 파일명 충돌 시 구분 태그 추가 또는 상위 태그 디렉토리 배치

등록 완료 후 Step 4(레퍼런스 기반 코드 작성)로 진행한다.

### Phase 2: 최종 검증 (코드 작성 완료 후)

**작성한 코드의 모든 변경 사항**을 아래 체크리스트로 검증한다.
각 항목을 하나씩 확인하고, 위반 발견 시 **즉시 수정**한 뒤 다음 항목으로 넘어간다.
해당 코드에 적용되지 않는 항목은 "해당 없음"으로 건너뛴다.

#### 아키텍처 (A)
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

#### 네이밍 (N)
- [ ] N-01: 컴포넌트/파일 PascalCase
- [ ] N-02: props camelCase
- [ ] N-03: on*/handle* 이벤트 네이밍
- [ ] N-04: Boolean is*/has*/can*/should*
- [ ] N-05: 커스텀 훅 use + 동사
- [ ] N-06: 상수 UPPER_SNAKE_CASE
- [ ] N-07: 유틸 파일 camelCase
- [ ] N-08: 의미없는 이름(data, info, temp, item) 미사용

#### 컴포넌트 (C)
- [ ] C-01: 컴포넌트 내부 컴포넌트 정의 없음
- [ ] C-02: 조건부 훅 호출 없음
- [ ] C-03: 배열 인덱스 key 미사용 (동적 리스트)
- [ ] C-04: props 7개 이하
- [ ] C-05: 파일 250줄 이하
- [ ] C-06: 불필요한 wrapper div 없음 (Fragment 사용)
- [ ] C-07: 단일 책임 원칙 준수
- [ ] C-08: 합성(children, render props) 활용
- [ ] C-09: Compound Component 패턴 (해당 시)
- [ ] C-10: 파일당 1 exported 컴포넌트
- [ ] C-11: 외부 라이브러리 래퍼 사용
- [ ] C-12: key로 컴포넌트 상태 리셋 (해당 시)
- [ ] C-13: 클로저 트랩 확인 (오래된 state 캡처 없음)
- [ ] C-14: Feature 기반 폴더 구조
- [ ] C-15: React 19 제거 예정/제거된 기능·타입 미사용 (forwardRef, defaultProps, propTypes, string ref, findDOMNode, UNSAFE_ lifecycle, 레거시 Context, React.SFC/VFC)

#### 상태 & 데이터 (S)
- [ ] S-01: state 직접 변경(mutate) 없음
- [ ] S-02: useEffect 내 파생 상태 계산 없음
- [ ] S-03: 파생 가능한 값 state 미저장
- [ ] S-04: 수동 fetch 패턴 미사용 (TanStack Query/SWR 사용)
- [ ] S-05: props→state 복사 패턴 없음
- [ ] S-06: 함수형 setState (prev => prev + 1) 사용
- [ ] S-07: Context 분리 (단일 Context에 모든 상태 없음)
- [ ] S-08: 서버 상태 / 클라이언트 상태 분리
- [ ] S-09: 상태 코로케이션 (사용처 가까이 배치)
- [ ] S-10: lazy state 초기화 useState(() => compute())
- [ ] S-11: 렌더에 안 쓰이는 값 ref 사용 (타이머 ID 등)
- [ ] S-12: ref/state 동기화 타이밍 확인
- [ ] S-13: controlled vs uncontrolled 택일 (혼합 금지)
- [ ] S-14: Context Provider value useMemo 적용
- [ ] S-15: localStorage 스키마 버전 관리 (해당 시)
- [ ] S-16: useEffect cleanup 구현 (구독, 타이머, fetch)

#### 성능 (P)
- [ ] P-01: 프로파일링 기반 최적화 (추측 금지)
- [ ] P-02: 50+ 리스트 가상화 적용
- [ ] P-03: 모듈 레벨 기본값 상수 (inline 기본값 금지)
- [ ] P-04: 삼항 연산자 조건부 렌더 (&& 미사용)
- [ ] P-05: inline style 객체 없음
- [ ] P-06: barrel file(export *) 미남용
- [ ] P-07: 요청 워터폴 제거 (Promise.all, 병렬 fetch)
- [ ] P-08: 무거운 컴포넌트 dynamic import (모달, 차트, 에디터)
- [ ] P-09: 서드파티 스크립트 defer
- [ ] P-10: 정적 JSX 모듈 레벨 추출
- [ ] P-11: startTransition 비긴급 업데이트 분리
- [ ] P-12: 빈번 변경값(스크롤, 마우스좌표) ref 저장
- [ ] P-13: AbortController 비동기 취소
- [ ] P-14: 객체/배열 의존성 primitive 추출 또는 useMemo

#### 테스트 & 타입 (T)
- [ ] T-01: 구현 세부사항 테스트 없음 (내부 state, className 등)
- [ ] T-02: MSW 네트워크 레벨 모킹 (fetch/axios 직접 모킹 금지)
- [ ] T-03: 소스 옆 테스트 배치 (__tests__/ 금지)
- [ ] T-04: any 타입 미사용 (unknown + type guard)
- [ ] T-05: Suspense 올바른 사용 (일반 fetch에 동작 안 함)
- [ ] T-06: ErrorBoundary 한계 인식 (이벤트 핸들러 에러 못 잡음)
- [ ] T-07: 테스트 피라미드 준수 (unit > integration > E2E)
- [ ] T-08: 사용자 관점 쿼리 (getByRole, getByText, getByLabelText)
- [ ] T-09: 버그 발견 → 재현 테스트 먼저, 그 다음 수정
- [ ] T-10: 3단계 에러 바운더리 (앱/라우트/위젯)
- [ ] T-11: 시맨틱 HTML + ARIA + 키보드 네비게이션
- [ ] T-12: tsconfig strict: true 필수
- [ ] T-13: Props는 named exported interface
- [ ] T-14: discriminated union으로 variant 타입 모델링
- [ ] T-15: optional 프로퍼티 남용 금지 (조건부 프로퍼티는 타입 분리 후 union)

### Phase 3: 보고 (검토 완료 후)

검토 결과를 사용자에게 다음 포맷으로 출력한다:

```
## React Standards Review

### 적용된 규칙
- ✅ A-01, A-08, N-01, N-03, C-01, C-02, S-06, P-13 ...

### 해당 없음
- ⬜ C-09 (Compound Component 해당 없음)
- ⬜ P-02 (리스트 50개 미만)

### 수정 사항 (검토 중 발견하여 수정)
- 🔧 S-02: useEffect 내 파생 상태 → useMemo로 변경
- 🔧 P-04: && 조건부 렌더 → 삼항 연산자로 변경

✅ 전체 검토 완료 — 78개 규칙 중 XX개 적용, XX개 해당없음, XX개 수정
```

**Phase 3 보고 없이 코드 제출을 완료하지 않는다.**
