# 5. 테스트 패턴

## FSD 아키텍처 기반 테스트 전략

Feature-Sliced Design 아키텍처에서 각 레이어별로 적합한 테스트 전략을 적용합니다.

```
┌─────────────────────────────────────────────────────────┐
│ Layer       │ 테스트 유형      │ 주요 검증 대상           │
├─────────────────────────────────────────────────────────┤
│ shared/ui   │ Unit            │ 독립 컴포넌트 렌더링     │
│ shared/lib  │ Unit            │ 유틸리티, 훅 로직        │
│ entities    │ Unit            │ 엔티티 UI, 모델          │
│ features    │ Integration     │ 기능 단위, API 호출      │
│ widgets     │ Integration     │ 복합 컴포넌트 조합       │
│ pages       │ Integration     │ 페이지 레벨 통합         │
└─────────────────────────────────────────────────────────┘
```

## 레이어별 테스트 패턴

### 1. shared/ui - UI 컴포넌트 테스트

독립적인 UI 컴포넌트는 **순수 단위 테스트**로 검증합니다.

```tsx
// src/shared/ui/Modal/Modal.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  it('isOpen이 true일 때 렌더링된다', () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        <p>모달 내용</p>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('모달 내용')).toBeInTheDocument();
  });

  it('isOpen이 false일 때 렌더링되지 않는다', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <p>모달 내용</p>
      </Modal>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ESC 키로 닫을 수 있다', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal isOpen onClose={handleClose}>
        내용
      </Modal>
    );

    await user.keyboard('{Escape}');

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('오버레이 클릭으로 닫을 수 있다', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal isOpen onClose={handleClose}>
        내용
      </Modal>
    );

    await user.click(screen.getByTestId('modal-overlay'));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
```

### 2. shared/lib - 유틸리티 함수 테스트

순수 함수는 **입력-출력 검증**에 집중합니다.

```tsx
// src/shared/lib/utils/formatDate.test.ts
import { formatDate, formatRelativeTime } from './formatDate';

describe('formatDate', () => {
  it('날짜를 지정된 형식으로 포맷한다', () => {
    const date = new Date('2024-03-15T10:30:00');

    expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-03-15');
    expect(formatDate(date, 'YYYY년 MM월 DD일')).toBe('2024년 03월 15일');
  });

  it('유효하지 않은 날짜는 빈 문자열을 반환한다', () => {
    expect(formatDate(new Date('invalid'), 'YYYY-MM-DD')).toBe('');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('방금 전을 표시한다', () => {
    const date = new Date('2024-03-15T11:59:30');
    expect(formatRelativeTime(date)).toBe('방금 전');
  });

  it('N분 전을 표시한다', () => {
    const date = new Date('2024-03-15T11:45:00');
    expect(formatRelativeTime(date)).toBe('15분 전');
  });

  it('N시간 전을 표시한다', () => {
    const date = new Date('2024-03-15T09:00:00');
    expect(formatRelativeTime(date)).toBe('3시간 전');
  });
});
```

### 3. entities - 엔티티 컴포넌트 테스트

엔티티는 **비즈니스 로직과 UI**를 함께 테스트합니다.

```tsx
// src/entities/Card/ui/CardItem.test.tsx
import { render, screen } from '@/shared/test-utils';
import userEvent from '@testing-library/user-event';
import { CardItem } from './CardItem';
import { buildCard } from '@/shared/test-utils/builders';

describe('CardItem', () => {
  const defaultCard = buildCard({
    title: '테스트 카드',
    description: '카드 설명',
    priority: 'high',
  });

  it('카드 정보를 렌더링한다', () => {
    render(<CardItem card={defaultCard} />);

    expect(screen.getByText('테스트 카드')).toBeInTheDocument();
    expect(screen.getByText('카드 설명')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('드래그 가능한 상태를 표시한다', () => {
    render(<CardItem card={defaultCard} isDragging />);

    expect(screen.getByRole('article')).toHaveClass('dragging');
  });

  it('클릭 시 onSelect를 호출한다', async () => {
    const handleSelect = vi.fn();
    const user = userEvent.setup();

    render(<CardItem card={defaultCard} onSelect={handleSelect} />);

    await user.click(screen.getByRole('article'));

    expect(handleSelect).toHaveBeenCalledWith(defaultCard);
  });
});
```

### 4. features - 기능 통합 테스트

기능은 **API 호출을 포함한 전체 플로우**를 테스트합니다.

