'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { Theme } from '@navikt/ds-react';
import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

function AkselThemeWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return <Theme theme="light">{children}</Theme>;
  }

  return <Theme theme={resolvedTheme === 'dark' ? 'dark' : 'light'}>{children}</Theme>;
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AkselThemeWrapper>{children}</AkselThemeWrapper>
    </NextThemesProvider>
  );
}
