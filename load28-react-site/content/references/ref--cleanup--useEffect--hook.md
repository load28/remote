---
tags: [ref, cleanup, useEffect, hook, custom-hook, useCallback, state]
rules: [S-11, S-12, S-16, P-12]
description: Ref vs State 구분 — 렌더에 안 쓰이는 값 ref + cleanup 패턴
---

```tsx
// 범용 타이머/빈번 변경값 패턴

import { useState, useRef, useEffect, useCallback } from 'react';

export function useInterval(callback: () => void, delayMs: number | null) {
  // ✅ 렌더에 안 쓰이는 값 → ref (S-11)
  const savedCallback = useRef(callback);
  const intervalId = useRef<number | null>(null);

  // ✅ ref는 즉시 반영 (S-12)
  savedCallback.current = callback;

  useEffect(() => {
    if (delayMs === null) return;

    intervalId.current = window.setInterval(() => savedCallback.current(), delayMs);

    // ✅ cleanup (S-16)
    return () => {
      if (intervalId.current !== null) clearInterval(intervalId.current);
    };
  }, [delayMs]);

  const stop = useCallback(() => {
    if (intervalId.current !== null) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
  }, []);

  return { stop };
}

// 빈번 변경값: 스크롤, 마우스 좌표 등 (P-12)
export function useLatestValue<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;         // 리렌더 없이 최신 값 유지
  return ref;
}
```
