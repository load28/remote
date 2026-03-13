---
tags: [dynamic-import, suspense, lazy-loading, code-splitting, state]
rules: [P-08, P-04]
description: Dynamic Import + Suspense — 무거운 컴포넌트 lazy 분리
---

```tsx
// ✅ 무거운 컴포넌트를 lazy로 분리 — 메인 번들 축소

import { lazy, Suspense, useState } from 'react';

// 코드 스플리팅: 필요 시에만 로드
const RichTextEditor = lazy(() => import('../components/RichTextEditor'));
const ChartPanel = lazy(() => import('../components/ChartPanel'));
const PDFExporter = lazy(() => import('../components/PDFExporter'));

export function DashboardPage() {
  const [activePanel, setActivePanel] = useState<string | null>(null);

  return (
    <main>
      <nav>
        <button onClick={() => setActivePanel('editor')}>에디터</button>
        <button onClick={() => setActivePanel('chart')}>차트</button>
        <button onClick={() => setActivePanel('pdf')}>PDF</button>
      </nav>

      {/* ✅ 삼항 연산자 조건부 렌더 (P-04) */}
      {activePanel === 'editor' ? (
        <Suspense fallback={<PanelSkeleton />}>
          <RichTextEditor />
        </Suspense>
      ) : null}

      {activePanel === 'chart' ? (
        <Suspense fallback={<PanelSkeleton />}>
          <ChartPanel />
        </Suspense>
      ) : null}

      {activePanel === 'pdf' ? (
        <Suspense fallback={<PanelSkeleton />}>
          <PDFExporter />
        </Suspense>
      ) : null}
    </main>
  );
}
```
