# Design Constraints — Quick Reference

> 코드 설계/계획 전 반드시 읽는 정량적·구조적 제약 요약.
> 상세 설명은 각 규칙 파일 참조.

## 정량적 제약 (Hard Limits)

| 규칙 | 제약 | 위반 시 |
|------|------|---------|
| **C-04** | props **7개 이하** | 객체 그룹화 또는 컴포넌트 분리 |
| **C-05** | 파일 **250줄 이하** | 커스텀 훅 추출, 하위 컴포넌트 분리 |
| **C-10** | 파일당 **1 exported 컴포넌트** | Compound Component 예외 |
| **P-02** | 스크롤 리스트 **50개 이상** → 가상화 | react-virtual 적용 |

## 구조적 제약 (Architecture)

| 규칙 | 제약 |
|------|------|
| **A-01** | `app → features → shared` 단방향만 허용. features ↔ features 금지 |
| **A-02** | Feature 기반 폴더: `features/<name>/{components,hooks,api,domain}/` |
| **A-05** | 3레이어 분리: Presentation / Business Logic / Data Access |
| **A-07** | barrel file(index.ts)로만 외부 노출. 내부 경로 직접 import 금지 |
| **A-09** | 외부 라이브러리 2개+ 파일에서 사용 시 래퍼 필수 |

## 타입 제약 (TypeScript)

| 규칙 | 제약 |
|------|------|
| **T-04** | `any` 금지 → `unknown` + type guard |
| **T-13** | Props는 named exported interface |
| **T-14** | variant/상태별 다른 props → discriminated union |
| **T-15** | optional 남용 금지. 조건부 프로퍼티는 타입 분리 |

## 컴포넌트 제약

| 규칙 | 제약 |
|------|------|
| **C-01** | 컴포넌트 내부 컴포넌트 정의 금지 |
| **C-02** | 조건부 훅 호출 금지 (Hook은 최상위에서만) |
| **C-03** | 동적 리스트에서 배열 인덱스 key 금지 |
| **C-06** | 불필요한 wrapper div 금지 → Fragment |
| **C-15** | React 19+: forwardRef, defaultProps, propTypes 금지 |

## 상태 제약

| 규칙 | 제약 |
|------|------|
| **S-01** | state 직접 변경(mutate) 금지 |
| **S-02** | useEffect 내 파생 상태 계산 금지 → useMemo |
| **S-03** | 파생 가능한 값 state 저장 금지 |
| **S-04** | 수동 fetch 금지 → TanStack Query |
| **S-05** | props→state 복사 금지 |
| **S-06** | 이전 값 기반 → 함수형 setState |
| **S-16** | useEffect cleanup 필수 |
| **S-17** | mutation 훅에 onSuccess/onError 내장 금지 |

## 성능 제약

| 규칙 | 제약 |
|------|------|
| **P-03** | 기본값은 모듈 레벨 상수 (inline 기본값 금지) |
| **P-04** | 조건부 렌더 → 삼항 연산자. 중첩 삼항 금지 |
| **P-05** | inline style 객체 금지 |
| **P-06** | `export *` 금지 → named export |
| **P-14** | 객체/배열 의존성 → primitive 추출 |

## 네이밍 제약

| 규칙 | 제약 |
|------|------|
| **N-01** | 컴포넌트/파일 PascalCase |
| **N-02** | props camelCase |
| **N-03** | props → `on*`, 내부 → `handle*` |
| **N-04** | Boolean → `is*/has*/can*/should*` |
| **N-05** | 커스텀 훅 → `use` + 동사 |
| **N-06** | 상수 → UPPER_SNAKE_CASE |

## 설계 시 체크리스트

코드를 계획할 때 다음을 자문한다:

1. **파일 크기**: 이 컴포넌트가 250줄을 넘을까? → 훅/하위 컴포넌트 분리 계획
2. **Props 수**: Props가 7개를 넘을까? → 객체 그룹화 설계
3. **의존성 방향**: feature 간 import가 있는가? → app 레벨 조합으로 해결
4. **상태 종류**: 서버 상태 vs 클라이언트 상태 구분했는가?
5. **비즈니스 로직**: 순수 함수로 추출 가능한 로직이 있는가?
6. **타입 안전성**: optional 대신 discriminated union이 필요한가?
