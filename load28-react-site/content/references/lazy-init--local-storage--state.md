---
tags: [lazy-init, local-storage, state, useEffect, hook]
rules: [S-10, S-15]
description: Lazy State 초기화 — localStorage 동기화 + 스키마 버전 관리
---

```tsx
// 범용 localStorage 동기화 훅

const STORAGE_VERSION = 1;

export function usePersistedState<T>(key: string, defaultValue: T) {
  const versionedKey = `${key}_v${STORAGE_VERSION}`;  // ✅ 스키마 버전 (S-15)

  // ✅ lazy 초기화: 초기 렌더에서만 실행 (S-10)
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(versionedKey);
      return stored ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(versionedKey, JSON.stringify(state));
  }, [versionedKey, state]);

  return [state, setState] as const;
}
```
