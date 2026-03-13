---
tags: [cleanup, useEffect, event-listener, abort, web-socket, intersection-observer, resize-observer, state, ref]
rules: [S-16]
description: useEffect Cleanup 총정리 — 7가지 cleanup 패턴 (타이머, 리스너, 구독, fetch, WS, IO, RO)
---

```tsx
// ✅ 모든 cleanup 패턴 — 복사해서 사용

// 1. 타이머
useEffect(() => {
  const id = setInterval(callback, intervalMs);
  return () => clearInterval(id);
}, [callback, intervalMs]);

// 2. 이벤트 리스너
useEffect(() => {
  const handler = (e: Event) => { /* ... */ };
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);

// 3. 구독
useEffect(() => {
  const subscription = observable.subscribe(handleNext);
  return () => subscription.unsubscribe();
}, [observable, handleNext]);

// 4. fetch (AbortController)
useEffect(() => {
  const controller = new AbortController();
  fetchData(controller.signal).then(setData).catch(e => {
    if (e.name !== 'AbortError') throw e;
  });
  return () => controller.abort();
}, [fetchData]);

// 5. WebSocket
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = (e) => handleMessage(JSON.parse(e.data));
  ws.onerror = (e) => handleError(e);
  return () => {
    if (ws.readyState === WebSocket.OPEN) ws.close();
  };
}, [url]);

// 6. IntersectionObserver
useEffect(() => {
  if (!elementRef.current) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => setIsVisible(entry.isIntersecting));
  }, { threshold: 0.1 });
  observer.observe(elementRef.current);
  return () => observer.disconnect();
}, []);

// 7. ResizeObserver
useEffect(() => {
  if (!elementRef.current) return;
  const observer = new ResizeObserver(entries => {
    const { width, height } = entries[0].contentRect;
    sizeRef.current = { width, height };
  });
  observer.observe(elementRef.current);
  return () => observer.disconnect();
}, []);
```
