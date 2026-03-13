// 레퍼런스: context--provider--generic.md
// S-07: 타입 안전 Context Factory — 범용 Context 생성기

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
