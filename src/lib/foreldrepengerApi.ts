import type { Soknad, Vedtak } from '@/types/foreldrepenger';

export async function hentSoknader(): Promise<Soknad[]> {
  const response = await fetch('/api/foreldrepenger/soknader');

  if (!response.ok) {
    throw new Error(`Backend svarte med HTTP ${response.status}`);
  }

  const data = (await response.json()) as unknown;

  if (!Array.isArray(data)) {
    throw new Error('Backend returnerte ikke en liste med søknader');
  }

  return data as Soknad[];
}

export async function hentVedtak(soknad: Soknad): Promise<Vedtak> {
  const response = await fetch('/api/foreldrepenger/vurder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(soknad),
  });

  if (!response.ok) {
    throw new Error(`Backend svarte med HTTP ${response.status}`);
  }

  return (await response.json()) as Vedtak;
}
