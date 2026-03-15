# API Layer Schema

API/데이터 접근 레이어를 작성할 때 반드시 채워야 하는 슬롯.
**빈 슬롯이 하나라도 있으면 코드를 생성하지 않는다.**

---

## 1. Identity

| 슬롯 | 값 | 제약 |
|------|-----|------|
| name | `___Api` / `___Repository` | camelCase 파일 [N-07] |
| file_path | `{layer}/{slice}/api/___.ts` | FSD api 세그먼트 [A-02]. 예: `features/auth/api/authApi.ts`, `entities/user/api/userApi.ts` |
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

## 6. Design Guard — 코드 생성 전 필수 확인

슬롯 채우기 완료 후, 아래 항목을 확인한다. 해당 시 설계에 즉시 반영:

| # | 확인 | 해당 시 조치 | 해당없음 조건 |
|---|------|------------|-------------|
| DG-1 | 교체 가능성 있는 외부 SDK를 직접 사용하는가? [A-06] | 인터페이스 정의 + 구현체 분리 (의존성 역전) | 프로젝트 기반 기술(React, CSS)이거나 교체 가능성 없음 |
| DG-2 | 독립적인 API를 순차 호출하고 있는가? [P-07] | Promise.all로 병렬화 | 호출 간 의존성이 있어 순차 필수이거나, API 호출이 1개뿐 |
| DG-3 | 검색/필터 등 빈번 호출되는 API가 있는가? [P-13] | AbortController signal을 파라미터로 받도록 설계 | 모든 API가 사용자 명시 동작(버튼 클릭)에서만 호출 |

---

## 7. Consumer Hook

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
□ Design Guard 3항목 전부 확인 (해당/해당없음 명시)
□ Consumer hook 정의 (있으면)
```
