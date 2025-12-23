# 4. 통합 테스트

## 통합 테스트란?

**여러 유닛(컴포넌트, 훅, API 호출)이 함께 동작**하는지 검증합니다. Kent C. Dodds의 Testing Trophy에 따르면, 통합 테스트는 **가장 높은 ROI(투자 대비 효과)**를 제공합니다.

> "Write tests. Not too many. Mostly integration."
> — Kent C. Dodds

## MSW를 활용한 API 모킹

### MSW(Mock Service Worker)의 장점

| 장점 | 설명 |
|------|------|
| **네트워크 레벨 모킹** | fetch, axios 등 라이브러리에 무관 |
| **실제 요청과 동일** | 브라우저 DevTools에서 확인 가능 |
| **핸들러 재사용** | 개발/테스트 환경에서 동일한 핸들러 사용 |
| **타입 안전성** | TypeScript와 완벽 호환 |

### 기본 설정

```typescript
// src/shared/test-utils/msw-server.ts
import { setupServer } from 'msw/node';
import { handlers } from '@/shared/api/msw/handlers';

export const server = setupServer(...handlers);
```

```typescript
// src/shared/test-utils/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './msw-server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
```

## 데이터 Fetching 테스트

### React Query와 함께 사용

```tsx
// src/features/board-list/ui/BoardList.tsx
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query';

interface Board {
  id: string;
  title: string;
}

async function fetchBoards(): Promise<Board[]> {
  const response = await fetch('/api/boards');
  if (!response.ok) throw new Error('Failed to fetch boards');
  return response.json();
}

export function BoardList() {
  const { data: boards, isLoading, error } = useQuery({
    queryKey: queryKeys.boards.all,
    queryFn: fetchBoards,
  });

  if (isLoading) return <div role="progressbar">로딩 중...</div>;
  if (error) return <div role="alert">에러가 발생했습니다</div>;

  return (
    <ul>
      {boards?.map((board) => (
        <li key={board.id}>{board.title}</li>
      ))}
    </ul>
  );
}
```

```tsx
// src/features/board-list/ui/BoardList.test.tsx
import { render, screen, waitFor } from '@/shared/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/shared/test-utils';
import { BoardList } from './BoardList';

describe('BoardList', () => {
  it('보드 목록을 렌더링한다', async () => {
    render(<BoardList />);

    // 로딩 상태 확인
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // 데이터 로드 대기
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // 보드 목록 확인 (MSW의 기본 핸들러 데이터)
    expect(screen.getByText('My First Board')).toBeInTheDocument();
  });

  it('에러 발생 시 에러 메시지를 표시한다', async () => {
    // 이 테스트에서만 에러 응답 반환
    server.use(
      http.get('/api/boards', () => {
        return HttpResponse.json(
          { message: 'Internal Server Error' },
          { status: 500 }
        );
      })
    );

    render(<BoardList />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText('에러가 발생했습니다')).toBeInTheDocument();
  });

  it('빈 목록을 처리한다', async () => {
    server.use(
      http.get('/api/boards', () => {
        return HttpResponse.json([]);
      })
    );

    render(<BoardList />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
```

## Mutation 테스트

```tsx
// src/features/create-card/model/useCreateCard.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query';

interface CreateCardData {
  title: string;
  description: string;
  columnId: string;
  boardId: string;
}

async function createCard(data: CreateCardData) {
  const response = await fetch(
    `/api/boards/${data.boardId}/columns/${data.columnId}/cards`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) throw new Error('Failed to create card');
  return response.json();
}

export function useCreateCard(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) });
    },
  });
}
```

```tsx
// src/features/create-card/ui/CreateCardDialog.test.tsx
import { render, screen, waitFor } from '@/shared/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/shared/test-utils';
import { CreateCardDialog } from './CreateCardDialog';

describe('CreateCardDialog', () => {
  const defaultProps = {
    boardId: 'board-1',
    columnId: 'column-1',
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('카드 생성 성공 시 다이얼로그를 닫는다', async () => {
    const user = userEvent.setup();
    render(<CreateCardDialog {...defaultProps} />);

    await user.type(screen.getByLabelText('제목'), '새 카드');
    await user.type(screen.getByLabelText('설명'), '카드 설명');
    await user.click(screen.getByRole('button', { name: '생성' }));

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('카드 생성 실패 시 에러를 표시한다', async () => {
    server.use(
      http.post('/api/boards/:boardId/columns/:columnId/cards', () => {
        return HttpResponse.json(
          { message: 'Failed to create card' },
          { status: 400 }
        );
      })
    );

    const user = userEvent.setup();
    render(<CreateCardDialog {...defaultProps} />);

    await user.type(screen.getByLabelText('제목'), '새 카드');
    await user.click(screen.getByRole('button', { name: '생성' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('생성 중에는 버튼이 비활성화된다', async () => {
    // 지연된 응답
    server.use(
      http.post('/api/boards/:boardId/columns/:columnId/cards', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ id: 'new-card' });
      })
    );

    const user = userEvent.setup();
    render(<CreateCardDialog {...defaultProps} />);

    await user.type(screen.getByLabelText('제목'), '새 카드');
    await user.click(screen.getByRole('button', { name: '생성' }));

    expect(screen.getByRole('button', { name: '생성' })).toBeDisabled();

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
```

