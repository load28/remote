# Hook Schema

커스텀 훅을 작성할 때 반드시 채워야 하는 슬롯.
**빈 슬롯이 하나라도 있으면 코드를 생성하지 않는다.**

---

## 1. Identity

| 슬롯 | 값 | 제약 |
|------|-----|------|
| name | `use___` | `use` + 동사. 모호한 이름(useData, useInfo) 금지 [N-05, N-08] |
| file_path | `{layer}/{slice}/model/use___.ts` | FSD model 세그먼트 [A-02]. 예: `features/auth/model/useAuth.ts`, `entities/user/model/useUser.ts` |
| purpose | `___` | 한 문장으로 설명 |
| line_budget | `___/250` | [C-05] |

---

## 2. Category

하나를 선택 — 카테고리에 따라 필수 슬롯이 달라짐:

| 카테고리 | 설명 | 선택 |
|---------|------|------|
| `server-state` | API 데이터 fetch/mutation | `[ ]` → Section 3A 필수 |
| `client-state` | UI 로컬/글로벌 상태 관리 | `[ ]` → Section 3B 필수 |
| `behavior` | 이벤트/DOM/타이머 등 부수효과 | `[ ]` → Section 3C 필수 |
| `derived` | 기존 데이터 가공/계산 | `[ ]` → Section 3D 필수 |

---

## 3A. Server State 훅 (category = server-state)

| 슬롯 | 값 | 제약 |
|------|-----|------|
| library | `TanStack Query` / `SWR` | 수동 fetch 금지 [S-04] |
| query_key | `[___]` | |
| api_function | `___` | httpClient 래퍼 사용 [A-09] |
| abort_handling | `___` | AbortController 전략 [P-13] |

**mutation인 경우:**

| 슬롯 | 값 | 제약 |
|------|-----|------|
| onSuccess_location | `사용처` | 훅 내부 금지 [S-17] |
| onError_location | `사용처` | 훅 내부 금지 [S-17] |

---

## 3B. Client State 훅 (category = client-state)

| 슬롯 | 값 | 제약 |
|------|-----|------|
| state_tool | `useState` / `useReducer` / `zustand` / `jotai` / `nuqs` | [S-08, S-18] — URL 쿼리파람 상태는 nuqs 필수 |
| scope | `local` / `feature` / `global` | 최소 범위 원칙 [S-09] |

**jotai 사용 시:**

| 슬롯 | 값 | 제약 |
|------|-----|------|
| atom_file | `___` | atom 정의 파일 경로. atom.md 스키마로 별도 정의 필수 |
| consumer_pattern | `useAtomValue` / `useSetAtom` / `useAtom` | 최소 권한 원칙 |

**nuqs 사용 시:**

| 슬롯 | 값 | 제약 |
|------|-----|------|
| searchParams_file | `___` | searchParams 정의 파일 경로. 예: `features/___/searchParams.ts` |
| history_mode | `replace` / `push` | replace(기본): 빈번한 업데이트, push: 뒤로 가기 기대 시 |

**localStorage 사용 시:**

| 슬롯 | 값 | 제약 |
|------|-----|------|
| storage_key | `___` | |
| schema_version | `___` | 버전 관리 필수 [S-15] |
| lazy_init | `yes` | useState(() => ...) 강제 [S-10] |

---

## 3C. Behavior 훅 (category = behavior)

| 슬롯 | 값 | 제약 |
|------|-----|------|
| side_effect | `___` | 이벤트리스너/타이머/WebSocket/etc |
| cleanup | `___` | 필수. 비울 수 없음 [S-16] — **WHY:** 누락 시 메모리 누수/좀비 리스너 |
| deps | `[___]` | primitive만 [P-14] — **WHY:** 객체 deps는 매 렌더 새 참조 → 무한 실행 |

**빈번 변경값 사용 시:**

| 슬롯 | 값 | 제약 |
|------|-----|------|
| storage | `ref` | 초당 수십회 변경 → state 금지, ref 사용 [P-12, S-11] |

---

## 3D. Derived 훅 (category = derived)

| 슬롯 | 값 | 제약 |
|------|-----|------|
| input | `___` | 계산 원본 |
| computation | `useMemo` / `직접 계산` | useState 금지 [S-02, S-03] |
| deps | `[___]` | primitive만 [P-14] |

---

## 4. Design Guard — 코드 생성 전 필수 확인

슬롯 채우기 완료 후, 아래 항목을 확인한다. 해당 시 설계에 즉시 반영:

| # | 확인 | 해당 시 조치 | 해당없음 조건 |
|---|------|------------|-------------|
| DG-1 | 독립적인 API를 순차 호출하고 있는가? [P-07] | Promise.all로 병렬화 | 호출 간 의존성이 있어 순차 필수이거나, API 호출이 1개뿐 |
| DG-2 | 초당 수십회 이상 변하는 값(스크롤, 마우스 등)을 다루는가? [P-12] | state 대신 ref로 저장 | 값 변경 빈도가 렌더 주기 이하 |
| DG-3 | 검색/필터 등 빈번 호출되는 fetch가 있는가? [P-13] | AbortController로 이전 요청 취소 | fetch가 없거나 사용자 명시 동작(버튼 클릭)에서만 호출 |

---

## 5. FSD Dependencies [A-01]

| 슬롯 | 값 | 제약 |
|------|-----|------|
| fsd_layer | `app` / `pages` / `widgets` / `features` / `entities` / `shared` | 이 훅이 속한 FSD 레이어 [A-01] |
| imports_from | `[___]` | 하위 레이어만 허용. 예: features → entities, shared |
| forbidden_imports | `[___]` | 같은 레이어 슬라이스 / 상위 레이어 금지 |

---

## 6. Return Type

| 슬롯 | 값 | 제약 |
|------|-----|------|
| return_type | `___` | named exported interface/type [T-13] |
| any_usage | `없음` | any 금지 → unknown + type guard [T-04] |

---

## 7. Hook Rules 확인

| 제약 | 확인 |
|------|------|
| 조건부 호출 없음 [C-02] | `□` |
| 클로저 트랩 없음 [C-13] | `□` — useCallback deps에 사용하는 state 포함? |
| ref/state 동기화 타이밍 인지 [S-12] | `□` — setState 직후 해당 state 값을 읽지 않음 |
| 이전값 기반 setState → 함수형 [S-06] | `□` |
| props → state 복사 없음 [S-05] | `□` |
| state 직접 변경 없음 [S-01] | `□` |

---

## 슬롯 완료 체크

```
□ Identity 4개 슬롯 전부 채움
□ Category 1개 선택됨
□ 선택된 카테고리의 Section 3x 슬롯 전부 채움
□ Design Guard 3항목 전부 확인 (해당/해당없음 명시)
□ FSD Dependencies — fsd_layer 명시, imports_from 하위 레이어만
□ Return type 명시
□ Hook Rules 확인 전부 체크
```
