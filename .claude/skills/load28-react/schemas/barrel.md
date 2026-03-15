# Barrel Schema

index.ts barrel 파일을 작성할 때 반드시 채워야 하는 슬롯.
**빈 슬롯이 하나라도 있으면 코드를 생성하지 않는다.**

---

## 1. Identity

| 슬롯 | 값 | 제약 |
|------|-----|------|
| file_path | `{layer}/{slice}/index.ts` | 슬라이스 루트 [A-07]. 예: `features/auth/index.ts`, `entities/user/index.ts` |
| purpose | `___` | 슬라이스의 public API 정의 |

---

## 2. Exports

named export만 허용. `export *` 금지 [P-06]:

| export | source | kind |
|--------|--------|------|
| `export { ___ }` | `from './___'` | component / hook / type / utility |

- `export * from '...'` 사용 시 → 슬롯 자체가 잘못된 것 [P-06]
- third-party 라이브러리 re-export 금지 [A-07]

---

## 3. Access Control

| 슬롯 | 값 | 제약 |
|------|-----|------|
| public_items | `[___]` | 외부에 노출할 것만 |
| internal_only | `[___]` | export하지 않는 내부 모듈 |

---

## 슬롯 완료 체크

```
□ Identity 채움
□ 모든 export가 named export (export * 없음)
□ Public/internal 구분 명시
```
