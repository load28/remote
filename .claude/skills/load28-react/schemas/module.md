# Module Schema (FSD v2.1)

피처 모듈(슬라이스) 전체를 설계할 때 사용하는 메타 스키마.
개별 파일은 해당 스키마(component, hook, type, barrel 등)로 각각 채운다.
**이 스키마는 FSD 레이어/슬라이스/세그먼트 수준의 구조적 결정을 먼저 확정한다.**

---

## 1. FSD Layer & Slice Identity

| 슬롯 | 값 | 제약 |
|------|-----|------|
| layer | `app` / `pages` / `widgets` / `features` / `entities` / `shared` | FSD 레이어 선택 [A-02] |
| slice_name | `___` | kebab-case. app/shared는 슬라이스 없음 [A-02] |
| root_path | `{layer}/{slice_name}/` | 예: `features/auth/`, `entities/user/` |
| responsibility | `___` | 단일 관심사 [A-04] |

**레이어 선택 가이드:**
```
Q1. 앱 전체 초기화/라우팅/프로바이더인가? → app
Q2. 페이지 단위 화면인가? → pages
Q3. 여러 features/entities를 조합한 자기 완결적 UI 블록인가? → widgets
Q4. 다른 페이지에서도 재사용하는 사용자 인터랙션인가? → features
Q5. 비즈니스 도메인 모델(데이터 + UI)인가? → entities
Q6. 프로젝트와 무관한 범용 코드인가? → shared
```

**FSD v2.1 "Pages First" 원칙:**
- 의심스러우면 pages에 먼저 배치
- 재사용 필요가 생겼을 때 하위 레이어로 이동
- widgets도 자체 model, api 세그먼트를 가질 수 있음

---

## 2. Segments (세그먼트 구성)

이 슬라이스에서 사용할 세그먼트와 각 세그먼트에 포함될 파일 목록:

| 세그먼트 | 파일 목록 | 스키마 |
|---------|----------|--------|
| `ui/` | `___` | `component` |
| `model/` | `___` | `hook` / `store` / `context` (비즈니스 로직, 순수 함수 포함) |
| `api/` | `___` | `api-layer` |
| `lib/` | `___` / `해당없음` | (슬라이스 내부 유틸) |
| `config/` | `___` / `해당없음` | (설정, 상수) |

**세그먼트 규칙:**
- `ui/`: React 컴포넌트만. 비즈니스 로직 금지
- `model/`: 스토어, 훅, 비즈니스 계산. React import 최소화 (훅 제외)
- `api/`: httpClient를 통한 서버 통신만. UI 로직 금지
- `lib/`: 슬라이스 내부 유틸. 외부 노출 금지
- app, shared 레이어는 세그먼트만 존재 (슬라이스 없음)

---

## 3. File Inventory

이 슬라이스에서 생성할 전체 파일 목록:

| file | segment | schema | 설명 |
|------|---------|--------|------|
| `___` | `ui` / `model` / `api` / `lib` / `config` | `component` / `hook` / `context` / `store` / `api-layer` / `test` / `type` / `barrel` | `___` |

---

## 4. Dependency Graph [A-01]

```
이 슬라이스의 FSD 레이어: ___
허용되는 import 대상 레이어: ___ (하위 레이어만)

의존성 방향 (DAG):
  ___ → ___
  ___ → ___

금지 방향:
  ___ ✗→ ___
```

| 제약 | 확인 |
|------|------|
| 상위 레이어 import 없음 (예: features → pages 금지) | `□` |
| 같은 레이어 슬라이스 간 직접 참조 없음 | `□` |
| @x 교차 import 필요 여부 확인 | `□ 불필요` / `□ 필요: ___` |
| 순환 의존 없음 | `□` |

**@x 교차 import (같은 레이어 슬라이스 간 참조가 불가피할 때):**
| source slice | consumer slice | 공개할 export | 파일 경로 |
|-------------|---------------|-------------|----------|
| `___` | `___` | `___` | `entities/___/@x/___.ts` |

---

## 5. Layer Separation [A-05]

