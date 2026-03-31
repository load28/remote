/**
 * =============================================================================
 * Relay Provider
 * =============================================================================
 *
 * RelayEnvironmentProvider는 React Context를 통해
 * 하위 컴포넌트들에게 Relay Environment를 제공합니다.
 *
 * Next.js App Router에서는 "use client" 디렉티브가 필요합니다.
 * → Provider는 항상 클라이언트 컴포넌트여야 합니다.
 * =============================================================================
 */
'use client';

import { ReactNode } from 'react';
import { RelayEnvironmentProvider } from 'react-relay';
import { getRelayEnvironment } from './environment';

export function RelayProvider({ children }: { children: ReactNode }) {
  const environment = getRelayEnvironment();

  return (
    <RelayEnvironmentProvider environment={environment}>
      {children}
    </RelayEnvironmentProvider>
  );
}
