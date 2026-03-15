# Type Schema

타입 정의 파일을 작성할 때 반드시 채워야 하는 슬롯.
**빈 슬롯이 하나라도 있으면 코드를 생성하지 않는다.**

---

## 1. Identity

| 슬롯 | 값 | 제약 |
|------|-----|------|
| file_path | `{layer}/{slice}/model/types.ts` 또는 `{layer}/{slice}/api/types.ts` | FSD 세그먼트 [A-02]. 도메인 타입은 model/, API 응답 타입은 api/ |
| file_name | camelCase | 컴포넌트가 아니므로 [N-07] |

---

## 2. Type Definitions

각 타입/인터페이스를 기입:

| name | kind | export | 비고 |
|------|------|--------|------|
| `___` | `interface` / `type` | `yes` / `no` | |

---

## 3. Type Strategy

각 타입에 대해 전략을 선택:

| 타입명 | 전략 | 선택 |
|--------|------|------|
| `___` | `flat` — 모든 필드가 항상 존재 | `[ ]` |
| `___` | `discriminated-union` — 상태/모드별 다른 필드 | `[ ]` [T-14] |
| `___` | `intersection` — 공통 + 확장 | `[ ]` |

---

## 4. Optional Field Audit

각 optional(?) 필드에 대해 [T-15]:

| 타입명 | 필드명 | optional 이유 | 정당한가? |
|--------|--------|--------------|-----------|
| `___` | `___?` | `___` | `yes` / `no → discriminated union으로 분리` |

**판단 기준:** "이 필드가 없을 수 있는 이유가 다른 필드의 값 때문인가?"
- Yes → optional 금지, 타입 분리 + discriminated union [T-14, T-15]
- No → optional 허용 (사용자가 선택적으로 제공하는 값)

---

## 5. Safety

| 제약 | 확인 |
|------|------|
| any 사용 없음 → unknown + type guard [T-04] | `□` |
| 의미없는 이름 금지 (data, info, item, temp) [N-08] | `□` |

---

## 슬롯 완료 체크

```
□ Identity 채움
□ Type definitions 전부 기입
□ 각 타입의 strategy 선택됨
□ Optional field audit 완료 — 부당한 optional 없음
□ Safety 확인
```
