---
tags: [context, provider, useMemo, useCallback, state, hook]
rules: [S-07, S-14]
description: 분리된 Context Provider — 읽기/쓰기 Context 분리 + 안정 참조
---

```tsx
// app/providers/AuthProvider.tsx

import { useState, useMemo, useCallback } from 'react';
import type { PropsWithChildren } from 'react';
import { createSafeContext } from '@/shared/lib/createSafeContext';

interface AuthState {
  userId: string | null;
  role: 'admin' | 'member' | 'guest';
}

interface AuthActions {
  signIn: (userId: string, role: AuthState['role']) => void;
  signOut: () => void;
}

// ✅ 읽기/쓰기 Context 분리 → 읽기만 하는 컴포넌트는 actions 변경에 리렌더 안 됨
const [AuthStateProvider, useAuthState] = createSafeContext<AuthState>('AuthState');
const [AuthActionsProvider, useAuthActions] = createSafeContext<AuthActions>('AuthActions');

export { useAuthState, useAuthActions };

export function AuthProvider({ children }: PropsWithChildren) {
  const [auth, setAuth] = useState<AuthState>({ userId: null, role: 'guest' });

  // ✅ actions는 useCallback으로 안정 참조 (S-14)
  const signIn = useCallback((userId: string, role: AuthState['role']) => {
    setAuth({ userId, role });
  }, []);

  const signOut = useCallback(() => {
    setAuth({ userId: null, role: 'guest' });
  }, []);

  // ✅ Provider value useMemo (S-14)
  const stateValue = useMemo(() => auth, [auth]);
  const actionsValue = useMemo(() => ({ signIn, signOut }), [signIn, signOut]);

  return (
    <AuthStateProvider value={stateValue}>
      <AuthActionsProvider value={actionsValue}>
        {children}
      </AuthActionsProvider>
    </AuthStateProvider>
  );
}
```