| 레이어 | 세그먼트 | 파일 |
|--------|---------|------|
| Presentation | `ui/` | `___` (컴포넌트 TSX) |
| Business Logic | `model/` | `___` (순수 함수, 스토어, React import 최소) |
| Data Access | `api/` | `___` (API, httpClient) |

**검증:** model/ 세그먼트의 비즈니스 로직 파일에 React import가 있으면 → 분리 필요 (훅은 예외)

---

## 6. External Dependencies [A-09, C-11]

| 외부 라이브러리 | 래퍼 필요 여부 | 래퍼 위치 |
|----------------|--------------|-----------|
| `___` | `yes` / `no` | `shared/api/___` 또는 `shared/lib/___` |

- HTTP 클라이언트: `shared/api/httpClient.ts` 래퍼 필수 [A-09]
- UI 라이브러리: 2개+ 파일 사용 시 `shared/ui/` 래퍼 [C-11]

---

## 7. Public API (Barrel) [A-07]

| export | kind | segment |
|--------|------|---------|
| `___` | component / hook / type / store | `ui` / `model` / `api` |

- 내부 helper, lib/, config/ 세그먼트는 export하지 않음
- `export *` 금지 [P-06]
- barrel file은 슬라이스 루트의 `index.ts`에만 위치

---

## 8. Performance Considerations

| 슬롯 | 값 | 제약 |
|------|-----|------|
| profiling_basis | `___` / `해당없음` | useMemo/useCallback/React.memo 추가 시 프로파일링 근거 필수 [P-01] |

| 항목 | 해당 여부 | 대응 |
|------|-----------|------|
| 50+ 항목 리스트 [P-02] | `yes` / `no` | 가상화 필수 |
| 무거운 컴포넌트 [P-08] | `yes` / `no` | dynamic import + Suspense |
| 서드파티 스크립트 [P-09] | `yes` / `no` | defer/async 필수 |
| 정적 JSX [P-10] | `yes` / `no` | 모듈 레벨 추출 |
| 비긴급 업데이트 [P-11] | `yes` / `no` | startTransition |

---

## 9. Error Handling [T-10]

| 레벨 | 적용 여부 | 위치 |
|------|-----------|------|
| 앱 레벨 ErrorBoundary | 이미 존재 / 신규 | `app/providers/___` |
| 라우트 레벨 ErrorBoundary | `yes` / `no` | `pages/___/ui/___` |
| 위젯 레벨 ErrorBoundary | `yes` / `no` | `widgets/___/ui/___` |

**ErrorBoundary 한계 인식 [T-06]:** 이벤트 핸들러/비동기 에러는 ErrorBoundary가 잡지 못함 → try-catch 필요

---

## 10. Project Config

| 슬롯 | 값 | 제약 |
|------|-----|------|
| tsconfig_strict | `true` | 고정. strict: false 금지 [T-12] |
| path_aliases | `@/app`, `@/pages`, `@/widgets`, `@/features`, `@/entities`, `@/shared` | FSD 레이어별 경로 별칭 권장 |

---

## 진행 순서

```
1. 이 Module Schema 완성 (레이어/슬라이스/세그먼트 결정)
2. type.md 스키마 채우기 → 타입 코드 생성
3. api-layer.md 스키마 채우기 + Design Guard → API 코드 생성 (api/ 세그먼트)
4. hook.md / store.md 스키마 채우기 + Design Guard → 훅/스토어 코드 생성 (model/ 세그먼트)
5. component.md 스키마 채우기 + Design Guard → 컴포넌트 코드 생성 (ui/ 세그먼트)
6. barrel.md 스키마 채우기 → index.ts 생성 (슬라이스 루트)
7. test.md 스키마 채우기 + Design Guard → 테스트 코드 생성 (각 세그먼트 내 코로케이션)
```

각 단계에서 해당 스키마의 모든 슬롯을 채우고, **Design Guard를 확인**한 후에만 코드를 생성한다.
개별 스키마(component, hook, context, store, api-layer, test)에 각각 Design Guard가 내장되어 있다.
