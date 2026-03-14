# Module Schema

피처 모듈 전체를 설계할 때 사용하는 메타 스키마.
개별 파일은 해당 스키마(component, hook, type, barrel 등)로 각각 채운다.
**이 스키마는 모듈 수준의 구조적 결정을 먼저 확정한다.**

---

## 1. Module Identity

| 슬롯 | 값 | 제약 |
|------|-----|------|
| feature_name | `___` | kebab-case [A-02] |
| root_path | `features/___/` | [A-02] |
| responsibility | `___` | 단일 관심사 [A-04] |

---

## 2. File Inventory

이 모듈에서 생성할 파일 목록. 각 파일은 해당 스키마를 채워야 함:

| file | schema | 설명 |
|------|--------|------|
| `___` | `component` / `hook` / `context` / `store` / `api-layer` / `test` / `type` / `barrel` | `___` |

---

## 3. Dependency Graph [A-01]

```
이 모듈의 의존성 방향 (DAG):
  ___ → ___
  ___ → ___

금지 방향:
  ___ ✗→ ___
```

| 제약 | 확인 |
|------|------|
| features → features 직접 참조 없음 | `□` |
| shared → features 역방향 없음 | `□` |
| 순환 의존 없음 | `□` |

---

## 4. Layer Separation [A-05]

| 레이어 | 파일 |
|--------|------|
| Presentation | `___` (컴포넌트 TSX) |
| Business Logic | `___` (순수 함수, React import 없음) |
| Data Access | `___` (API, httpClient) |

**검증:** 비즈니스 로직 파일에 React import가 있으면 → 분리 필요

---

## 5. External Dependencies [A-09, C-11]

| 외부 라이브러리 | 래퍼 필요 여부 | 래퍼 위치 |
|----------------|--------------|-----------|
| `___` | `yes` / `no` | `___` |

- HTTP 클라이언트: httpClient 래퍼 필수 [A-09]
- UI 라이브러리: 2개+ 파일 사용 시 래퍼 [C-11]

---

## 6. Public API (Barrel) [A-07]

| export | kind |
|--------|------|
| `___` | component / hook / type |

- 내부 helper, reducer, util은 export하지 않음
- `export *` 금지 [P-06]

---

## 7. Performance Considerations

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

## 8. Error Handling [T-10]

| 레벨 | 적용 여부 | 위치 |
|------|-----------|------|
| 앱 레벨 ErrorBoundary | 이미 존재 / 신규 | `___` |
| 라우트 레벨 ErrorBoundary | `yes` / `no` | `___` |
| 위젯 레벨 ErrorBoundary | `yes` / `no` | `___` |

**ErrorBoundary 한계 인식 [T-06]:** 이벤트 핸들러/비동기 에러는 ErrorBoundary가 잡지 못함 → try-catch 필요

---

## 9. Project Config

| 슬롯 | 값 | 제약 |
|------|-----|------|
| tsconfig_strict | `true` | 고정. strict: false 금지 [T-12] |

---

## 진행 순서

```
1. 이 Module Schema 완성
2. type.md 스키마 채우기 → 타입 코드 생성
3. api-layer.md 스키마 채우기 → API 코드 생성
4. hook.md 스키마 채우기 → 훅 코드 생성
5. component.md 스키마 채우기 → 컴포넌트 코드 생성
6. barrel.md 스키마 채우기 → index.ts 생성
7. test.md 스키마 채우기 → 테스트 코드 생성
```

각 단계에서 해당 스키마의 모든 슬롯을 채운 후에만 코드를 생성한다.
