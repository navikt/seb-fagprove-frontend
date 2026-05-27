'use client';

import { useTheme } from 'next-themes';
import { Button, Tooltip } from '@navikt/ds-react';
import { SunIcon, MoonIcon } from '@navikt/aksel-icons';
import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <Button
        variant="tertiary-neutral"
        size="small"
        icon={<SunIcon aria-hidden />}
        aria-label="Bytt tema"
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  const cycleTheme = () => {
    if (theme === 'system') {
      setTheme(isDark ? 'light' : 'dark');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  const getTooltipText = () => {
    if (theme === 'system') {
      return `System (${isDark ? 'mørk' : 'lys'}) - klikk for å bytte`;
    }
    return isDark ? 'Bytt til lyst tema' : 'Bytt til mørkt tema';
  };

  return (
    <Tooltip content={getTooltipText()}>
      <Button
        variant="tertiary-neutral"
        size="small"
        icon={isDark ? <MoonIcon aria-hidden /> : <SunIcon aria-hidden />}
        onClick={cycleTheme}
        aria-label={getTooltipText()}
      />
    </Tooltip>
  );
}
