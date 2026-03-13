---
tags: [presentational, component, discriminated-union, semantic-html, aria]
rules: [C-07, C-10, N-01, N-02, N-03, N-04, T-13, T-14]
description: Presentational 컴포넌트 — discriminated union props + 시맨틱 HTML
---

```tsx
// {Feature}/components/StatusBadge.tsx

import type { ReactNode } from 'react';

// ✅ discriminated union props (T-14)
export type StatusBadgeProps =
  | { variant: 'success'; label: string }
  | { variant: 'error'; label: string; code: number }
  | { variant: 'loading' };

// ✅ PascalCase (N-01), 파일당 1 exported 컴포넌트 (C-10)
export function StatusBadge(props: StatusBadgeProps) {
  switch (props.variant) {
    case 'success':
      return <span role="status" className="badge-success">{props.label}</span>;
    case 'error':
      return (
        <span role="alert" className="badge-error">
          [{props.code}] {props.label}
        </span>
      );
    case 'loading':
      return <span role="status" aria-busy="true">Loading...</span>;
  }
}
```
