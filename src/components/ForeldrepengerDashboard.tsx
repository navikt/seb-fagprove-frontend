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
import { useEffect, useMemo, useState } from 'react';
import {
  CaseStatusTag,
  Fact,
  FactGrid,
  Metric,
  RegelResultatTag,
  Surface,
  VedtakTag,
} from '@/components/foreldrepenger/ForeldrepengerUi';
import { hentSoknader, hentVedtak } from '@/lib/foreldrepengerApi';
import {
  GODKJENTE_INNTEKTSTYPER,
  formatAvvik,
  formatCurrency,
  formatDate,
  formatDekningsgrad,
  formatInntektstype,
  formatJaNei,
  formatOptionalCurrency,
  formatRettsforhold,
  formatSaksforklaring,
  formatSaksnummer,
  formatSakstittel,
  formatSynligTekst,
  formatVedtakType,
  maskerFodselsnummer,
} from '@/lib/foreldrepengerFormat';
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
