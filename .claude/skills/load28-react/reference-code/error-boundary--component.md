---
tags: [error-boundary, component, children-composition]
rules: [T-10]
description: 3단계 에러 바운더리 — 앱/라우트/위젯 레벨 에러 격리
---

```tsx
// shared/components/ErrorBoundary.tsx

import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';

export interface ErrorBoundaryProps extends PropsWithChildren {
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      const { fallback } = this.props;
      return typeof fallback === 'function'
        ? fallback(this.state.error, this.reset)
        : fallback;
    }
    return this.props.children;
  }
}
```

```tsx
// ✅ 3단계 배치: 에러 영향 범위 최소화 (T-10)

// 1단계: 앱 레벨
<ErrorBoundary fallback={<FullPageError />} onError={reportToMonitoring}>
  <App />
</ErrorBoundary>

// 2단계: 라우트 레벨
<ErrorBoundary fallback={(error, reset) => (
  <section role="alert">
    <p>페이지를 불러올 수 없습니다</p>
    <button onClick={reset}>다시 시도</button>
  </section>
)}>
  <Outlet />
</ErrorBoundary>

// 3단계: 위젯 레벨
<ErrorBoundary fallback={<p>이 섹션을 불러올 수 없습니다</p>}>
  <CommentSection />
</ErrorBoundary>
```
