# Grammar Rules — 코드의 모든 줄에 자동 적용

스키마 슬롯과 독립적으로, **생성된 모든 코드에 기계적으로 적용**되는 규칙.
슬롯을 채우는 "설계" 단계가 아니라, 코드를 쓰는 "변환" 단계에서 작동한다.

문법은 선택하는 것이 아니다. 한국어를 쓸 때 조사를 "선택"하지 않듯,
이 문법은 코드의 모든 줄에 무조건 적용된다.

---

## 코드 변환 후 Grammar Scan

코드를 생성한 직후, 아래 항목을 위에서 아래로 기계적으로 스캔한다.
하나라도 위반이 있으면 코드를 수정한 후에만 제출한다.

### Naming

| # | 규칙 | 스캔 대상 | 위반 조건 |
|---|------|----------|----------|
| N-01 | 컴포넌트/파일 PascalCase | 모든 `function` 컴포넌트, 파일명 | 소문자 시작 |
| N-02 | props camelCase | 모든 interface/type의 props | snake_case 발견 |
| N-03 | on*/handle* | 모든 이벤트 함수 | props에 handle*, 내부에 on* 접두사 |
| N-04 | Boolean is/has/can/should | 커스텀 boolean props/state | 접두사 없음 (HTML 네이티브 제외) |
| N-06 | 상수 UPPER_SNAKE_CASE | 모든 모듈 레벨 const | camelCase 상수 |
| N-08 | 의미없는 이름 금지 | 모든 변수/함수명 | data, info, temp, item, value, result |

### State

| # | 규칙 | 스캔 대상 | 위반 조건 |
|---|------|----------|----------|
| S-01 | state 직접 변경 금지 | 모든 state 변수 | .push(), .splice(), 직접 할당 |
| S-02 | useEffect 파생 상태 금지 | 모든 useEffect | useEffect 내 setState로 계산값 저장 |
| S-03 | 파생 가능 state 금지 | 모든 useState | 다른 state에서 계산 가능한 값 |
| S-05 | props→state 복사 금지 | 모든 useState 초기값 | props를 useState 초기값으로 사용 + useEffect 동기화 |
| S-06 | 함수형 setState | 이전값 기반 setState | setState(count + 1) → setState(prev => prev + 1) |
| S-16 | useEffect cleanup | 모든 useEffect | cleanup 함수 반환 없음 |
| S-17 | mutation onSuccess 내장 금지 | 모든 useMutation | 훅 정의에 onSuccess/onError 포함 |

### Performance

| # | 규칙 | 스캔 대상 | 위반 조건 |
|---|------|----------|----------|
| P-03 | 기본값 모듈 레벨 상수 | 함수 파라미터 기본값 | `= []`, `= {}` 인라인 기본값 |
| P-04 | 삼항 조건부 렌더 | JSX 조건부 렌더링 | `&&` 사용 (특히 number/string 조건) |
| P-04 | 중첩 삼항 금지 | 모든 삼항 표현식 | 삼항 내 삼항 |
| P-05 | inline style 금지 | JSX style prop | `style={{ ... }}` 인라인 객체 |
| P-06 | export * 금지 | 모든 barrel file | `export * from` |
| P-14 | deps primitive 추출 | useEffect/useMemo deps | 객체/배열이 deps에 직접 포함 |

### Component

| # | 규칙 | 스캔 대상 | 위반 조건 |
|---|------|----------|----------|
| C-01 | 내부 컴포넌트 금지 | 렌더 함수 내부 | 함수 안에 컴포넌트 정의 |
| C-02 | 조건부 훅 금지 | if/for/early return 이후 | 조건문 뒤 Hook 호출 |
| C-03 | index key 금지 | .map() 렌더링 | `key={index}` |
| C-06 | wrapper div 금지 | JSX return | 스타일/시맨틱 없는 래퍼 div |
| C-13 | 클로저 트랩 | useCallback | 빈 deps에서 state 참조 |
| C-15 | React 19 제거 API | 모든 코드 | forwardRef, defaultProps, propTypes, string ref, findDOMNode |

### Type Safety

| # | 규칙 | 스캔 대상 | 위반 조건 |
|---|------|----------|----------|
| T-04 | any 금지 | 모든 타입 선언 | `: any` 발견 |
| T-13 | Props named export | 모든 컴포넌트 props | 인라인 타입 사용 |

### Accessibility

| # | 규칙 | 스캔 대상 | 위반 조건 |
|---|------|----------|----------|
| T-11 | 시맨틱 HTML | 모든 JSX | `<div onClick>`, 비시맨틱 레이아웃 |

---

## Scan 실행 방식

```
코드 생성 완료
  ↓
Grammar Scan 시작
  ↓
위 테이블 순서대로 하나씩 스캔
  ↓
위반 발견 → 즉시 수정
  ↓
전체 스캔 완료 → 코드 제출 가능
```

**이 스캔은 생략할 수 없다. 모든 코드 블록 생성 후 실행한다.**
