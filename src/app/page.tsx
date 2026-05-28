import { BodyLong, Heading } from '@navikt/ds-react';
import { BackendStatus } from '@/components/BackendStatus';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <main
      style={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
      }}
    >
      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <ThemeToggle />
      </div>
      <Heading size="xlarge">Seb fagprøve klar</Heading>
      <BodyLong>Frontend er klar til å hente data fra backend via /api.</BodyLong>
      <BackendStatus />
    </main>
  );
}
