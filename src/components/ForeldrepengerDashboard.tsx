'use client';

import {
  Alert,
  BodyShort,
  Box,
  Button,
  Detail,
  HGrid,
  Heading,
  HStack,
  InternalHeader,
  Label,
  Spacer,
  VStack,
} from '@navikt/ds-react';
import { TasklistStartIcon } from '@navikt/aksel-icons';
import { useEffect, useMemo, useState } from 'react';
import { Metric, Surface } from '@/components/foreldrepenger/ForeldrepengerUi';
import { ManuellBehandlingModal } from '@/components/foreldrepenger/ManuellBehandlingModal';
import { Soknadsliste } from '@/components/foreldrepenger/Soknadsliste';
import { ValgtSoknadPanel } from '@/components/foreldrepenger/ValgtSoknadPanel';
import { hentSoknader, hentVedtak } from '@/lib/foreldrepengerApi';
import { formatSaksnummer, formatVedtakType } from '@/lib/foreldrepengerFormat';
import type {
  SaksbehandlerResultat,
  SaksbehandlerVurdering,
  Soknad,
  SoknaderState,
  Vedtak,
  VurderingStatus,
} from '@/types/foreldrepenger';

const TOM_SOKNADSLISTE: Soknad[] = [];

export function ForeldrepengerDashboard() {
  const [soknaderState, setSoknaderState] = useState<SoknaderState>({ type: 'loading' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [vedtakBySoknadId, setVedtakBySoknadId] = useState<Partial<Record<string, Vedtak>>>({});
  const [vurderingStatusBySoknadId, setVurderingStatusBySoknadId] = useState<
    Partial<Record<string, VurderingStatus>>
  >({});
  const [saksbehandlerVurderingBySoknadId, setSaksbehandlerVurderingBySoknadId] = useState<
    Partial<Record<string, SaksbehandlerVurdering>>
  >({});
  const [manuellSakVarslet, setManuellSakVarslet] = useState(false);
  const [manuellModalOpen, setManuellModalOpen] = useState(false);
  const [manuellModalSoknadId, setManuellModalSoknadId] = useState<string | null>(null);
  const [manuellResultat, setManuellResultat] = useState<SaksbehandlerResultat>(
    'INNVILGET_FORELDREPENGER',
  );
  const [manuellBegrunnelse, setManuellBegrunnelse] = useState('');

  const soknader = soknaderState.type === 'success' ? soknaderState.soknader : TOM_SOKNADSLISTE;
  const selectedSoknad = useMemo(
    () => soknader.find((soknad) => soknad.id === selectedId) ?? soknader[0] ?? null,
    [selectedId, soknader],
  );
  const visibleVedtak = selectedSoknad ? vedtakBySoknadId[selectedSoknad.id] : null;
  const vurderingStatus = selectedSoknad ? vurderingStatusBySoknadId[selectedSoknad.id] : null;
  const isVurderingLoading = vurderingStatus?.type === 'loading';
  const vurderingErrorMessage = vurderingStatus?.type === 'error' ? vurderingStatus.message : null;
  const antallVurdert = Object.keys(vedtakBySoknadId).length;
  const selectedSaksbehandlerVurdering = selectedSoknad
    ? saksbehandlerVurderingBySoknadId[selectedSoknad.id]
    : null;
  const vurderteVedtak = useMemo(
    () => Object.values(vedtakBySoknadId).filter((vedtak): vedtak is Vedtak => Boolean(vedtak)),
    [vedtakBySoknadId],
  );
  const ulosteManuelleVedtak = useMemo(
    () =>
      vurderteVedtak.filter(
        (vedtak) =>
          vedtak.type === 'MANUELL_VURDERING' && !saksbehandlerVurderingBySoknadId[vedtak.soknadId],
      ),
    [saksbehandlerVurderingBySoknadId, vurderteVedtak],
  );
  const forsteUlosteManuelleVedtak = ulosteManuelleVedtak[0] ?? null;
  const sorterteSoknader = useMemo(() => {
    const ulosteManuelleSoknadIder = new Set(ulosteManuelleVedtak.map((vedtak) => vedtak.soknadId));

    return [...soknader].sort(
      (a, b) =>
        Number(ulosteManuelleSoknadIder.has(b.id)) - Number(ulosteManuelleSoknadIder.has(a.id)),
    );
  }, [soknader, ulosteManuelleVedtak]);
  const manuellModalSoknad = useMemo(
    () => soknader.find((soknad) => soknad.id === manuellModalSoknadId) ?? null,
    [manuellModalSoknadId, soknader],
  );
  const manuellModalVedtak = manuellModalSoknadId ? vedtakBySoknadId[manuellModalSoknadId] : null;

  useEffect(() => {
    let isActive = true;

    async function vurderSoknadAutomatisk(soknad: Soknad) {
      setVurderingStatusBySoknadId((current) => ({
        ...current,
        [soknad.id]: { type: 'loading' },
      }));

      try {
        const vedtak = await hentVedtak(soknad);

        if (!isActive) {
          return;
        }

        setVedtakBySoknadId((current) => ({ ...current, [soknad.id]: vedtak }));
        setVurderingStatusBySoknadId((current) => {
          const next = { ...current };
          delete next[soknad.id];
          return next;
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setVurderingStatusBySoknadId((current) => ({
          ...current,
          [soknad.id]: {
            type: 'error',
            message: error instanceof Error ? error.message : 'Ukjent feil fra backend',
          },
        }));
      }
    }

    async function lastSoknader() {
      try {
        const data = await hentSoknader();

        if (!isActive) {
          return;
        }

        setSoknaderState({ type: 'success', soknader: data });
        setSelectedId(data[0]?.id ?? null);
        setVedtakBySoknadId({});
        setVurderingStatusBySoknadId({});
        setSaksbehandlerVurderingBySoknadId({});
        setManuellSakVarslet(false);
        data.forEach((soknad) => {
          void vurderSoknadAutomatisk(soknad);
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setSoknaderState({
          type: 'error',
          message: error instanceof Error ? error.message : 'Ukjent feil ved henting av søknader',
        });
      }
    }

    lastSoknader();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!forsteUlosteManuelleVedtak || manuellSakVarslet) {
      return;
    }

    setSelectedId(forsteUlosteManuelleVedtak.soknadId);
    setManuellSakVarslet(true);
  }, [forsteUlosteManuelleVedtak, manuellSakVarslet]);

  const oppdaterVurdering = async () => {
    if (!selectedSoknad) {
      return;
    }

    setVurderingStatusBySoknadId((current) => ({
      ...current,
      [selectedSoknad.id]: { type: 'loading' },
    }));

    try {
      const vedtak = await hentVedtak(selectedSoknad);
      setVedtakBySoknadId((current) => ({ ...current, [selectedSoknad.id]: vedtak }));
      setVurderingStatusBySoknadId((current) => {
        const next = { ...current };
        delete next[selectedSoknad.id];
        return next;
      });
    } catch (error) {
      setVurderingStatusBySoknadId((current) => ({
        ...current,
        [selectedSoknad.id]: {
          type: 'error',
          message: error instanceof Error ? error.message : 'Ukjent feil fra backend',
        },
      }));
    }
  };

  const apneManuellBehandling = (soknadId: string) => {
    const existing = saksbehandlerVurderingBySoknadId[soknadId];

    setSelectedId(soknadId);
    setManuellModalSoknadId(soknadId);
    setManuellResultat(existing?.resultat ?? 'INNVILGET_FORELDREPENGER');
    setManuellBegrunnelse(existing?.begrunnelse ?? '');
    setManuellModalOpen(true);
  };

  const lukkManuellBehandling = () => {
    setManuellModalOpen(false);
    setManuellModalSoknadId(null);
  };

  const lagreManuellBehandling = () => {
    if (!manuellModalSoknadId) {
      return;
    }

    setSaksbehandlerVurderingBySoknadId((current) => ({
      ...current,
      [manuellModalSoknadId]: {
        resultat: manuellResultat,
        begrunnelse:
          manuellBegrunnelse.trim() ||
          'Saksbehandler har kontrollert saken og registrert manuell konklusjon.',
      },
    }));
    lukkManuellBehandling();
  };

  return (
    <VStack minHeight="100vh">
      <InternalHeader>
        <InternalHeader.Title as="h1">Foreldrepenger</InternalHeader.Title>
        <Spacer />
        <InternalHeader.User name="Sebastian Briglia Smedsrud" description="Saksbehandler" />
      </InternalHeader>

      <Box
        as="main"
        background="neutral-soft"
        flexGrow="1"
        padding={{ xs: 'space-12', md: 'space-16', lg: 'space-24' }}
      >
        <HStack
          as="header"
          align="start"
          gap="space-16"
          justify="space-between"
          marginBlock="space-0 space-16"
          marginInline="auto"
          maxWidth="1420px"
          wrap
        >
          <VStack gap="space-0">
            <Detail uppercase>Saksbehandling</Detail>
            <Heading size="large" level="2">
              Søknader til automatisk vurdering
            </Heading>
          </VStack>
        </HStack>

        <HGrid
          align="start"
          aria-label="Nøkkeltall"
          columns={{ xs: 1, md: 3 }}
          gap="space-12"
          marginBlock="space-0 space-16"
          marginInline="auto"
          maxWidth="1420px"
          as="section"
        >
          <Metric
            label="Søknader"
            value={soknaderState.type === 'success' ? soknader.length.toString() : 'Laster'}
          />
          <Metric
            label="Vurdert"
            value={soknaderState.type === 'success' ? `${antallVurdert}/${soknader.length}` : '-'}
          />
          <Metric
            label="Resultat"
            value={
              selectedSaksbehandlerVurdering
                ? formatVedtakType(selectedSaksbehandlerVurdering.resultat)
                : visibleVedtak
                  ? formatVedtakType(visibleVedtak.type)
                  : 'Ikke vurdert'
            }
          />
        </HGrid>

        {soknaderState.type === 'success' && forsteUlosteManuelleVedtak && (
          <Box marginBlock="space-0 space-16" marginInline="auto" maxWidth="1420px">
            <Alert variant="warning">
              <HStack align="center" gap="space-12" justify="space-between" wrap>
                <VStack gap="space-4">
                  <Label>Manuell behandling kreves</Label>
                  <BodyShort>
                    Sak {formatSaksnummer(forsteUlosteManuelleVedtak.soknadId)} må vurderes av
                    saksbehandler før saken kan avsluttes.
                  </BodyShort>
                </VStack>
                <Button
                  icon={<TasklistStartIcon aria-hidden />}
                  onClick={() => setSelectedId(forsteUlosteManuelleVedtak.soknadId)}
                  size="small"
                  variant="secondary"
                >
                  Åpne saken
                </Button>
              </HStack>
            </Alert>
          </Box>
        )}

        {soknaderState.type === 'loading' && (
          <Surface ariaLive="polite" contentAlign="center" marginInline="auto" maxWidth="1420px">
            <BodyShort>Henter søknader.</BodyShort>
          </Surface>
        )}

        {soknaderState.type === 'error' && (
          <Box marginInline="auto" maxWidth="1420px">
            <Alert variant="error">Kunne ikke hente søknader. {soknaderState.message}</Alert>
          </Box>
        )}

        {soknaderState.type === 'success' && !selectedSoknad && (
          <Surface contentAlign="center" marginInline="auto" maxWidth="1420px">
            <Heading size="small" level="2">
              Ingen søknader funnet
            </Heading>
            <BodyShort>Det finnes ingen søknader å behandle akkurat nå.</BodyShort>
          </Surface>
        )}

        {soknaderState.type === 'success' && selectedSoknad && (
          <HGrid
            align="start"
            columns={{ xs: 1, lg: 'minmax(280px, 360px) minmax(0, 1fr)' }}
            gap="space-16"
            marginInline="auto"
            maxWidth="1420px"
          >
            <Soknadsliste
              soknader={sorterteSoknader}
              selectedSoknadId={selectedSoknad.id}
              vedtakBySoknadId={vedtakBySoknadId}
              vurderingStatusBySoknadId={vurderingStatusBySoknadId}
              saksbehandlerVurderingBySoknadId={saksbehandlerVurderingBySoknadId}
              onSelectSoknad={setSelectedId}
            />

            <ValgtSoknadPanel
              selectedSoknad={selectedSoknad}
              visibleVedtak={visibleVedtak}
              selectedSaksbehandlerVurdering={selectedSaksbehandlerVurdering}
              vurderingStatus={vurderingStatus}
              isVurderingLoading={isVurderingLoading}
              vurderingErrorMessage={vurderingErrorMessage}
              onStartManuellBehandling={apneManuellBehandling}
              onRetryVurdering={oppdaterVurdering}
            />
          </HGrid>
        )}
      </Box>

      <ManuellBehandlingModal
        open={manuellModalOpen}
        soknad={manuellModalSoknad}
        vedtak={manuellModalVedtak}
        resultat={manuellResultat}
        begrunnelse={manuellBegrunnelse}
        onResultatChange={setManuellResultat}
        onBegrunnelseChange={setManuellBegrunnelse}
        onSave={lagreManuellBehandling}
        onClose={lukkManuellBehandling}
      />
    </VStack>
  );
}
