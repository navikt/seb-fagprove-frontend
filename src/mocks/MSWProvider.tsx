'use client';

import { useEffect, useState, type ReactNode } from 'react';

type MSWProviderProps = {
  children: ReactNode;
};

export function MSWProvider({ children }: MSWProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initMSW() {
      if (process.env.NODE_ENV === 'development') {
        const { worker } = await import('./browser');
        await worker.start({
          onUnhandledRequest: 'bypass',
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
