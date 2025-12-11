'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface MSWProviderProps {
  children: ReactNode;
}

export function MSWProvider({ children }: MSWProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initMSW() {
      if (typeof window !== 'undefined') {
        const { worker } = await import('./browser');
        await worker.start({
          onUnhandledRequest: 'bypass',
          quiet: true,
        });
      }
      setIsReady(true);
    }

    initMSW();
  }, []);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
