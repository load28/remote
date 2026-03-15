# Store Schema

Zustand 등 클라이언트 전역 상태 스토어를 작성할 때 반드시 채워야 하는 슬롯.
**빈 슬롯이 하나라도 있으면 코드를 생성하지 않는다.**

---

## 1. Identity

| 슬롯 | 값 | 제약 |
|------|-----|------|
| name | `use___Store` | use + 동사 + Store [N-05] |
| file_path | `features/___/store/use___Store.ts` | feature 기반 [A-02] |
| purpose | `___` | 단일 관심사 [A-04] |

---

## 2. State Classification

| 슬롯 | 값 | 제약 |
|------|-----|------|
| state_type | `client` | 고정. 서버 상태는 TanStack Query [S-08] |
| scope_justification | `___` | 왜 전역이 필요한가? [S-09] — 로컬로 충분하면 스토어 불필요 |

---

## 3. State Fields

| name | type | 비고 |
|------|------|------|
| `___` | `___` | |

- boolean은 is/has/can/should 접두사 [N-04]
- any 금지 [T-04]
- 파생 가능한 값 state 금지 → get() 또는 외부 계산 [S-03]

---

## 4. Actions

| name | params | 설명 |
|------|--------|------|
| `___` | `___` | |

- state 직접 변경 금지 → set()으로 새 참조 생성 [S-01]
- 이전값 기반이면 set(prev => ...) [S-06]

---

## 5. Selectors

| name | expression | 사용처 |
|------|-----------|--------|
| `___` | `(state) => state.___` | `___` |

- 컴포넌트에서 `useStore()` 전체 구독 금지 — 필요한 필드만 selector로 선택
- 여러 필드 선택 시 `useShallow` 활용으로 참조 안정화
- 파생값은 selector 내부에서 계산 [S-03]
- selector가 없으면 "없음"으로 명시 (단, 전체 구독 금지는 유지)

---

## 6. Coupling

| 슬롯 | 값 | 제약 |
|------|-----|------|
| external_deps | `___` | 외부 의존 최소화 [A-03] |
| react_free | `yes` / `no` | 비즈니스 로직은 React 없이 테스트 가능해야 [A-05] |

---

## 슬롯 완료 체크

```
□ Identity 3개 슬롯 전부 채움
□ State classification — client 확인, scope 근거 명시
□ State fields 전부 기입
□ Actions 전부 기입
□ Selectors 기입 — 전체 구독 금지, 필요 필드만 선택
□ Coupling 확인
```
