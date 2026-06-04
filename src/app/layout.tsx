import '@navikt/ds-css';
import { MSWProvider } from '@/mocks/MSWProvider';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nb">
      <body>
        <MSWProvider>{children}</MSWProvider>
      </body>
    </html>
  );
}
