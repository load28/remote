# Kanban Project Testing Strategy

## Overview

이 문서는 FSD(Feature-Sliced Design) 아키텍처 기반 칸반 프로젝트의 테스트 전략을 정의합니다.

## 테스트 목표

1. **기능 검증**: 구현된 FSD 아키텍처 기능들이 정상적으로 동작하는지 확인
2. **회귀 방지**: 리팩토링이나 기능 추가 시 기존 기능 파손 방지
3. **문서화**: 테스트 코드가 기능 명세 역할 수행
4. **신뢰성 향상**: 자동화된 테스트를 통한 코드 품질 보장

## 기술 스택

| 도구 | 버전 | 용도 |
|------|------|------|
| **Vitest** | ^2.0.0 | 테스트 러너 |
| **React Testing Library** | ^14.0.0 | 컴포넌트 테스트 |
| **@testing-library/user-event** | ^14.0.0 | 사용자 상호작용 시뮬레이션 |
| **MSW** | ^2.6.0 | API 모킹 (기존 핸들러 재사용) |
| **@testing-library/jest-dom** | ^6.0.0 | DOM 매처 확장 |

## FSD 레이어별 테스트 전략

```
┌─────────────────────────────────────────────────────────────────────┐
│ Layer          │ 테스트 유형      │ 우선순위 │ 커버리지 목표        │
├─────────────────────────────────────────────────────────────────────┤
│ shared/ui      │ Unit            │ 높음     │ 80%+                │
│ shared/lib     │ Unit            │ 높음     │ 90%+                │
│ entities       │ Unit            │ 높음     │ 80%+                │
│ features       │ Integration     │ 높음     │ 70%+                │
│ widgets        │ Integration     │ 중간     │ 60%+                │
└─────────────────────────────────────────────────────────────────────┘
```

## 테스트 대상 컴포넌트

### 1. shared/ui (유닛 테스트)

| 컴포넌트 | 테스트 항목 |
|----------|------------|
| `Button` | variant, size, disabled, onClick 동작 |
| `Input` | value 변경, error 표시, placeholder |
| `Modal` | open/close, ESC 키, 오버레이 클릭 |

### 2. shared/lib (유닛 테스트)

| 유틸리티 | 테스트 항목 |
|----------|------------|
| `cn` | 클래스 결합, 조건부 클래스, falsy 값 필터링 |
| `useLocalStorage` | 초기값, 저장, 업데이트, 함수형 업데이트 |

### 3. entities (유닛 테스트)

| 엔티티 | 테스트 항목 |
|--------|------------|
| `CardItem` | 렌더링, 라벨 표시, 드래그 상태 |
| `BoardCard` | 보드 정보 표시, 클릭 이벤트, 통계 계산 |
| `ColumnHeader` | 컬럼 이름, 카드 개수 표시 |

### 4. features (통합 테스트)

| 기능 | 테스트 항목 |
|------|------------|
| `CreateCardForm` | 폼 입력, 유효성 검사, 제출/취소 |
| `LoginForm` | 로그인 성공/실패, 에러 처리 |
| `FilterBar` | 필터 적용, 초기화 |

### 5. widgets (통합 테스트)

| 위젯 | 테스트 항목 |
|------|------------|
| `KanbanBoard` | 컬럼/카드 렌더링, 드래그 앤 드롭 |
| `BoardHeader` | 보드 정보 표시, 액션 버튼 |

## 테스트 파일 구조

```
src/
├── shared/
│   ├── test-utils/              # 테스트 유틸리티
│   │   ├── index.ts             # 메인 export
│   │   ├── setup.ts             # 전역 설정
│   │   ├── render.tsx           # 커스텀 렌더 함수
│   │   ├── msw-server.ts        # MSW Node 서버
│   │   └── mocks/               # Mock 데이터
│   │       ├── board.ts
│   │       └── card.ts
│   ├── ui/
│   │   └── button/
│   │       ├── Button.tsx
│   │       └── Button.test.tsx  # 컴포넌트 옆에 테스트 파일
│   └── lib/
│       └── utils/
│           ├── cn.ts
│           └── cn.test.ts
├── entities/
│   └── card/
│       └── ui/
│           ├── CardItem.tsx
│           └── CardItem.test.tsx
├── features/
│   └── create-card/
│       └── ui/
│           ├── CreateCardForm.tsx
│           └── CreateCardForm.test.tsx
└── widgets/
    └── kanban-board/
        └── ui/
            ├── KanbanBoard.tsx
            └── KanbanBoard.test.tsx
```

## 테스트 원칙

### 1. 사용자 관점 테스트

```typescript
// ❌ 구현 세부사항 테스트
expect(component.state.isLoading).toBe(false);

// ✅ 사용자 관점 테스트
expect(screen.getByRole('button', { name: '저장' })).toBeEnabled();
```

### 2. 접근성 기반 쿼리 우선순위

```typescript
// 1순위: role
screen.getByRole('button', { name: '제출' });

// 2순위: label
screen.getByLabelText('이메일');

// 3순위: text
screen.getByText('환영합니다');

// 최후: test-id
screen.getByTestId('submit-button');
```

### 3. AAA 패턴 적용

```typescript
it('카드를 생성한다', async () => {
  // Arrange (준비)
  const user = userEvent.setup();
  render(<CreateCardForm columnId="col-1" onCancel={vi.fn()} />);

  // Act (실행)
  await user.type(screen.getByPlaceholderText(/title/i), '새 카드');
  await user.click(screen.getByRole('button', { name: /add/i }));

  // Assert (검증)
  expect(mockCreateCard).toHaveBeenCalledWith({
    title: '새 카드',
    columnId: 'col-1',
  });
});
```

### 4. 테스트 격리

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  server.resetHandlers();
});
```

## MSW 핸들러 재사용

기존 MSW 핸들러(`src/shared/api/msw/handlers`)를 테스트에서 재사용합니다.

```typescript
// src/shared/test-utils/msw-server.ts
import { setupServer } from 'msw/node';
import { handlers } from '@/shared/api/msw/handlers';

export const server = setupServer(...handlers);
```

테스트별 핸들러 오버라이드:

```typescript
it('에러 상황을 처리한다', async () => {
  server.use(
    http.get('/api/boards', () => {
      return HttpResponse.json({ message: 'Error' }, { status: 500 });
    })
  );
  // ...
});
```

## 실행 스크립트

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## 커버리지 목표

| 영역 | 목표 | 설명 |
|------|------|------|
| shared/lib | 90%+ | 핵심 유틸리티 함수 |
| shared/ui | 80%+ | 재사용 가능한 UI 컴포넌트 |
| entities | 80%+ | 엔티티 컴포넌트, 비즈니스 로직 |
| features | 70%+ | 사용자 기능 |
| widgets | 60%+ | 복합 컴포넌트 (E2E 보완 가능) |

## 구현 우선순위

1. **Phase 1: 테스트 환경 설정**
   - Vitest 설정
   - Testing Library 설정
   - MSW Node 서버 설정
   - 커스텀 렌더 함수 작성

2. **Phase 2: 유닛 테스트**
   - shared/lib 유틸리티 테스트
   - shared/ui 컴포넌트 테스트
   - entities 컴포넌트 테스트

3. **Phase 3: 통합 테스트**
   - features 기능 테스트
   - widgets 위젯 테스트

## 참고 자료

- [Vitest 공식 문서](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW 공식 문서](https://mswjs.io/)
- [FSD 아키텍처 문서](../docs/fsd-architecture/README.md)
- [React 테스트 가이드](../docs/react-testing/README.md)
