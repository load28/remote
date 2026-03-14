---
tags: [provider, context, error-boundary, tanstack-query, component]
rules: [S-07]
description: 다중 Provider 조합 — 변경 빈도별 Context 분리 + 에러 경계
---

```tsx
// app/providers/AppProviders.tsx
// ✅ 변경 빈도별 Context 분리 (S-07)

import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './AuthProvider';
import { ThemeProvider } from './ThemeProvider';
import { NotificationProvider } from './NotificationProvider';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 2 },
    mutations: { retry: 1 },
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary fallback={<FullPageError />}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```
