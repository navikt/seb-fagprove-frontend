'use client';

import {
  Alert,
  BodyLong,
  BodyShort,
  Box,
  Button,
  Detail,
  HGrid,
  Heading,
  HStack,
  InternalHeader,
  Label,
  Loader,
  Modal,
  Radio,
  RadioGroup,
  Spacer,
  Tag,
  Table,
  Textarea,
  VStack,
} from '@navikt/ds-react';
import { FileCheckmarkIcon, RotateRightIcon, TasklistStartIcon } from '@navikt/aksel-icons';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

type Inntektstype =
  | 'ARBEID'
  | 'SYKEPENGER'
  | 'FORELDREPENGER'
  | 'SVANGERSKAPSPENGER'
  | 'DAGPENGER'
  | 'AAP'
  | 'PLEIEPENGER'
  | 'STIPEND_LANEKASSEN';

type Rettsforhold = 'BEGGE' | 'KUN_MOR' | 'KUN_FAR';
type Dekningsgrad = 'HUNDRE_PROSENT' | 'ATTI_PROSENT';
type Regelresultat = 'OPPFYLT' | 'IKKE_OPPFYLT' | 'IKKE_AKTUELL' | 'MANUELL_VURDERING';
type VedtakType = 'INNVILGET_FORELDREPENGER' | 'ENGANGSSTONAD' | 'AVSLAG' | 'MANUELL_VURDERING';

type Inntektsregistrering = {
  maned: string;
  type: Inntektstype;
  belop: number;
};

type Soknad = {
  id: string;
  beskrivelse: string;
  fodselsnummer: string;
  erNorskBorger: boolean;
  termindato: string;
  oppgittArsinntekt: number;
  inntektshistorikk: Inntektsregistrering[];
  antallBarn: number;
  rettsforhold: Rettsforhold;
  dekningsgrad: Dekningsgrad;
};

type Regelvurdering = {
  regel: string;
  resultat: Regelresultat;
  begrunnelse: string;
};

type Beregningsgrunnlag = {
  arssats: number;
  oppgittArsinntekt: number;
  avvikProsent: number | null;
  grunnlagBelop: number | null;
  kreverManuellVurdering: boolean;
};

type Stonadsperiode = {
  totalUker: number;
  rettsforhold: Rettsforhold;
  antallBarn: number;
  dekningsgrad: Dekningsgrad;
};

type Kvoter = {
  modrekvote: number;
  fedrekvote: number;
  fellesperiode: number;
  forhandskvoteMor: number;
  flerbarnsbonus: number;
  totalUker: number;
};

type Vedtak = {
  id: string;
  soknadId: string;
  type: VedtakType;
  tittel: string;
  begrunnelse: string;
  regelvurderinger: Regelvurdering[];
  beregningsgrunnlag?: Beregningsgrunnlag | null;
  stonadsperiode?: Stonadsperiode | null;
  kvoter?: Kvoter | null;
};

type SoknaderState =
  | { type: 'loading' }
  | { type: 'success'; soknader: Soknad[] }
  | { type: 'error'; message: string };

type VurderingStatus = { type: 'loading' } | { type: 'error'; message: string };
type SaksbehandlerResultat = Exclude<VedtakType, 'MANUELL_VURDERING'>;

type SaksbehandlerVurdering = {
  resultat: SaksbehandlerResultat;
  begrunnelse: string;
};

const GODKJENTE_INNTEKTSTYPER: Inntektstype[] = [
  'ARBEID',
  'SYKEPENGER',
  'FORELDREPENGER',
  'SVANGERSKAPSPENGER',
  'DAGPENGER',
  'AAP',
  'PLEIEPENGER',
];

const TOM_SOKNADSLISTE: Soknad[] = [];

const SAKSTITLER: Record<string, string> = {
  'fp-001-happy-path': 'Full opptjening',
  'fp-002-ikke-medlem': 'Ikke medlem',
  'fp-003-for-fa-mnd': 'For kort opptjening',
  'fp-004-annualisert-under-halv-G': 'Lav beregnet årsinntekt',
  'fp-005-manuell-vurdering': 'Manuell vurdering',
  'fp-006-6G-tak': 'Inntekt over 6 G',
  'fp-007-kun-far': 'Kun far har rett',
  'fp-008-tvillinger': 'Tvillinger',
  'fp-009-stipend-lanekassen': 'Kun stipend',
  'fp-010-trillinger-80': 'Trillinger, 80 prosent',
  'fp-011-kun-mor-80': 'Kun mor har rett',
  'fp-012-oppgitt-arsinntekt-null': 'Mangler årsinntekt',
};

