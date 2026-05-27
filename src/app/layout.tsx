import '@navikt/ds-css';
import { MSWProvider } from '@/mocks/MSWProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nb" suppressHydrationWarning>
      <body>
        <MSWProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </MSWProvider>
      </body>
    </html>
  );
}
