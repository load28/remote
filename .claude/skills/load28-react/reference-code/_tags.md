# 하위 태그 정의서

> 레퍼런스 코드의 하위 태그(기술 패턴) 공식 목록.
> 새 태그 추가 시 이 파일에 등록 필수. 유사 태그 중복 생성 금지.

## React 코어

| 태그 | 설명 |
|------|------|
| component | React 컴포넌트 일반 |
| presentational | 표시 전용 컴포넌트 (상태 없음) |
| interactive | 사용자 인터랙션 포함 컴포넌트 |
| hook | React 훅 일반 |
| custom-hook | 커스텀 훅 |
| state | useState 상태 관리 |
| derived-state | 파생 상태 (useMemo 계산) |
| ref | useRef 활용 |
| context | React Context |
| provider | Context Provider 패턴 |
| reducer | useReducer 패턴 |
| useEffect | useEffect 훅 |
| cleanup | useEffect cleanup 함수 |
| useMemo | useMemo 메모이제이션 |
| useCallback | useCallback 안정 참조 |
| lazy-init | useState lazy 초기화 |
| startTransition | startTransition 비긴급 업데이트 |
| suspense | React Suspense |
| error-boundary | ErrorBoundary 컴포넌트 |
| key-reset | key prop으로 상태 리셋 |
| portal | React Portal |
| ref-prop | ref를 일반 prop으로 전달 (React 19+, forwardRef 금지 [C-15]) |

## 컴포넌트 패턴

| 태그 | 설명 |
|------|------|
| compound-component | Compound Component 합성 패턴 |
| render-props | Render Props 패턴 |
| children-composition | children을 통한 합성 |
| controlled | Controlled 컴포넌트 |
| uncontrolled | Uncontrolled 컴포넌트 |
| hoc | Higher-Order Component |
| discriminated-union | Discriminated Union 타입 props |

## 데이터 & API

| 태그 | 설명 |
|------|------|
| tanstack-query | TanStack Query (React Query) |
| mutation | 서버 데이터 변경 (useMutation) |
| invalidation | 쿼리 무효화 |
| abort | AbortController 요청 취소 |
| fetch | 데이터 fetching 일반 |
| api-layer | API 접근 레이어 |
| http-client | HTTP 클라이언트 래퍼 |
| acl | Anti-Corruption Layer |
| graphql | GraphQL 관련 |

## 폼

| 태그 | 설명 |
|------|------|
| form | 폼 관리 일반 |
| react-hook-form | React Hook Form 라이브러리 |
| validation | 폼 유효성 검증 |
| zod | Zod 스키마 검증 |

## 상태 관리 (외부 라이브러리)

| 태그 | 설명 |
|------|------|
| zustand | Zustand 전역 상태 관리 |
| jotai | Jotai 원자적(atomic) 상태 관리 |
| atom | Jotai 기본 atom (primitive/writable) |
| derived-atom | Jotai 파생 atom (의존 체인) |
| client-state | 클라이언트 전용 상태 (UI 토글, 선택 등) |
| nuqs | nuqs URL 쿼리파람 상태 관리 |

## 아키텍처

| 태그 | 설명 |
|------|------|
| business-logic | 비즈니스 로직 (순수 함수) |
| pure-function | 순수 함수 분리 |
| dependency-inversion | 의존성 역전 원칙 |
| module-structure | 모듈/폴더 구조 |
| barrel-file | barrel file (index.ts) 패턴 |
| feature-module | Feature 모듈 패턴 |
| layer-separation | 레이어 분리 |

## 성능

| 태그 | 설명 |
|------|------|
| virtual-list | 가상 스크롤 리스트 |
| dynamic-import | dynamic import / lazy() |
| code-splitting | 코드 스플리팅 |
| lazy-loading | 지연 로딩 |
| memoization | 메모이제이션 일반 |
| debounce | 디바운스 패턴 |
| throttle | 스로틀 패턴 |
| intersection-observer | IntersectionObserver |
| resize-observer | ResizeObserver |
| mutation-observer | MutationObserver |
| web-worker | Web Worker |
| raf | requestAnimationFrame |

## 테스트

| 태그 | 설명 |
|------|------|
| testing-library | React Testing Library |
| msw | MSW (Mock Service Worker) |
| hook-test | 커스텀 훅 테스트 |
| unit-test | 단위 테스트 |
| integration-test | 통합 테스트 |
| mock | 모킹 일반 |
| spy | 스파이/스텁 |

## TypeScript

| 태그 | 설명 |
|------|------|
| generic | 제네릭 타입 |
| type-guard | 타입 가드 |
| type-narrowing | 타입 내로잉 |
| utility-type | 유틸리티 타입 |
| interface | 인터페이스 정의 |

## UI 패턴

| 태그 | 설명 |
|------|------|
| modal | Modal/Dialog 오버레이 패턴 |
| emoji-picker | 이모지 선택 UI |
| custom-emoji | 커스텀 이모지 등록/관리 |
| checklist | 체크리스트/할일 UI |
| panel | 사이드 패널 UI |

## DOM & 브라우저

| 태그 | 설명 |
|------|------|
| event-listener | 이벤트 리스너 |
| scroll-position | 스크롤 위치 관리 |
| local-storage | localStorage |
| session-storage | sessionStorage |
| clipboard-api | Clipboard API |
| history-api | History API |
| url-params | URL 파라미터 |
| media-query | 미디어 쿼리 |
| web-socket | WebSocket |
| sse | Server-Sent Events |
| service-worker | Service Worker |

## HTML & 접근성

| 태그 | 설명 |
|------|------|
| semantic-html | 시맨틱 HTML 요소 |
| aria | ARIA 속성 |
| a11y | 접근성 일반 |
| keyboard-navigation | 키보드 네비게이션 |
| focus-management | 포커스 관리 |
| event-naming | on/handle 이벤트 네이밍 |
