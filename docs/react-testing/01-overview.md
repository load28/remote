# 1. React 테스트 개요

## 왜 테스트가 필요한가?

| 문제점 | 테스트의 해결책 |
|--------|----------------|
| 리팩토링 시 기존 기능 파손 우려 | 회귀 테스트로 기능 보장 |
| 버그 수정 후 재발 | 버그 재현 테스트 작성 |
| 복잡한 비즈니스 로직 검증 어려움 | 자동화된 검증 |
| 코드 리뷰 시 동작 확인 한계 | 테스트 코드가 명세 역할 |

## 테스트 피라미드

```
          ╱╲
         ╱  ╲
        ╱ E2E╲          ← 느림, 비용 높음, 적은 수
       ╱──────╲
      ╱        ╲
     ╱Integration╲      ← 중간 속도, 중간 비용
    ╱──────────────╲
   ╱                ╲
  ╱    Unit Tests    ╲  ← 빠름, 비용 낮음, 많은 수
 ╱────────────────────╲
```

### 각 테스트 유형의 특징

| 유형 | 속도 | 신뢰도 | 유지보수 비용 | 범위 |
|------|------|--------|--------------|------|
| **Unit** | 매우 빠름 | 낮음 | 낮음 | 함수, 컴포넌트 |
| **Integration** | 빠름 | 중간 | 중간 | Feature, API 호출 |
| **E2E** | 느림 | 높음 | 높음 | 전체 시나리오 |

## 도구 선정

### Vitest vs Jest

| 항목 | Vitest | Jest |
|------|--------|------|
| **속도** | 매우 빠름 (Vite 기반) | 보통 |
| **ESM 지원** | 네이티브 | 설정 필요 |
| **설정** | 간단 | 복잡할 수 있음 |
| **호환성** | Jest API 호환 | 표준 |
| **HMR** | 지원 | 미지원 |
| **Next.js 호환** | 좋음 | 좋음 |

**선정: Vitest** - 빠른 속도와 ESM 네이티브 지원

### React Testing Library vs Enzyme

| 항목 | React Testing Library | Enzyme |
|------|----------------------|--------|
| **철학** | 사용자 관점 테스트 | 구현 세부사항 테스트 |
| **React 18 지원** | 완전 지원 | 미지원 |
| **유지보수** | 활발 | 중단 |
| **접근성** | 중시 | 고려 안함 |

**선정: React Testing Library** - 사용자 관점 테스트, React 18 지원

### MSW vs 기타 모킹 도구

| 항목 | MSW | axios-mock-adapter | nock |
|------|-----|-------------------|------|
| **레벨** | 네트워크 | axios만 | Node.js만 |
| **fetch 지원** | O | X | X |
| **브라우저 지원** | O | O | X |
| **DevTools 통합** | O | X | X |

**선정: MSW** - 네트워크 레벨 모킹, 브라우저/Node 모두 지원

## 테스트 원칙

### 1. 사용자 관점으로 테스트

```typescript
// ❌ 구현 세부사항 테스트
expect(component.state.isLoading).toBe(false);
expect(wrapper.find('.loading-spinner')).toHaveLength(0);

// ✅ 사용자 관점 테스트
expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
expect(screen.getByText('제출')).toBeEnabled();
```

### 2. 접근성을 통한 쿼리

```typescript
// ✅ 권장 순서 (Testing Library)
screen.getByRole('button', { name: '제출' });    // 1순위: 역할
screen.getByLabelText('이메일');                  // 2순위: 레이블
screen.getByPlaceholderText('입력하세요');        // 3순위: 속성
screen.getByText('환영합니다');                   // 4순위: 텍스트
screen.getByTestId('submit-button');             // 최후: test-id
```

### 3. 통합 테스트 선호

Kent C. Dodds의 "Testing Trophy" 모델에 따르면:

```
통합 테스트에 가장 많은 시간을 투자하라.
단위 테스트는 복잡한 비즈니스 로직에만.
E2E는 핵심 사용자 플로우에만.
```

### 4. 테스트 격리

```typescript
// ✅ 각 테스트는 독립적으로 실행
beforeEach(() => {
  // 상태 초기화
  cleanup();
  server.resetHandlers();
});
```

## FSD 아키텍처에서의 테스트 전략

| FSD 레이어 | 테스트 유형 | 우선순위 | 설명 |
|-----------|------------|---------|------|
| **shared/ui** | Unit | 높음 | 독립적인 UI 컴포넌트 |
| **shared/lib** | Unit | 높음 | 유틸리티 함수, 훅 |
| **entities** | Unit | 높음 | 엔티티 컴포넌트, 모델 |
| **features** | Integration | 높음 | API 호출 포함 기능 |
| **widgets** | Integration | 중간 | 복합 컴포넌트 |
| **pages** | Integration | 낮음 | 페이지 레벨 (E2E 대체 가능) |

## 테스트 커버리지 목표

| 영역 | 목표 커버리지 | 이유 |
|------|-------------|------|
| **shared/lib** | 90%+ | 재사용되는 핵심 로직 |
| **entities/model** | 80%+ | 비즈니스 로직 |
| **features** | 70%+ | 사용자 기능 |
| **ui 컴포넌트** | 60%+ | 시각적 요소는 스냅샷으로 |

## 다음 단계

- [환경 설정](./02-setup.md) - Vitest, Testing Library 설치 및 설정
- [단위 테스트](./03-unit-testing.md) - 컴포넌트, 훅 테스트 작성
