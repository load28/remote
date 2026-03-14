---
tags: [msw, mock, integration-test, hook]
rules: [T-02]
description: MSW 네트워크 모킹 — 범용 mock server 설정 + 핸들러 오버라이드
---

```tsx
// shared/testing/setupMsw.ts — 범용 MSW 설정

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// ✅ 도메인 비종속: 핸들러를 외부에서 주입
export function createMockServer(...handlers: Parameters<typeof setupServer>) {
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  return server;
}

// 사용: Feature별 테스트에서
import { createMockServer } from '@/shared/testing/setupMsw';

const server = createMockServer(
  http.get('/api/entities', () => HttpResponse.json(mockEntities)),
  http.post('/api/entities', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 'new-1', ...body }, { status: 201 });
  }),
);

// 개별 테스트에서 핸들러 오버라이드
test('handles server error', async () => {
  server.use(
    http.get('/api/entities', () => HttpResponse.json(null, { status: 500 })),
  );
  // ...
});
```
