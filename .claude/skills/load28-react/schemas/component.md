# Component Schema

컴포넌트 TSX 파일을 작성할 때 반드시 채워야 하는 슬롯.
**빈 슬롯이 하나라도 있으면 코드를 생성하지 않는다.**

---

## 1. Identity

| 슬롯 | 값 | 제약 |
|------|-----|------|
| name | `___` | PascalCase만 허용 [N-01] |
| file_path | `{layer}/{slice}/ui/___.tsx` | FSD 세그먼트 경로 [A-02, C-14]. 예: `features/auth/ui/LoginForm.tsx`, `entities/user/ui/UserCard.tsx`, `shared/ui/Button.tsx` |
| responsibility | `___` | 한 문장. "그리고(and)" 포함 시 분리 필요 [C-07] |
| line_budget | `___/250` | 250 초과 불가. 초과 예상 시 설계 단계에서 분리 [C-05] |
| exports | `1` | 고정값. 변경 불가 [C-10] |

---

## 2. Props Interface

**interface_name:** `___Props` — 반드시 named export [T-13]

**type_strategy** — 하나를 선택 [T-14, T-15] — **WHY:** optional 남용 시 잘못된 props 조합이 타입 허용됨:

| 전략 | 조건 | 선택 |
|------|------|------|
| `flat` | props ≤ 4개, 변형(variant) 없음 | `[ ]` |
| `grouped` | props 5~7개, 관련 props를 객체로 그룹화 | `[ ]` |
| `discriminated-union` | 모드/상태에 따라 다른 props 조합 | `[ ]` |

**props 슬롯** — 최대 7칸. 8번째는 존재하지 않음 [C-04]:

| # | name | type | 비고 |
|---|------|------|------|
| 1 | `___` | `___` | |
| 2 | `___` | `___` | |
| 3 | `___` | `___` | |
| 4 | `___` | `___` | |
| 5 | `___` | `___` | |
| 6 | `___` | `___` | |
| 7 | `___` | `___` | |

- 사용하지 않는 슬롯은 `—`로 표시
- boolean prop은 `is/has/can/should` 접두사 필수 [N-04]
- 8개 이상 필요하면 grouped 전략으로 전환하거나 컴포넌트 분리

---

## 3. Events

모든 이벤트를 기입. 빈칸 불허 [N-03]:

| prop (on___) | handler (handle___) | 설명 |
|---|---|---|
| `on___` | `handle___` | `___` |

- props 이벤트는 반드시 `on` 접두사
- 내부 핸들러는 반드시 `handle` 접두사
- 이벤트가 없으면 "없음"으로 명시

---

## 4. State

각 상태 변수를 기입 [S-08, S-09] — **WHY:** 불필요한 전역화는 앱 전체 리렌더를 유발 [S-09]:

| name | type | source | 코로케이션 근거 [S-09] |
|------|------|--------|----------------------|
| `___` | `___` | `local` / `context` / `zustand` / `server-query` / `url-query` | 왜 여기에? |

- boolean state는 `is/has/can/should` 접두사 필수 [N-04]
- `server-query` 선택 시 → TanStack Query 사용 강제 [S-04]
- state가 없으면 "없음"으로 명시

**파생값** — useState 금지, 렌더 중 계산 또는 useMemo [S-02, S-03]:

| name | 계산 원본 | 방식 |
|------|-----------|------|
| `___` | `___` | `직접 계산` / `useMemo` |

- 파생 가능한 값을 state로 선언하면 슬롯 자체가 잘못된 것

---

## 5. Refs

ref 사용 계획을 기입 [S-11, S-12, P-12]:

| name | type | purpose | ref 선택 근거 |
|------|------|---------|--------------|
| `___` | `___` | `___` | state 아닌 이유: ___ |

- 렌더에 사용되는 값은 state, 렌더에 불필요한 값은 ref [S-11]
- DOM 접근용 ref도 여기에 기입 (예: `dialogRef`, `inputRef`)
- 빈번 변경값(스크롤 위치, 타이머 ID 등)은 ref [P-12]
- ref가 없으면 "없음"으로 명시

**ref 전달 (React 19):**

| 슬롯 | 값 | 제약 |
|------|-----|------|
| ref_forwarding | `yes` / `no` | forwardRef 금지 [C-15] — ref는 일반 prop으로 전달 |
| ref_type | `HTMLDivElement` 등 | ref 사용 시 구체적 요소 타입 명시 |

---

## 6. Effects

각 useEffect를 기입. cleanup은 필수 슬롯 [S-16]:

| purpose | cleanup (필수) | deps [P-14] |
|---------|---------------|-------------|
| `___` | `___` | `[primitive만]` |

