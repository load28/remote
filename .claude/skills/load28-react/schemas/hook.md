# Hook Schema

커스텀 훅을 작성할 때 반드시 채워야 하는 슬롯.
**빈 슬롯이 하나라도 있으면 코드를 생성하지 않는다.**

---

## 1. Identity

| 슬롯 | 값 | 제약 |
|------|-----|------|
| name | `use___` | `use` + 동사. 모호한 이름(useData, useInfo) 금지 [N-05, N-08] |
| file_path | `features/___/hooks/use___.ts` | feature 기반 경로 [A-02] |
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
| state_tool | `useState` / `useReducer` / `zustand` | [S-08] |
| scope | `local` / `feature` / `global` | 최소 범위 원칙 [S-09] |

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
| cleanup | `___` | 필수. 비울 수 없음 [S-16] |
| deps | `[___]` | primitive만 [P-14] |

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

## 4. Return Type

| 슬롯 | 값 | 제약 |
|------|-----|------|
| return_type | `___` | named exported interface/type [T-13] |
| any_usage | `없음` | any 금지 → unknown + type guard [T-04] |

---

## 5. Hook Rules 확인

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
□ Return type 명시
□ Hook Rules 확인 전부 체크
```