const SAKSFORKLARINGER: Record<string, string> = {
  'fp-001-happy-path': 'Søker har nok opptjening, norsk medlemskap og stabil inntekt.',
  'fp-002-ikke-medlem': 'Søker mangler medlemskap i folketrygden.',
  'fp-003-for-fa-mnd': 'Søker har inntekt i for få av de siste ti månedene.',
  'fp-004-annualisert-under-halv-G': 'Beregnet årsinntekt er under minstekravet på 1/2 G.',
  'fp-005-manuell-vurdering': 'Inntektsavviket er for stort og må vurderes manuelt.',
  'fp-006-6G-tak': 'Søker har inntekt over 6 G. Beregningsgrunnlaget begrenses av taket.',
  'fp-007-kun-far': 'Bare far har rett til foreldrepenger i denne saken.',
  'fp-008-tvillinger': 'Søknaden gjelder tvillinger og skal gi flerbarnsbonus.',
  'fp-009-stipend-lanekassen': 'Søker har bare stipend, som ikke gir opptjening.',
  'fp-010-trillinger-80': 'Søknaden gjelder trillinger med 80 prosent dekningsgrad.',
  'fp-011-kun-mor-80': 'Bare mor har rett til foreldrepenger med 80 prosent dekningsgrad.',
  'fp-012-oppgitt-arsinntekt-null': 'Søker mangler oppgitt årsinntekt.',
};

