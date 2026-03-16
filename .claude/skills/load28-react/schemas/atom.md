# Atom Schema

Jotai 클라이언트 상태 atom을 작성할 때 반드시 채워야 하는 슬롯.
**빈 슬롯이 하나라도 있으면 코드를 생성하지 않는다.**

---

## 1. Identity

| 슬롯 | 값 | 제약 |
|------|-----|------|
| name | `___Atom` | camelCase + Atom 접미사 [N-09] |
| file_path | `{layer}/{slice}/model/___Atoms.ts` | FSD model 세그먼트 [A-02, A-11]. 예: `features/chat/model/chatAtoms.ts`, `entities/user/model/userAtoms.ts` |
| purpose | `___` | 단일 관심사 [A-04] |
| line_budget | `___/250` | 파일 250줄 이하 [C-05] |

---

## 2. Atom Classification

| 슬롯 | 값 | 제약 |
|------|-----|------|
| state_type | `client` | 고정. 서버 상태는 TanStack Query [S-08] |
| scope | `global (Provider 없음)` / `scoped (Provider 사용)` | |
| scope_justification | `___` | 왜 이 scope인가? [S-09] — 단일 컴포넌트만 사용하면 useState로 충분 |

---

## 3. Atoms 정의

atom_type에 따라 해당 슬롯만 채운다. 하나의 파일에 여러 atom을 정의할 수 있다.

### 3-A. primitive

| 슬롯 | 값 | 제약 |
|------|-----|------|
| atom_name | `___Atom` | camelCase + Atom 접미사 [N-09] |
| initial_value | `___` | |
| type | `___` | any 금지 [T-04]. boolean은 is/has/can/should 접두사 [N-04] |
| debugLabel | `___Atom` | 필수. atom 선언 직후 할당 [S-26] |

### 3-B. derived (read-only)

| 슬롯 | 값 | 제약 |
|------|-----|------|
| atom_name | `___Atom` | camelCase + Atom 접미사 [N-09] |
| dependencies | `[___Atom, ...]` | 의존하는 atom 목록 |
| computation | `(get) => ___` | 순수 함수, 부수효과 금지. **비동기 호출(fetch/API) 금지** [S-24] — 서버 데이터는 TanStack Query |
| return_type | `___` | any 금지 [T-04] |
| debugLabel | `___Atom` | 필수. atom 선언 직후 할당 [S-26] |

### 3-C. writable

| 슬롯 | 값 | 제약 |
|------|-----|------|
| atom_name | `___Atom` | camelCase + Atom 접미사 [N-09] |
| dependencies | `[___Atom, ...]` | read에서 의존하는 atom 목록 |
| read_logic | `(get) => ___` | |
| write_targets | `[___Atom, ...]` | write에서 set하는 atom 목록 |
| write_logic | `(get, set, arg) => ___` | get() 반환값 직접 변경(mutate) 금지 — 새 참조 생성 후 set() [S-01] |
| debugLabel | `___Atom` | 필수. atom 선언 직후 할당 [S-26] |

> **패턴**: 여러 atom을 동시에 업데이트하는 액션 로직은 write-only atom(`atom(null, (get, set, arg) => ...)`)으로 캡슐화한다 [S-27]. 컴포넌트에서 `useSetAtom`으로 액션만 디스패치.

### 3-D. async

| 슬롯 | 값 | 제약 |
|------|-----|------|
| atom_name | `___Atom` | camelCase + Atom 접미사 [N-09] |
| dependencies | `[___Atom, ...]` | 의존하는 atom 목록 |
| async_computation | `async (get) => ___` | |
| return_type | `___` | any 금지 [T-04] |
| abort_handling | `yes` / `no` | 필요 시 AbortController 사용 |
| error_boundary | `___` | 에러 처리 전략 명시 |
| debugLabel | `___Atom` | 필수. atom 선언 직후 할당 [S-26] |

> **주의**: 서버 데이터 fetch가 목적이면 async atom 대신 TanStack Query 사용 [S-08]
> **주의**: async atom은 React Suspense를 트리거한다. 사용하는 컴포넌트 상위에 `<Suspense>` boundary가 필요하며, 에러 시 ErrorBoundary도 함께 배치한다.

### 3-E. family