```tsx
// src/features/edit-card/ui/EditCardForm.test.tsx
import { render, screen, waitFor } from '@/shared/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/shared/test-utils';
import { EditCardForm } from './EditCardForm';
import { buildCard } from '@/shared/test-utils/builders';

describe('EditCardForm', () => {
  const card = buildCard({ id: 'card-1', title: '원래 제목' });
  const onSuccess = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('기존 카드 정보를 폼에 표시한다', () => {
    render(
      <EditCardForm
        card={card}
        boardId="board-1"
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );

    expect(screen.getByLabelText('제목')).toHaveValue('원래 제목');
  });

  it('카드 수정 성공 시 onSuccess를 호출한다', async () => {
    const user = userEvent.setup();

    render(
      <EditCardForm
        card={card}
        boardId="board-1"
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );

    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 제목');
    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('API 에러 시 에러 메시지를 표시한다', async () => {
    server.use(
      http.patch('/api/boards/:boardId/cards/:cardId', () => {
        return HttpResponse.json(
          { message: '수정 권한이 없습니다' },
          { status: 403 }
        );
      })
    );

    const user = userEvent.setup();

    render(
      <EditCardForm
        card={card}
        boardId="board-1"
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );

    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 제목');
    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });
});
```

### 5. widgets - 복합 컴포넌트 테스트

위젯은 **여러 feature와 entity의 조합**을 테스트합니다.

```tsx
// src/widgets/kanban-board/ui/KanbanBoard.test.tsx
import { render, screen, waitFor, within } from '@/shared/test-utils';
import userEvent from '@testing-library/user-event';
import { KanbanBoard } from './KanbanBoard';

describe('KanbanBoard', () => {
  it('컬럼과 카드를 렌더링한다', async () => {
    render(<KanbanBoard boardId="board-1" />);

    // 데이터 로드 대기
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // 컬럼 확인
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();

    // 각 컬럼의 카드 확인
    const todoColumn = screen.getByRole('region', { name: 'To Do' });
    expect(within(todoColumn).getAllByRole('article')).toHaveLength(2);
  });

  it('새 컬럼을 추가할 수 있다', async () => {
    const user = userEvent.setup();
    render(<KanbanBoard boardId="board-1" />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '컬럼 추가' }));
    await user.type(screen.getByLabelText('컬럼 이름'), '새 컬럼');
    await user.click(screen.getByRole('button', { name: '추가' }));

    await waitFor(() => {
      expect(screen.getByText('새 컬럼')).toBeInTheDocument();
    });
  });
});
```

## 공통 테스트 패턴

### AAA 패턴 (Arrange-Act-Assert)

```tsx
it('카드를 삭제한다', async () => {
  // Arrange (준비)
  const user = userEvent.setup();
  const card = buildCard({ id: 'card-1', title: '삭제할 카드' });
  render(<CardItem card={card} onDelete={vi.fn()} />);

  // Act (실행)
  await user.click(screen.getByRole('button', { name: '삭제' }));
  await user.click(screen.getByRole('button', { name: '확인' }));

  // Assert (검증)
  await waitFor(() => {
    expect(screen.queryByText('삭제할 카드')).not.toBeInTheDocument();
  });
});
```

### 테스트 설명 컨벤션

```tsx
describe('CardItem', () => {
  // 렌더링 테스트
  describe('렌더링', () => {
    it('제목을 표시한다', () => {});
    it('설명이 있으면 표시한다', () => {});
    it('우선순위 뱃지를 표시한다', () => {});
  });

  // 상호작용 테스트
  describe('상호작용', () => {
    it('클릭 시 상세 보기를 연다', () => {});
    it('드래그 시작 시 스타일이 변경된다', () => {});
  });

  // 에러 상태 테스트
  describe('에러 처리', () => {
    it('삭제 실패 시 에러를 표시한다', () => {});
  });
});
```

### 테스트 데이터 관리

```tsx
// src/shared/test-utils/fixtures/boards.ts
export const mockBoards = {
  empty: [],
  single: [{ id: '1', title: 'Board 1' }],
  multiple: [
    { id: '1', title: 'Board 1' },
    { id: '2', title: 'Board 2' },
    { id: '3', title: 'Board 3' },
  ],
};

export const mockColumns = {
  todo: { id: 'col-1', title: 'To Do', order: 0 },
  inProgress: { id: 'col-2', title: 'In Progress', order: 1 },
  done: { id: 'col-3', title: 'Done', order: 2 },
};
```

### 커스텀 매처

```tsx
// src/shared/test-utils/matchers.ts
import { expect } from 'vitest';

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to be within range ${floor} - ${ceiling}`,
    };
  },
});

// 사용
expect(result.count).toBeWithinRange(1, 10);
```

### 비동기 유틸리티

```tsx
// src/shared/test-utils/async-utils.ts
import { waitFor } from '@testing-library/react';

export async function waitForLoadingToFinish() {
  await waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
}

export async function waitForToast(message: string) {
  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(message);
  });
}
```

## 테스트 격리 원칙

```tsx
// ✅ 각 테스트는 독립적으로
describe('CardList', () => {
  beforeEach(() => {
    // 각 테스트 전 상태 초기화
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it('테스트 1', async () => {
    // 이 테스트에서 설정한 핸들러는
    server.use(http.get('/api/cards', () => HttpResponse.json([])));
    // ...
  });

  it('테스트 2', async () => {
    // 이 테스트에 영향을 주지 않음
    // 기본 핸들러가 복원됨
  });
});
```

## 다음 단계

- [엔터프라이즈 사례](./06-enterprise-practices.md) - Netflix, Airbnb의 실제 테스트 전략