## 인증 플로우 테스트

```tsx
// src/features/auth/ui/LoginForm.test.tsx
import { render, screen, waitFor } from '@/shared/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/shared/test-utils';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('로그인 성공 시 리다이렉트한다', async () => {
    const mockOnSuccess = vi.fn();
    const user = userEvent.setup();

    render(<LoginForm onSuccess={mockOnSuccess} />);

    await user.type(screen.getByLabelText('이메일'), 'demo@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'demo1234');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('잘못된 자격증명 시 에러를 표시한다', async () => {
    server.use(
      http.post('/api/auth/callback/credentials', () => {
        return HttpResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      })
    );

    const user = userEvent.setup();
    render(<LoginForm onSuccess={vi.fn()} />);

    await user.type(screen.getByLabelText('이메일'), 'wrong@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(screen.getByText(/잘못된 자격증명/i)).toBeInTheDocument();
    });
  });
});
```

## 핸들러 팩토리 패턴

재사용 가능한 핸들러 생성기를 만들어 테스트 코드를 간결하게 합니다:

```typescript
// src/shared/test-utils/handlers/board-handlers.ts
import { http, HttpResponse, delay } from 'msw';

interface Board {
  id: string;
  title: string;
}

export const boardHandlerFactories = {
  // 성공 응답
  success: (boards: Board[]) =>
    http.get('/api/boards', () => HttpResponse.json(boards)),

  // 에러 응답
  error: (status: number, message: string) =>
    http.get('/api/boards', () =>
      HttpResponse.json({ message }, { status })
    ),

  // 지연 응답
  delayed: (boards: Board[], ms: number) =>
    http.get('/api/boards', async () => {
      await delay(ms);
      return HttpResponse.json(boards);
    }),

  // 네트워크 에러
  networkError: () =>
    http.get('/api/boards', () => HttpResponse.error()),
};
```

```tsx
// 테스트에서 사용
import { boardHandlerFactories } from '@/shared/test-utils/handlers';

it('느린 네트워크에서도 동작한다', async () => {
  server.use(
    boardHandlerFactories.delayed([{ id: '1', title: 'Board' }], 1000)
  );
  // ...
});

it('네트워크 에러를 처리한다', async () => {
  server.use(boardHandlerFactories.networkError());
  // ...
});
```

## 테스트 데이터 빌더

```typescript
// src/shared/test-utils/builders/card-builder.ts
import { v4 as uuid } from 'uuid';

interface Card {
  id: string;
  title: string;
  description: string;
  columnId: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export function buildCard(overrides: Partial<Card> = {}): Card {
  return {
    id: uuid(),
    title: 'Test Card',
    description: 'Test Description',
    columnId: 'column-1',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildCards(count: number, overrides: Partial<Card> = {}): Card[] {
  return Array.from({ length: count }, (_, i) =>
    buildCard({ title: `Card ${i + 1}`, ...overrides })
  );
}
```

```tsx
// 테스트에서 사용
import { buildCard, buildCards } from '@/shared/test-utils/builders';

it('카드 목록을 렌더링한다', async () => {
  const cards = buildCards(5, { priority: 'high' });

  server.use(
    http.get('/api/cards', () => HttpResponse.json(cards))
  );

  // ...
});
```

## 커스텀 렌더 함수

```tsx
// src/shared/test-utils/render.tsx
import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialQueryData?: Record<string, unknown>;
}

function createTestQueryClient(initialData?: Record<string, unknown>) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  // 초기 데이터 설정
  if (initialData) {
    Object.entries(initialData).forEach(([key, data]) => {
      client.setQueryData([key], data);
    });
  }

  return client;
}

function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { initialQueryData, ...renderOptions } = options;
  const queryClient = createTestQueryClient(initialQueryData);

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <JotaiProvider>{children}</JotaiProvider>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

export * from '@testing-library/react';
export { customRender as render };
```

## 다음 단계

- [테스트 패턴](./05-testing-patterns.md) - FSD 아키텍처 기반 테스트 패턴
- [엔터프라이즈 사례](./06-enterprise-practices.md) - 실제 기업의 테스트 전략
