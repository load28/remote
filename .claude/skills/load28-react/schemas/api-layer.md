# API Layer Schema

API/데이터 접근 레이어를 작성할 때 반드시 채워야 하는 슬롯.
**빈 슬롯이 하나라도 있으면 코드를 생성하지 않는다.**

---

## 1. Identity

| 슬롯 | 값 | 제약 |
|------|-----|------|
| name | `___Api` / `___Repository` | camelCase 파일 [N-07] |
| file_path | `features/___/api/___.ts` | feature 기반 [A-02] |
| purpose | `___` | |

---

## 2. Anti-Corruption Layer

| 슬롯 | 값 | 제약 |
|------|-----|------|
| http_client | `httpClient 래퍼` | 고정. axios/fetch 직접 사용 금지 [A-09] |
| external_sdk | `___` / `없음` | 2개+ 파일에서 사용 시 래퍼 필수 [A-09] |
| interface_defined | `yes` / `no` | 교체 가능성 있으면 interface 필수 [A-06] |

---

## 3. Functions

각 API 함수를 기입:

| name | method | endpoint | params | return_type |
|------|--------|----------|--------|-------------|
| `___` | GET/POST/PUT/DELETE | `___` | `___` | `Promise<___>` |

- any 금지 → 응답 타입 명시 [T-04]
- 도메인 타입으로 변환 (SDK 고유 타입 누출 금지) [A-09]

---

## 4. Parallel Requests

| 슬롯 | 값 | 제약 |
|------|-----|------|
| waterfall_check | `___` | 순차 요청이 병렬 가능한가? [P-07] |
| parallel_strategy | `Promise.all` / `개별` / `해당없음` | |

---

## 5. Cancellation

| 슬롯 | 값 | 제약 |
|------|-----|------|
| abort_support | `yes` / `no` | 검색/필터 등 빈번 호출 시 필수 [P-13] |
| abort_mechanism | `AbortController` / `TanStack Query 내장` / `해당없음` | |

---

## 6. Consumer Hook

이 API를 소비하는 훅이 있으면:

| 슬롯 | 값 | 제약 |
|------|-----|------|
| hook_name | `use___` | [N-05] |
| pattern | `useQuery` / `useMutation` | 수동 fetch 금지 [S-04] |
| onSuccess_location | `사용처` | 훅 내부 금지 [S-17] |

---

## 슬롯 완료 체크

```
□ Identity 3개 슬롯 전부 채움
□ ACL 확인 — httpClient 래퍼 사용
□ Functions 전부 기입 + 타입 명시
□ Waterfall 검사 완료
□ Cancellation 전략 명시
□ Consumer hook 정의 (있으면)
```
