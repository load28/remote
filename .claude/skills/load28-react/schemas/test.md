# Test Schema

테스트 파일을 작성할 때 반드시 채워야 하는 슬롯.
**빈 슬롯이 하나라도 있으면 코드를 생성하지 않는다.**

---

## 1. Identity

| 슬롯 | 값 | 제약 |
|------|-----|------|
| name | `___.test.tsx` / `___.test.ts` | |
| file_path | 소스 파일 옆 | 소스와 같은 디렉토리 [T-03, A-10] |
| target | `___` | 테스트 대상 파일/함수/컴포넌트 |

---

## 2. Test Pyramid Level

하나를 선택 [T-07]:

| 레벨 | 설명 | 선택 |
|------|------|------|
| `unit` | 순수 함수, 커스텀 훅, 유틸리티 | `[ ]` |
| `integration` | 컴포넌트 + 훅 + API 모킹 조합 | `[ ]` |
| `e2e` | 핵심 사용자 시나리오 (최소한으로) | `[ ]` |

---

## 3. Test Perspective

| 슬롯 | 값 | 제약 |
|------|-----|------|
| perspective | `사용자 행동` | 고정. 구현 세부사항 테스트 금지 [T-01] |
| query_priority | `___` | getByRole > getByLabelText > getByText > getByTestId [T-08] |

**금지 패턴 확인:**

| 금지 | 확인 |
|------|------|
| wrapper.state() 접근 금지 | `□` |
| className으로 찾기 금지 | `□` |
| instance() 접근 금지 | `□` |

---

## 4. Mocking Strategy

| 슬롯 | 값 | 제약 |
|------|-----|------|
| network_mock | `MSW` / `불필요` | unit에서 네트워크 불필요 시 "불필요" 가능. integration 이상은 `MSW` 고정. jest.mock(axios)/global.fetch 금지 [T-02] |
| mock_handlers | `[___]` | MSW handler 목록 (network_mock이 "불필요"면 "해당없음") |

---

## 5. Bug Fix Test (해당 시)

| 슬롯 | 값 | 제약 |
|------|-----|------|
| is_bug_fix | `yes` / `no` | |
| repro_test_first | `yes` | 버그 수정 시 고정. 재현 테스트 → 수정 순서 [T-09] |
| commit_order | `재현 테스트(fail) → 수정(pass)` | [T-09] |

---

## 6. Test Cases

각 테스트 케이스를 기입:

| describe | it | 사용자 행동 | 기대 결과 |
|----------|-----|-----------|-----------|
| `___` | `___` | `___` | `___` |

- "사용자가 ~하면 ~가 보인다" 형식
- 내부 state 값 검증 금지 [T-01]

---

## 슬롯 완료 체크

```
□ Identity — 소스 파일 옆에 배치 확인
□ Pyramid level 선택됨
□ Test perspective — 사용자 행동 관점 확인
□ Mocking — unit(네트워크 없음)이면 "불필요" 가능, integration 이상은 MSW 확인
□ Bug fix면 재현 테스트 우선 확인
□ Test cases 전부 기입
```
