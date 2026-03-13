// shared/testing/setupMsw.ts — T-02: MSW 네트워크 레벨 모킹

import { setupServer } from 'msw/node';

export function createMockServer(...handlers: Parameters<typeof setupServer>) {
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  return server;
}
