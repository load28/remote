---
tags: [context, provider, generic, hook, custom-hook]
rules: [S-07, S-14]
description: 타입 안전 Context Factory — 범용 Context 생성기
---

```tsx
// shared/lib/createSafeContext.ts
// ✅ 범용 Context 생성기 — 모든 Provider에 재사용

import { createContext, useContext } from 'react';

export function createSafeContext<T>(displayName: string) {
  const Context = createContext<T | null>(null);
  Context.displayName = displayName;

  function useSafeContext(): T {
    const ctx = useContext(Context);
    if (ctx === null) {
      throw new Error(`use${displayName} must be used within ${displayName}Provider`);
    }
    return ctx;
  }

  return [Context.Provider, useSafeContext] as const;
}
```
