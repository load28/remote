// 레퍼런스: provider--context--error-boundary.md
// S-07: 변경 빈도별 Context 분리, T-10: 앱 레벨 에러 바운더리

import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { NotificationProvider } from '@/shared/contexts/NotificationContext';

// ✅ P-03: 모듈 레벨 기본값 상수
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 2 },
    mutations: { retry: 1 },
  },
});

// ✅ T-10: 앱 레벨 에러 바운더리 (1단계: 최상위)
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50" role="alert">
          <h1 className="text-xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h1>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            다시 시도
          </button>
        </div>
      )}
    >
      <QueryClientProvider client={queryClient}>
        {/* ✅ S-07: NotificationProvider 추가 — 읽기/쓰기 분리 Context */}
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
