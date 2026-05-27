'use client';

import { Alert, BodyShort, Button, Loader } from '@navikt/ds-react';
import { useCallback, useEffect, useState } from 'react';

type BackendStatusResponse = {
  status: string;
  app: string;
  message: string;
  timestamp: string;
};

type RequestState =
  | { type: 'loading' }
  | { type: 'success'; data: BackendStatusResponse }
  | { type: 'error'; message: string };

export function BackendStatus() {
  const [state, setState] = useState<RequestState>({ type: 'loading' });

  const loadStatus = useCallback(async () => {
    setState({ type: 'loading' });

    try {
      const response = await fetch('/api/status', { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`Backend svarte med HTTP ${response.status}`);
      }

      const data = (await response.json()) as BackendStatusResponse;
      setState({ type: 'success', data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ukjent feil';
      setState({ type: 'error', message });
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  if (state.type === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Loader size="small" title="Henter backendstatus" />
        <BodyShort>Henter backendstatus</BodyShort>
      </div>
    );
  }

  if (state.type === 'error') {
    return (
      <Alert variant="error" size="small">
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <BodyShort>Kunne ikke hente backendstatus: {state.message}</BodyShort>
          <div>
            <Button size="small" variant="secondary" onClick={loadStatus}>
              Prøv igjen
            </Button>
          </div>
        </div>
      </Alert>
    );
  }

  return (
    <Alert variant="success" size="small">
      <div style={{ display: 'grid', gap: '0.25rem' }}>
        <BodyShort weight="semibold">{state.data.message}</BodyShort>
        <BodyShort size="small">
          {state.data.app} svarte {new Date(state.data.timestamp).toLocaleString('nb-NO')}
        </BodyShort>
      </div>
    </Alert>
  );
}