async function hentVedtak(soknad: Soknad): Promise<Vedtak> {
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

    async function hentSoknader() {
      try {
        const response = await fetch('/api/foreldrepenger/soknader');

        if (!response.ok) {
          throw new Error(`Backend svarte med HTTP ${response.status}`);
        }

        const data = (await response.json()) as Soknad[];

        if (!Array.isArray(data)) {
          throw new Error('Backend returnerte ikke en liste med søknader');
        }

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

    hentSoknader();

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
            <Loader size="medium" title="Henter søknader" />
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
            <Box
              as="aside"
              aria-label="Søknadsliste"
              background="raised"
              borderColor="neutral-subtle"
              borderRadius="2"
              borderWidth="1"
              padding="space-16"
            >
              <VStack gap="space-12">
                <HStack align="center" gap="space-12" justify="space-between">
                  <Heading size="small" level="2">
                    Saker
                  </Heading>
                  <Tag size="small" variant="neutral">
                    {soknader.length}
                  </Tag>
                </HStack>
                <VStack gap="space-8">
                  {sorterteSoknader.map((soknad) => {
                    const vedtak = vedtakBySoknadId[soknad.id];
                    const status = vurderingStatusBySoknadId[soknad.id];
                    const saksbehandlerVurdering = saksbehandlerVurderingBySoknadId[soknad.id];
                    const isSelected = soknad.id === selectedSoknad.id;

                    return (
                      <Box
                        as="button"
                        background={isSelected ? 'accent-moderate' : 'default'}
                        borderColor={isSelected ? 'accent' : 'neutral-subtle'}
                        borderRadius="2"
                        borderWidth="1"
                        data-selected={isSelected}
                        key={soknad.id}
                        onClick={() => {
                          setSelectedId(soknad.id);
                        }}
                        padding="space-12"
                        type="button"
                        width="100%"
                      >
                        <VStack align="stretch" gap="space-4">
                          <HStack align="center" justify="space-between" gap="space-8">
                            <Detail align="start" textColor="subtle">
                              {formatSaksnummer(soknad.id)}
                            </Detail>
                            <CaseStatusTag
                              status={status}
                              vedtak={vedtak}
                              saksbehandlerVurdering={saksbehandlerVurdering}
                            />
                          </HStack>
                          <BodyShort align="start" weight="semibold">
                            {formatSakstittel(soknad)}
                          </BodyShort>
                          <Detail align="start" textColor="subtle">
                            {maskerFodselsnummer(soknad.fodselsnummer)} · Termin{' '}
                            {formatDate(soknad.termindato)} ·{' '}
                            {formatRettsforhold(soknad.rettsforhold)}
                          </Detail>
                        </VStack>
                      </Box>
                    );
                  })}
                </VStack>
              </VStack>
            </Box>

            <VStack gap="space-16" as="section" aria-label="Valgt søknad">
              <Box
                background="raised"
                borderColor="neutral-subtle"
                borderRadius="2"
                borderWidth="1"
                padding="space-16"
              >
                <HStack align="start" gap="space-12" justify="space-between" wrap>
                  <VStack gap="space-4" minWidth="0">
                    <Detail uppercase>Valgt søknad</Detail>
                    <HStack align="center" gap="space-8" wrap>
                      <Heading size="medium" level="2">
                        Sak {formatSaksnummer(selectedSoknad.id)}:{' '}
                        {formatSakstittel(selectedSoknad)}
                      </Heading>
                      <CaseStatusTag
                        status={vurderingStatus}
                        vedtak={visibleVedtak}
                        saksbehandlerVurdering={selectedSaksbehandlerVurdering}
                      />
                    </HStack>
                    <BodyShort textColor="subtle">{formatSaksforklaring(selectedSoknad)}</BodyShort>
                  </VStack>
                  <HStack gap="space-12" wrap>
                    {visibleVedtak?.type === 'MANUELL_VURDERING' && (
                      <Button
                        icon={<TasklistStartIcon aria-hidden />}
                        onClick={() => apneManuellBehandling(selectedSoknad.id)}
                        size="small"
                        variant={selectedSaksbehandlerVurdering ? 'secondary' : 'primary'}
                      >
                        {selectedSaksbehandlerVurdering
                          ? 'Endre manuell vurdering'
                          : 'Start manuell behandling'}
                      </Button>
                    )}
                    {vurderingErrorMessage && (
                      <>
                        <Button
                          icon={<RotateRightIcon aria-hidden />}
                          loading={isVurderingLoading}
                          size="small"
                          variant="secondary"
                          onClick={oppdaterVurdering}
                        >
                          Prøv igjen
                        </Button>
                        <Alert size="small" variant="warning">
                          Kunne ikke kjøre automatisk vurdering. {vurderingErrorMessage}
                        </Alert>
                      </>
                    )}
                  </HStack>
                </HStack>
              </Box>

              <HGrid
                align="start"
                columns={{ xs: 1, lg: 'minmax(330px, 0.95fr) minmax(420px, 1.05fr)' }}
                gap="space-16"
              >
                <Surface>
                  <Heading size="small" level="3">
                    Søker og søknad
                  </Heading>
                  <FactGrid>
                    <Fact
                      label="Fødselsnummer"
                      value={maskerFodselsnummer(selectedSoknad.fodselsnummer)}
                    />
                    <Fact
                      label="Norsk borger"
                      value={selectedSoknad.erNorskBorger ? 'Ja' : 'Nei'}
                    />
                    <Fact label="Termindato" value={formatDate(selectedSoknad.termindato)} />
                    <Fact
                      label="Oppgitt årsinntekt"
                      value={formatCurrency(selectedSoknad.oppgittArsinntekt)}
                    />
                    <Fact label="Barn" value={selectedSoknad.antallBarn.toString()} />
                    <Fact label="Rett" value={formatRettsforhold(selectedSoknad.rettsforhold)} />
                    <Fact
                      label="Dekningsgrad"
                      value={formatDekningsgrad(selectedSoknad.dekningsgrad)}
                    />
                  </FactGrid>
                </Surface>

                <Surface>
                  <HStack align="center" gap="space-12" justify="space-between" wrap>
                    <Heading size="small" level="3">
                      Vurdering
                    </Heading>
                    {visibleVedtak ? (
                      <VedtakTag type={visibleVedtak.type} />
                    ) : (
                      <Tag size="small" variant="neutral">
                        Ikke vurdert
                      </Tag>
                    )}
                  </HStack>
                  {visibleVedtak ? (
                    <>
                      <FactGrid compact>
                        <Fact label="Saksnummer" value={formatSaksnummer(visibleVedtak.soknadId)} />
                        <Fact label="Resultat" value={formatVedtakType(visibleVedtak.type)} />
                        <Fact
                          label="Regler vurdert"
                          value={visibleVedtak.regelvurderinger.length.toString()}
                        />
                        <Fact
                          label="Behandling"
                          value={
                            selectedSaksbehandlerVurdering
                              ? 'Vurdert av saksbehandler'
                              : visibleVedtak.type === 'MANUELL_VURDERING'
                                ? 'Må behandles manuelt'
                                : 'Automatisk vurdert'
                          }
                        />
                      </FactGrid>
                      {visibleVedtak.type === 'MANUELL_VURDERING' &&
                        (selectedSaksbehandlerVurdering ? (
                          <Alert variant="success">
                            <VStack gap="space-4">
                              <Label>Manuell vurdering er registrert</Label>
                              <BodyShort>
                                Konklusjon:{' '}
                                {formatVedtakType(selectedSaksbehandlerVurdering.resultat)}.
                              </BodyShort>
                              <BodyShort>{selectedSaksbehandlerVurdering.begrunnelse}</BodyShort>
                            </VStack>
                          </Alert>
                        ) : (
                          <Alert variant="warning">
                            Saken venter på manuell konklusjon fra saksbehandler.
                          </Alert>
                        ))}
                      <BodyLong>{formatSynligTekst(visibleVedtak.begrunnelse)}</BodyLong>
                    </>
                  ) : (
                    <BodyLong>
                      {isVurderingLoading
                        ? 'Automatisk vurdering kjøres.'
                        : 'Vurderingen er ikke klar ennå.'}
                    </BodyLong>
                  )}
                </Surface>
              </HGrid>

              {visibleVedtak && (
                <HGrid align="start" columns={{ xs: 1, lg: 3 }} gap="space-16">
                  {visibleVedtak.beregningsgrunnlag && (
                    <Surface>
                      <Heading size="small" level="3">
                        Beregningsgrunnlag
                      </Heading>
                      <FactGrid compact>
                        <Fact
                          label="Årssats"
                          value={formatCurrency(visibleVedtak.beregningsgrunnlag.arssats)}
                        />
                        <Fact
                          label="Oppgitt årsinntekt"
                          value={formatCurrency(visibleVedtak.beregningsgrunnlag.oppgittArsinntekt)}
                        />
                        <Fact
                          label="Avvik"
                          value={formatAvvik(visibleVedtak.beregningsgrunnlag.avvikProsent)}
                        />
                        <Fact
                          label="Grunnlag"
                          value={formatOptionalCurrency(
                            visibleVedtak.beregningsgrunnlag.grunnlagBelop,
                          )}
                        />
                        <Fact
                          label="Manuell vurdering"
                          value={formatJaNei(
                            visibleVedtak.beregningsgrunnlag.kreverManuellVurdering,
                          )}
                        />
                      </FactGrid>
                    </Surface>
                  )}

                  {visibleVedtak.stonadsperiode && (
                    <Surface>
                      <Heading size="small" level="3">
                        Stønadsperiode
                      </Heading>
                      <FactGrid compact>
                        <Fact
                          label="Total periode"
                          value={`${visibleVedtak.stonadsperiode.totalUker} uker`}
                        />
                        <Fact
                          label="Rett"
                          value={formatRettsforhold(visibleVedtak.stonadsperiode.rettsforhold)}
                        />
                        <Fact
                          label="Barn"
                          value={visibleVedtak.stonadsperiode.antallBarn.toString()}
                        />
                        <Fact
                          label="Dekningsgrad"
                          value={formatDekningsgrad(visibleVedtak.stonadsperiode.dekningsgrad)}
                        />
                      </FactGrid>
                    </Surface>
                  )}

                  {visibleVedtak.kvoter && (
                    <Surface>
                      <Heading size="small" level="3">
                        Kvotefordeling
                      </Heading>
                      <FactGrid compact>
                        <Fact
                          label="Mødrekvote"
                          value={`${visibleVedtak.kvoter.modrekvote} uker`}
                        />
                        <Fact
                          label="Fedrekvote"
                          value={`${visibleVedtak.kvoter.fedrekvote} uker`}
                        />
                        <Fact
                          label="Fellesperiode"
                          value={`${visibleVedtak.kvoter.fellesperiode} uker`}
                        />
                        <Fact
                          label="Forhåndskvote mor"
                          value={`${visibleVedtak.kvoter.forhandskvoteMor} uker`}
                        />
                        <Fact
                          label="Flerbarnsbonus"
                          value={`${visibleVedtak.kvoter.flerbarnsbonus} uker`}
                        />
                        <Fact label="Sum" value={`${visibleVedtak.kvoter.totalUker} uker`} />
                      </FactGrid>
                    </Surface>
                  )}
                </HGrid>
              )}

              {visibleVedtak && (
                <Surface>
                  <HStack align="center" gap="space-12" justify="space-between" wrap>
                    <Heading size="small" level="3">
                      Regelvurderinger
                    </Heading>
                    <Tag size="small" variant="moderate">
                      {visibleVedtak.regelvurderinger.length} regler
                    </Tag>
                  </HStack>
                  <Box overflowX="auto">
                    <Table size="small" zebraStripes>
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell scope="col">Regel</Table.HeaderCell>
                          <Table.HeaderCell scope="col">Resultat</Table.HeaderCell>
                          <Table.HeaderCell scope="col">Begrunnelse</Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {visibleVedtak.regelvurderinger.map((regel) => (
                          <Table.Row key={regel.regel}>
                            <Table.HeaderCell scope="row">{regel.regel}</Table.HeaderCell>
                            <Table.DataCell>
                              <RegelResultatTag resultat={regel.resultat} />
                            </Table.DataCell>
                            <Table.DataCell>{formatSynligTekst(regel.begrunnelse)}</Table.DataCell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </Box>
                </Surface>
              )}

              <Surface>
                <HStack align="center" gap="space-12" justify="space-between" wrap>
                  <Heading size="small" level="3">
                    Inntektshistorikk
                  </Heading>
                  <Tag size="small" variant="moderate">
                    {selectedSoknad.inntektshistorikk.length} måneder
                  </Tag>
                </HStack>
                <Box overflowX="auto">
                  <Table size="small" zebraStripes>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell scope="col">Måned</Table.HeaderCell>
                        <Table.HeaderCell scope="col">Type</Table.HeaderCell>
                        <Table.HeaderCell scope="col">Beløp</Table.HeaderCell>
                        <Table.HeaderCell scope="col">Godkjent</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {selectedSoknad.inntektshistorikk.map((inntekt) => (
                        <Table.Row key={`${inntekt.maned}-${inntekt.type}-${inntekt.belop}`}>
                          <Table.HeaderCell scope="row">{inntekt.maned}</Table.HeaderCell>
                          <Table.DataCell>{formatInntektstype(inntekt.type)}</Table.DataCell>
                          <Table.DataCell>{formatCurrency(inntekt.belop)}</Table.DataCell>
                          <Table.DataCell>
                            {GODKJENTE_INNTEKTSTYPER.includes(inntekt.type) ? 'Ja' : 'Nei'}
                          </Table.DataCell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </Box>
              </Surface>
            </VStack>
          </HGrid>
        )}
      </Box>

      <Modal
        header={{
          heading: 'Manuell behandling',
          label: manuellModalSoknad ? `Sak ${formatSaksnummer(manuellModalSoknad.id)}` : undefined,
          size: 'small',
        }}
        onClose={lukkManuellBehandling}
        open={manuellModalOpen}
        placement="top"
        width="medium"
      >
        <Modal.Body>
          {manuellModalSoknad && manuellModalVedtak ? (
            <VStack gap="space-16">
              <Alert variant="warning">{formatSynligTekst(manuellModalVedtak.begrunnelse)}</Alert>
              <FactGrid compact>
                <Fact label="Saksnummer" value={formatSaksnummer(manuellModalSoknad.id)} />
                <Fact
                  label="Fødselsnummer"
                  value={maskerFodselsnummer(manuellModalSoknad.fodselsnummer)}
                />
                <Fact
                  label="Oppgitt årsinntekt"
                  value={formatCurrency(manuellModalSoknad.oppgittArsinntekt)}
                />
                <Fact
                  label="Beregnet årsinntekt"
                  value={formatOptionalCurrency(
                    manuellModalVedtak.beregningsgrunnlag?.arssats ?? null,
                  )}
                />
                <Fact
                  label="Avvik"
                  value={formatAvvik(manuellModalVedtak.beregningsgrunnlag?.avvikProsent ?? null)}
                />
                <Fact label="Rett" value={formatRettsforhold(manuellModalSoknad.rettsforhold)} />
              </FactGrid>
              <RadioGroup
                legend="Saksbehandlers konklusjon"
                onChange={(value) => setManuellResultat(value as SaksbehandlerResultat)}
                value={manuellResultat}
              >
                <Radio value="INNVILGET_FORELDREPENGER">Innvilg foreldrepenger</Radio>
                <Radio value="ENGANGSSTONAD">Innvilg engangsstønad</Radio>
                <Radio value="AVSLAG">Avslag</Radio>
              </RadioGroup>
              <Textarea
                label="Begrunnelse"
                maxLength={500}
                minRows={4}
                onChange={(event) => setManuellBegrunnelse(event.target.value)}
                value={manuellBegrunnelse}
              />
            </VStack>
          ) : (
            <BodyLong>Ingen manuell sak er valgt.</BodyLong>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button icon={<FileCheckmarkIcon aria-hidden />} onClick={lagreManuellBehandling}>
            Lagre vurdering
          </Button>
          <Button onClick={lukkManuellBehandling} variant="secondary">
            Avbryt
          </Button>
        </Modal.Footer>
      </Modal>
    </VStack>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Box
      background="raised"
      borderColor="neutral-subtle"
      borderRadius="2"
      borderWidth="1"
      minHeight="78px"
      padding="space-16"
    >
      <Detail uppercase>{label}</Detail>
      <Heading size="medium" level="2">
        {value}
      </Heading>
    </Box>
  );
}

function Surface({
  children,
  ariaLive,
  contentAlign = 'stretch',
  marginInline,
  maxWidth,
}: Readonly<{
  children: ReactNode;
  ariaLive?: 'off' | 'polite' | 'assertive';
  contentAlign?: 'start' | 'center' | 'end' | 'stretch';
  marginInline?: 'auto';
  maxWidth?: string;
}>) {
  return (
    <Box
      background="raised"
      borderColor="neutral-subtle"
      borderRadius="2"
      borderWidth="1"
      padding="space-16"
      aria-live={ariaLive}
      marginInline={marginInline}
      maxWidth={maxWidth}
    >
      <VStack align={contentAlign} gap="space-16">
        {children}
      </VStack>
    </Box>
  );
}

function FactGrid({
  children,
  compact = false,
}: Readonly<{ children: ReactNode; compact?: boolean }>) {
  return (
    <HGrid
      as="dl"
      columns={{
        xs: 1,
        md: compact
          ? 'minmax(150px, 0.75fr) minmax(0, 1.25fr)'
          : 'minmax(140px, 0.75fr) minmax(0, 1.25fr)',
      }}
      gap={compact ? 'space-8 space-16' : 'space-12 space-16'}
      margin="space-0"
    >
      {children}
    </HGrid>
  );
}

function Fact({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <>
      <Box as="dt">
        <Detail as="span">{label}</Detail>
      </Box>
      <Box as="dd" margin="space-0" minWidth="0">
        <Label as="span" size="small">
          {value}
        </Label>
      </Box>
    </>
  );
}

function VedtakTag({ type }: Readonly<{ type: VedtakType }>) {
  const variant =
    type === 'INNVILGET_FORELDREPENGER' ? 'success' : type === 'AVSLAG' ? 'error' : 'warning';

  return (
    <Tag size="small" variant={variant}>
      {formatVedtakType(type)}
    </Tag>
  );
}

function CaseStatusTag({
  saksbehandlerVurdering,
  status,
  vedtak,
}: Readonly<{
  saksbehandlerVurdering?: SaksbehandlerVurdering | null;
  status?: VurderingStatus | null;
  vedtak?: Vedtak | null;
}>) {
  if (saksbehandlerVurdering) {
    return (
      <Tag size="small" variant="success">
        Vurdert manuelt
      </Tag>
    );
  }

  if (vedtak) {
    return <VedtakTag type={vedtak.type} />;
  }

  if (status?.type === 'loading') {
    return (
      <Tag size="small" variant="moderate">
        Vurderes
      </Tag>
    );
  }

  if (status?.type === 'error') {
    return (
      <Tag size="small" variant="error">
        Feil
      </Tag>
    );
  }

  return (
    <Tag size="small" variant="neutral">
      Ikke vurdert
    </Tag>
  );
}

function RegelResultatTag({ resultat }: Readonly<{ resultat: Regelresultat }>) {
  const variant =
    resultat === 'OPPFYLT'
      ? 'success'
      : resultat === 'IKKE_OPPFYLT'
        ? 'error'
        : resultat === 'MANUELL_VURDERING'
          ? 'warning'
          : 'neutral';

  return (
    <Tag size="small" variant={variant}>
      {formatRegelresultat(resultat)}
    </Tag>
  );
}

function maskerFodselsnummer(fodselsnummer: string) {
  return `${fodselsnummer.slice(0, 6)}*****`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('nb-NO', {
    currency: 'NOK',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('nb-NO').format(new Date(value));
}

function formatSaksnummer(id: string) {
  const match = id.match(/fp-(\d+)/i);

  return match ? `FP-${match[1]}` : id.toUpperCase();
}

function formatSakstittel(soknad: Soknad) {
  return SAKSTITLER[soknad.id] ?? formatSakstittelFraBeskrivelse(soknad.beskrivelse);
}

function formatSaksforklaring(soknad: Soknad) {
  return SAKSFORKLARINGER[soknad.id] ?? formatSynligTekst(soknad.beskrivelse);
}

function formatSakstittelFraBeskrivelse(value: string) {
  const title = value
    .replace(/^Happy path:\s*/i, '')
    .split(/[—→]/)[0]
    .trim();

  return truncate(title || value, 84);
}

function formatSynligTekst(value: string) {
  return value
    .replace(/\bSoker\b/g, 'Søker')
    .replace(/\bsoker\b/g, 'søker')
    .replace(/\bma\b/g, 'må')
    .replace(/\bfa\b/g, 'få')
    .replace(/\bmaneder\b/g, 'måneder')
    .replace(/\bvilkarene\b/g, 'vilkårene')
    .replace(/\bvilkar\b/g, 'vilkår')
    .replace(/\barssats\b/g, 'årssats')
    .replace(/\bstonadsperiode\b/g, 'stønadsperiode')
    .replace(/\bengangsstonad\b/g, 'engangsstønad')
    .replace(/\bannualisert\b/g, 'beregnet årsinntekt');
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function formatVedtakType(type: VedtakType) {
  const labels: Record<VedtakType, string> = {
    AVSLAG: 'Avslag',
    ENGANGSSTONAD: 'Engangsstønad',
    INNVILGET_FORELDREPENGER: 'Foreldrepenger',
    MANUELL_VURDERING: 'Manuell behandling',
  };

  return labels[type];
}

function formatRegelresultat(resultat: Regelresultat) {
  const labels: Record<Regelresultat, string> = {
    IKKE_AKTUELL: 'Ikke aktuell',
    IKKE_OPPFYLT: 'Ikke oppfylt',
    MANUELL_VURDERING: 'Manuell vurdering',
    OPPFYLT: 'Oppfylt',
  };

  return labels[resultat];
}

function formatRettsforhold(value: Rettsforhold) {
  const labels: Record<Rettsforhold, string> = {
    BEGGE: 'Begge foreldre',
    KUN_FAR: 'Kun far',
    KUN_MOR: 'Kun mor',
  };

  return labels[value];
}

function formatDekningsgrad(value: Dekningsgrad) {
  return value === 'HUNDRE_PROSENT' ? '100 prosent' : '80 prosent';
}

function formatAvvik(value: number | null) {
  if (value === null) {
    return 'Ikke beregnet';
  }

  return `${new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 }).format(value)} prosent`;
}

function formatOptionalCurrency(value: number | null) {
  return value === null ? 'Ikke beregnet' : formatCurrency(value);
}

function formatJaNei(value: boolean) {
  return value ? 'Ja' : 'Nei';
}

function formatInntektstype(value: Inntektstype) {
  const labels: Record<Inntektstype, string> = {
    AAP: 'AAP',
    ARBEID: 'Arbeid',
    DAGPENGER: 'Dagpenger',
    FORELDREPENGER: 'Foreldrepenger',
    PLEIEPENGER: 'Pleiepenger',
    STIPEND_LANEKASSEN: 'Stipend Lånekassen',
    SVANGERSKAPSPENGER: 'Svangerskapspenger',
    SYKEPENGER: 'Sykepenger',
  };

  return labels[value];
}