| 슬롯 | 값 | 제약 |
|------|-----|------|
| atom_name | `___AtomFamily` | camelCase + AtomFamily 접미사 |
| param_type | `___` | any 금지 [T-04]. **primitive(string/number)만 허용** [S-25] — 객체/배열 파라미터는 문자열 직렬화로 변환 |
| base_atom_type | `primitive` / `derived` / `writable` / `async` | |
| (해당 base_atom_type의 슬롯) | | 위 3-A ~ 3-D 중 해당 슬롯 채움 |

> **주의**: atomFamily는 param을 `===`로 비교한다. 객체/배열 param 사용 시 매번 새 atom이 생성되므로, primitive 값(string, number) 사용을 권장한다.

---

## 4. Atom 의존 그래프

```
___Atom
  └─ ___Atom
       └─ ___Atom (최대 깊이 3)
```

- 순환 의존 금지
- 의존 깊이 3 이하 권장
- 의존 관계가 없으면 "없음"으로 명시

---

## 5. Design Guard — 코드 생성 전 필수 확인

슬롯 채우기 완료 후, 아래 항목을 확인한다. 해당 시 설계에 즉시 반영:

| # | 확인 | 해당 시 조치 | 해당없음 조건 |
|---|------|------------|-------------|
| DG-1 | atom이 외부 서비스/SDK에 직접 의존하는가? [A-03] | 인터페이스로 추상화, 구현체 주입 | atom이 순수 클라이언트 상태만 관리 |
| DG-2 | 최소 권한 hook을 선택했는가? | useAtomValue(읽기만) / useSetAtom(쓰기만) / useAtom(양쪽) 중 최소 권한 선택 | — (필수, 해당없음 불가. 항상 최소 권한 선택) |
| DG-3 | 서버 데이터를 async atom으로 처리하는가? [S-08] | TanStack Query로 전환 | async atom이 순수 클라이언트 계산만 수행 |
| DG-4 | 단일 컴포넌트만 사용하는가? [S-09] | useState로 전환, atom 불필요 | 2개 이상 컴포넌트에서 공유 |
| DG-5 | derived atom에서 비동기 호출을 하는가? [S-24] | 서버 데이터 fetch → TanStack Query로 전환. 순수 클라이언트 async 계산만 async atom 허용 | derived atom이 동기적 순수 계산만 수행 |
| DG-6 | 여러 atom을 동시에 업데이트하는 로직이 컴포넌트에 있는가? [S-27] | write-only atom으로 캡슐화 | 단일 atom만 업데이트하거나, 업데이트 로직이 1개 컴포넌트에서만 사용 |
| DG-7 | atomFamily의 파라미터가 객체/배열인가? [S-25] | primitive(string/number)로 변환하거나 문자열 직렬화 | 파라미터가 이미 primitive |

---

## 6. FSD Dependencies [A-01]

| 슬롯 | 값 | 제약 |
|------|-----|------|
| fsd_layer | `app` / `pages` / `widgets` / `features` / `entities` / `shared` | 이 atom이 속한 FSD 레이어 [A-01] |
| imports_from | `[___]` | 하위 레이어만 허용. 예: features → entities, shared |
| forbidden_imports | `[___]` | 같은 레이어 슬라이스 / 상위 레이어 금지 |

---

## 7. Consumer Pattern

컴포넌트에서 atom을 직접 사용하는 경우의 가이드.
추가 로직이 필요하여 커스텀 훅으로 감싸는 경우 → [hook.md](hook.md) 3B(jotai) 스키마를 별도로 채운다.

atom 사용 컴포넌트에서의 hook 선택:

| atom | hook | 이유 |
|------|------|------|
| `___Atom` | `useAtomValue` / `useSetAtom` / `useAtom` | 읽기만 / 쓰기만 / 양쪽 |

- 항상 최소 권한 hook을 선택한다
- `useAtomValue`: 값을 읽기만 할 때 (리렌더 최소화)
- `useSetAtom`: 값을 쓰기만 할 때 (구독 없음, 리렌더 없음)
- `useAtom`: 읽기 + 쓰기 둘 다 필요할 때

---

## 슬롯 완료 체크

```
□ Identity 4개 슬롯 전부 채움
□ Atom Classification — client 확인, scope 선택, scope 근거 명시
□ Atoms 정의 — atom_type별 해당 슬롯 전부 기입
□ Atom 의존 그래프 — 순환 없음, 깊이 3 이하 확인
□ Design Guard 7항목 전부 확인 (해당/해당없음 명시)
□ FSD Dependencies — fsd_layer 명시, imports_from 하위 레이어만
□ Consumer Pattern — 각 atom별 최소 권한 hook 명시
```
