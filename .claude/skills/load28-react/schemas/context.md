# Context Schema

Context + Provider를 작성할 때 반드시 채워야 하는 슬롯.
**빈 슬롯이 하나라도 있으면 코드를 생성하지 않는다.**

---

## 1. Identity

| 슬롯 | 값 | 제약 |
|------|-----|------|
| context_name | `___Context` | PascalCase [N-01] |
| provider_name | `___Provider` | PascalCase [N-01] |
| hook_name | `use___` | use + 동사 [N-05] |
| file_path | `features/___/contexts/___.tsx` | feature 기반 [A-02] |
| line_budget | `___/250` | [C-05] |

---

## 2. Scope & Separation

| 슬롯 | 값 | 제약 |
|------|-----|------|
| 관심사 | `___` | 단일 관심사만. auth + theme 혼합 금지 [S-07] |
| state_type | `client` / `server` | 서버/클라이언트 분리 [S-08] |
| 변경 빈도 | `자주` / `드물게` | 자주 변경되는 값과 드물게 변경되는 값 분리 [S-07] |

**S-07 검증:** 이 Context에 2개 이상 무관한 관심사가 있으면 → 분리해서 각각 Context Schema를 채운다.

---

## 3. Value Interface

**type_name:** `___ContextValue` — named exported interface [T-13]

| # | name | type | 비고 |
|---|------|------|------|
| 1 | `___` | `___` | |
| 2 | `___` | `___` | |
| ... | | | |

- any 금지 [T-04]
- boolean은 is/has/can/should 접두사 [N-04]

---

## 4. Provider Value Memoization

| 슬롯 | 값 | 제약 |
|------|-----|------|
| useMemo 사용 | `yes` | 고정. 변경 불가 [S-14] |
| memo_deps | `[___]` | value 객체의 실제 변경 트리거 |

```tsx
// 이 구조는 고정. 슬롯은 deps만 채움
const value = useMemo(() => ({ ... }), [deps]);
return <___Context.Provider value={value}>{children}</___Context.Provider>;
```

---

## 5. Consumer Hook

| 슬롯 | 값 | 제약 |
|------|-----|------|
| null_check | `yes` | Context 값이 null이면 에러 throw |
| error_message | `___` | Provider 미래핑 시 에러 메시지 |

```tsx
// 이 구조는 고정
function use___() {
  const value = useContext(___Context);
  if (value === null) throw new Error('___');
  return value;
}
```

---

## 6. Design Guard — 코드 생성 전 필수 확인

슬롯 채우기 완료 후, 아래 항목을 확인한다. 해당 시 설계에 즉시 반영:

| # | 확인 | 해당 시 조치 | 해당없음 조건 |
|---|------|------------|-------------|
| DG-1 | 이 Context에 변경 빈도가 다른 값이 혼합되어 있는가? [S-07] | 변경 빈도별로 Context 분리 | 모든 값의 변경 빈도가 동일 |
| DG-2 | Provider value에 useMemo가 적용되어 있는가? [S-14] | 반드시 useMemo로 감싸기 | — (필수, 해당없음 불가) |
| DG-3 | 이 Context에 비즈니스 로직이 포함되어 있는가? [A-05] | 별도 순수 함수 파일로 추출 | Context가 순수 상태 전달만 담당 |

---

## 7. Layer

| 슬롯 | 값 | 제약 |
|------|-----|------|
| layer | `presentation` / `business` / `data` | [A-05] |
| react_free_logic | `___` | 비즈니스 로직이 있으면 별도 파일로 추출 [A-05] |

---

## 슬롯 완료 체크

```
□ Identity 5개 슬롯 전부 채움
□ Scope & Separation 확인 — 단일 관심사
□ Value interface 정의 + named export
□ useMemo deps 명시
□ Consumer hook null check 포함
□ Design Guard 3항목 전부 확인 (해당/해당없음 명시)
□ Layer 판단 완료
```