- cleanup 칸이 비어있으면 코드 생성 불가 — **WHY:** cleanup 누락 시 메모리 누수, 좀비 리스너, 레이스 컨디션 발생 [S-16]
- deps에 객체/배열 직접 사용 금지 → primitive 추출 — **WHY:** 객체 deps는 매 렌더마다 새 참조 → 무한 실행 [P-14]
- effect가 없으면 "없음"으로 명시
- **S-16 예외:** 구독/리스너/타이머/Observer를 시작하지 않는 동기적 일회성 작업(localStorage.setItem, document.title 등)은 cleanup에 `// S-16 예외: [사유]` 주석 기입

---

## 7. Conditional Rendering

모든 조건부 렌더링 [P-04]:

| condition | expression |
|-----------|------------|
| `___` | `___ ? <A /> : null` |

- `&&` 연산자 사용 불가. 삼항만 허용
- 중첩 삼항 금지 → 함수 추출
- 조건부 렌더가 없으면 "없음"으로 명시

---

## 8. Data Flow & Patterns

| 슬롯 | 값 | 제약 |
|------|-----|------|
| data_flow | `props down, events up` | 고정. 자식→부모 직접 변경 금지 [A-08] |
| controlled_strategy | `controlled` / `uncontrolled` / `해당없음` | 하나만 선택. 혼합 금지 [S-13] — 해당없음 조건: 이 컴포넌트에 폼 입력이나 사용자 편집 가능한 값이 없을 때만 |
| context_reset | `key` / `해당없음` | 컨텍스트 전환 시 key로 리셋 [C-12] — useEffect 수동 리셋 금지. 해당없음 조건: 동일 위치에서 다른 엔터티를 렌더하는 경우가 없을 때만 |
| suspense_usage | `lazy` / `use()` / `TanStack suspense` / `해당없음` | Suspense 사용 시 호환 API만 [T-05] — 해당없음 조건: 비동기 로딩이나 코드 스플리팅이 필요 없을 때만 |

---

## 9. Dependencies

| 슬롯 | 값 |
|------|-----|
| fsd_layer | `app` / `pages` / `widgets` / `features` / `entities` / `shared` | 이 컴포넌트가 속한 FSD 레이어 [A-01] |
| imports_from | `[___]` — 하위 레이어만 허용 [A-01]. 예: features → entities, shared |
| forbidden_imports | `[___]` — 같은 레이어 슬라이스 / 상위 레이어 금지 |
| import_style | barrel import만 [A-07] — 세그먼트 내부 경로 직접 import 금지. @x 예외 |

---

## 10. Design Guard — 코드 생성 전 필수 확인

슬롯 채우기 완료 후, 아래 항목을 확인한다. 해당 시 설계에 즉시 반영:

| # | 확인 | 해당 시 조치 | 해당없음 조건 |
|---|------|------------|-------------|
| DG-1 | 외부 UI 라이브러리를 직접 사용하는가? [C-11] | 2개+ 파일 사용 시 래퍼 컴포넌트로 격리 | 프로젝트 내 해당 라이브러리를 이 파일에서만 사용 |
| DG-2 | 스크롤 필요한 50개+ 항목 리스트를 렌더하는가? [P-02] | 가상화 필수 (@tanstack/react-virtual 등) | 리스트가 없거나 항목 수가 고정적으로 적음 |
| DG-3 | 무거운 자식 컴포넌트(차트, 에디터, PDF 등)가 있는가? [P-08] | React.lazy + Suspense로 dynamic import | 모든 자식이 가벼운 표준 컴포넌트 |
| DG-4 | 렌더 함수 안에 변하지 않는 정적 JSX가 있는가? [P-10] | 모듈 레벨 상수로 추출 | 모든 JSX가 props/state에 의존 |
| DG-5 | 비긴급 업데이트가 입력 반응성을 저하시키는가? [P-11] | startTransition으로 분리 | 사용자 입력과 무거운 렌더가 동시에 없음 |

---

## 11. Composition

컴포넌트가 props으로 모든 변형을 제어하는가? [C-08]:

| 슬롯 | 값 |
|------|-----|
| slot_props_count | `___` — renderXxx/xxxContent/xxxIcon 류 props 수 |
| composition_needed | `yes` / `no` — 3개 이상이면 Compound Component 검토 [C-09] |
| children_usage | `none` / `children` / `render-props` |

---

## 슬롯 완료 체크

아래가 모두 채워져야 코드 생성으로 진행:

```
□ Identity 5개 슬롯 전부 채움
□ Props interface + type_strategy 선택됨
□ Props 슬롯 7칸 중 사용분 채움 (미사용은 — 표시)
□ Events 테이블 작성 (없으면 "없음")
□ State 테이블 작성 (없으면 "없음")
□ 파생값 테이블 작성 (없으면 "없음")
□ Refs 테이블 작성 + ref 전달 판단 (없으면 "없음")
□ Effects 테이블 작성, cleanup 전부 채움 (없으면 "없음")
□ Conditionals 테이블 작성 (없으면 "없음")
□ Data Flow — controlled/uncontrolled 택일, key 리셋 판단
□ Dependencies 방향 명시
□ Design Guard 5항목 전부 확인 (해당/해당없음 명시)
□ Composition 판단 완료
```
