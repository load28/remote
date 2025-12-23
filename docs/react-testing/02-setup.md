# 2. 테스트 환경 설정

## 패키지 설치

### 필수 패키지

```bash
# Vitest 및 React 플러그인
pnpm add -D vitest @vitejs/plugin-react jsdom

# Testing Library
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# 타입 정의
pnpm add -D @types/testing-library__jest-dom
```

### 선택 패키지

```bash
# 커버리지 리포트
pnpm add -D @vitest/coverage-v8

# UI 모드 (시각적 테스트 러너)
pnpm add -D @vitest/ui
```

## Vitest 설정

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // 테스트 환경
    environment: 'jsdom',

    // 전역 설정 파일
    setupFiles: ['./src/shared/test-utils/setup.ts'],

    // 전역 API 사용 (describe, it, expect)
    globals: true,

    // 경로 별칭 (tsconfig.json과 동일하게)
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/entities': path.resolve(__dirname, './src/entities'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/widgets': path.resolve(__dirname, './src/widgets'),
    },

    // 테스트 파일 패턴
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // 제외 패턴
    exclude: ['node_modules', 'dist', '.next'],

    // 커버리지 설정
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/shared/test-utils/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
});
```

### TypeScript 설정 (tsconfig.json)

```json
{
  "compilerOptions": {
    // ... 기존 설정
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

## 테스트 유틸리티 설정

### setup.ts

```typescript
// src/shared/test-utils/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './msw-server';

// MSW 서버 설정
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
```

### msw-server.ts

```typescript
// src/shared/test-utils/msw-server.ts
import { setupServer } from 'msw/node';
import { handlers } from '@/shared/api/msw/handlers';

// Node.js 환경용 MSW 서버
export const server = setupServer(...handlers);
```

### render.tsx (커스텀 렌더 함수)

```typescript
// src/shared/test-utils/render.tsx
import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';

// 테스트용 QueryClient 생성
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,           // 테스트에서 재시도 비활성화
        gcTime: Infinity,       // 가비지 컬렉션 비활성화
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

// 테스트용 Providers
function AllTheProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        {children}
      </JotaiProvider>
    </QueryClientProvider>
  );
}

// 커스텀 렌더 함수
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// re-export everything
export * from '@testing-library/react';
export { customRender as render };
```

### index.ts (테스트 유틸리티 export)

```typescript
// src/shared/test-utils/index.ts
export * from './render';
export { server } from './msw-server';
export { default as userEvent } from '@testing-library/user-event';
```

## package.json 스크립트

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

## MSW Node 설정

MSW를 테스트에서 사용하려면 Node.js용 설정이 필요합니다.

### handlers 재사용

```typescript
// src/shared/api/msw/handlers/index.ts
// 기존 핸들러를 그대로 사용
import { authHandlers } from './auth';
import { boardHandlers } from './boards';
import { columnHandlers } from './columns';
import { cardHandlers } from './cards';

export const handlers = [
  ...authHandlers,
  ...boardHandlers,
  ...columnHandlers,
  ...cardHandlers,
];
```

### 테스트별 핸들러 오버라이드

```typescript
// 특정 테스트에서 핸들러 오버라이드
import { http, HttpResponse } from 'msw';
import { server } from '@/shared/test-utils';

it('에러 상황을 처리한다', async () => {
  // 이 테스트에서만 에러 응답 반환
  server.use(
    http.get('/api/boards', () => {
      return HttpResponse.json(
        { message: 'Internal Server Error' },
        { status: 500 }
      );
    })
  );

  // 에러 처리 테스트...
});
```

## 디렉토리 구조

```
src/
└── shared/
    └── test-utils/
        ├── index.ts          # 메인 export
        ├── setup.ts          # 전역 설정
        ├── render.tsx        # 커스텀 렌더 함수
        ├── msw-server.ts     # MSW Node 서버
        └── mocks/            # 테스트용 mock 데이터
            ├── user.ts
            ├── board.ts
            └── card.ts
```

## 에디터 설정

### VSCode 설정 (.vscode/settings.json)

```json
{
  "vitest.enable": true,
  "vitest.commandLine": "pnpm test"
}
```

### VSCode 확장 프로그램

- **Vitest** - 테스트 러너 통합
- **Testing Library Snippets** - 코드 스니펫

## 트러블슈팅

### 1. ESM 관련 오류

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    deps: {
      inline: ['@some-esm-package'],
    },
  },
});
```

### 2. Next.js 컴포넌트 오류

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    alias: {
      // Next.js 모듈 모킹
      'next/navigation': path.resolve(__dirname, './src/shared/test-utils/mocks/next-navigation.ts'),
      'next/image': path.resolve(__dirname, './src/shared/test-utils/mocks/next-image.ts'),
    },
  },
});
```

### 3. next/navigation 모킹

```typescript
// src/shared/test-utils/mocks/next-navigation.ts
import { vi } from 'vitest';

export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}));

export const usePathname = vi.fn(() => '/');
export const useSearchParams = vi.fn(() => new URLSearchParams());
export const useParams = vi.fn(() => ({}));
export const redirect = vi.fn();
export const notFound = vi.fn();
```

## 다음 단계

- [단위 테스트](./03-unit-testing.md) - 컴포넌트, 훅 테스트 작성법
- [통합 테스트](./04-integration-testing.md) - MSW를 활용한 API 테스트
