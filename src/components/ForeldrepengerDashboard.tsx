'use client';

import {
  Alert,
  BodyLong,
  BodyShort,
  Button,
  Detail,
  Heading,
  HStack,
  Label,
  Loader,
  Panel,
  Tag,
  Table,
  Textarea,
  Tooltip,
} from '@navikt/ds-react';
import {
  CalculatorIcon,
  CheckmarkCircleIcon,
  FileSearchIcon,
  PaperplaneIcon,
  XMarkOctagonIcon,
} from '@navikt/aksel-icons';
import { useMemo, useState } from 'react';
import { BackendStatus } from '@/components/BackendStatus';
import { ThemeToggle } from '@/components/ThemeToggle';

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
  fnr: string;
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

type Vedtak = {
  id: string;
  soknadId: string;
  type: VedtakType;
  tittel: string;
  begrunnelse: string;
  regelvurderinger: Regelvurdering[];
};

type BackendState =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; vedtak: Vedtak }
  | { type: 'error'; message: string };

const HALV_G_2025 = 65_080;
const KRAV_TIL_MANEDER = 6;
const OPPTJENINGSPERIODE = 10;

const GODKJENTE_INNTEKTSTYPER: Inntektstype[] = [
  'ARBEID',
  'SYKEPENGER',
  'FORELDREPENGER',
  'SVANGERSKAPSPENGER',
  'DAGPENGER',
  'AAP',
  'PLEIEPENGER',
];

const SOKNADER: Soknad[] = [
  {
    id: 'FP-001',
    beskrivelse: 'Fast arbeid, stabil inntekt',
    fnr: '04059012377',
    erNorskBorger: true,
    termindato: '2026-08-15',
    oppgittArsinntekt: 540_000,
    inntektshistorikk: lagInntektshistorikk('ARBEID', 45_000),
    antallBarn: 1,
    rettsforhold: 'BEGGE',
    dekningsgrad: 'HUNDRE_PROSENT',
  },
  {
    id: 'FP-002',
    beskrivelse: 'Kort opptjening, norsk borger',
    fnr: '11088845601',
    erNorskBorger: true,
    termindato: '2026-09-01',
    oppgittArsinntekt: 200_000,
    inntektshistorikk: lagInntektshistorikk('ARBEID', 50_000, 4, 5),
    antallBarn: 1,
    rettsforhold: 'KUN_MOR',
    dekningsgrad: 'HUNDRE_PROSENT',
  },
  {
    id: 'FP-003',
    beskrivelse: 'Ikke norsk borger',
    fnr: '22047778912',
    erNorskBorger: false,
    termindato: '2026-10-20',
    oppgittArsinntekt: 600_000,
    inntektshistorikk: lagInntektshistorikk('ARBEID', 50_000),
    antallBarn: 2,
    rettsforhold: 'BEGGE',
    dekningsgrad: 'ATTI_PROSENT',
  },
  {
    id: 'FP-004',
    beskrivelse: 'Kun stipend fra Lånekassen',
    fnr: '30019532109',
    erNorskBorger: true,
    termindato: '2026-11-05',
    oppgittArsinntekt: 144_000,
    inntektshistorikk: lagInntektshistorikk('STIPEND_LANEKASSEN', 12_000),
    antallBarn: 1,
    rettsforhold: 'KUN_FAR',
    dekningsgrad: 'HUNDRE_PROSENT',
  },
];

export function ForeldrepengerDashboard() {
  const [selectedId, setSelectedId] = useState(SOKNADER[0].id);
  const [backendState, setBackendState] = useState<BackendState>({ type: 'idle' });

  const selectedSoknad = SOKNADER.find((soknad) => soknad.id === selectedId) ?? SOKNADER[0];
  const localVedtak = useMemo(() => vurderLokalt(selectedSoknad), [selectedSoknad]);
  const visibleVedtak = backendState.type === 'success' ? backendState.vedtak : localVedtak;

  const runBackendVurdering = async () => {
    setBackendState({ type: 'loading' });

    try {
      const response = await fetch('/api/foreldrepenger/vurder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedSoknad),
      });

      if (!response.ok) {
        throw new Error(`Backend svarte med HTTP ${response.status}`);
      }

      const vedtak = (await response.json()) as Vedtak;
      setBackendState({ type: 'success', vedtak });
    } catch (error) {
      setBackendState({
        type: 'error',
        message: error instanceof Error ? error.message : 'Ukjent feil fra backend',
      });
    }
  };

  return (
    <main className="fp-shell">
      <header className="fp-header">
        <div>
          <Detail uppercase>Foreldrepenger</Detail>
          <Heading size="large" level="1">
            Saksbehandling
          </Heading>
        </div>
        <div className="fp-header__tools">
          <BackendStatus />
          <ThemeToggle />
        </div>
      </header>

      <section className="fp-metrics" aria-label="Nøkkeltall">
        <Metric label="Søknader" value={SOKNADER.length.toString()} />
        <Metric label="Valgt sak" value={selectedSoknad.id} />
        <Metric label="Foreløpig vedtak" value={formatVedtakType(visibleVedtak.type)} />
      </section>

      <div className="fp-layout">
        <aside className="fp-sidebar" aria-label="Søknadsliste">
          <div className="fp-section-heading">
            <Heading size="small" level="2">
              Søknader
            </Heading>
            <Tag size="small" variant="moderate">
              Lokal testdata
            </Tag>
          </div>
          <div className="fp-case-list">
            {SOKNADER.map((soknad) => {
              const vedtak = vurderLokalt(soknad);
              const isSelected = soknad.id === selectedSoknad.id;

              return (
                <button
                  className="fp-case-row"
                  data-selected={isSelected}
                  key={soknad.id}
                  onClick={() => {
                    setSelectedId(soknad.id);
                    setBackendState({ type: 'idle' });
                  }}
                  type="button"
                >
                  <span>
                    <span className="fp-case-row__id">{soknad.id}</span>
                    <span className="fp-case-row__text">{soknad.beskrivelse}</span>
                  </span>
                  <VedtakTag type={vedtak.type} />
                </button>
              );
            })}
          </div>
        </aside>

        <section className="fp-main" aria-label="Valgt søknad">
          <div className="fp-main__top">
            <div>
              <Detail uppercase>{selectedSoknad.id}</Detail>
              <Heading size="medium" level="2">
                {selectedSoknad.beskrivelse}
              </Heading>
            </div>
            <HStack gap="space-12" wrap>
              <Button
                icon={<CalculatorIcon aria-hidden />}
                size="small"
                variant="secondary"
                onClick={() => setBackendState({ type: 'idle' })}
              >
                Lokal vurdering
              </Button>
              <Button
                icon={<PaperplaneIcon aria-hidden />}
                loading={backendState.type === 'loading'}
                size="small"
                onClick={runBackendVurdering}
              >
                Send til backend
              </Button>
            </HStack>
          </div>

          <div className="fp-content-grid">
            <Panel className="fp-panel">
              <Heading size="small" level="3">
                Søknadsdata
              </Heading>
              <dl className="fp-facts">
                <Fact label="Fødselsnummer" value={maskFnr(selectedSoknad.fnr)} />
                <Fact label="Norsk borger" value={selectedSoknad.erNorskBorger ? 'Ja' : 'Nei'} />
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
              </dl>
            </Panel>

            <Panel className="fp-panel fp-panel--result">
              <div className="fp-result-title">
                <Heading size="small" level="3">
                  Vedtak
                </Heading>
                <VedtakTag type={visibleVedtak.type} />
              </div>
              <BodyLong>{visibleVedtak.begrunnelse}</BodyLong>
              <div className="fp-rule-list">
                {visibleVedtak.regelvurderinger.map((regel) => (
                  <div className="fp-rule" key={regel.regel}>
                    <ResultIcon resultat={regel.resultat} />
                    <div>
                      <Label>{regel.regel}</Label>
                      <BodyShort size="small">{regel.begrunnelse}</BodyShort>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel className="fp-panel">
            <div className="fp-section-heading">
              <Heading size="small" level="3">
                Inntektshistorikk
              </Heading>
              <Tag size="small" variant="moderate">
                Siste {OPPTJENINGSPERIODE} måneder
              </Tag>
            </div>
            <div className="fp-table-wrap">
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
            </div>
          </Panel>

          <Panel className="fp-panel">
            <div className="fp-section-heading">
              <Heading size="small" level="3">
                Backend
              </Heading>
              <BackendStateTag state={backendState} />
            </div>

            {backendState.type === 'loading' && (
              <div className="fp-loading">
                <Loader size="small" title="Venter på backend" />
                <BodyShort>Venter på backend</BodyShort>
              </div>
            )}

            {backendState.type === 'error' && (
              <Alert size="small" variant="warning">
                {backendState.message}
              </Alert>
            )}

            {backendState.type === 'success' && (
              <Alert size="small" variant="success">
                Backend returnerte et vedtak for {backendState.vedtak.soknadId}.
              </Alert>
            )}

            {backendState.type === 'idle' && (
              <Alert size="small" variant="info">
                Viser lokal forhåndsvurdering.
              </Alert>
            )}

            <Textarea
              label="Request"
              minRows={8}
              readOnly
              value={JSON.stringify(selectedSoknad, null, 2)}
            />
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="fp-metric">
      <Detail uppercase>{label}</Detail>
      <Heading size="medium" level="2">
        {value}
      </Heading>
    </div>
  );
}

function Fact({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
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

function BackendStateTag({ state }: Readonly<{ state: BackendState }>) {
  if (state.type === 'loading') {
    return (
      <Tag size="small" variant="info">
        Sender
      </Tag>
    );
  }

  if (state.type === 'success') {
    return (
      <Tag size="small" variant="success">
        Backend
      </Tag>
    );
  }

  if (state.type === 'error') {
    return (
      <Tag size="small" variant="warning">
        Ikke tilgjengelig
      </Tag>
    );
  }

  return (
    <Tag size="small" variant="neutral">
      Lokal
    </Tag>
  );
}

function ResultIcon({ resultat }: Readonly<{ resultat: Regelresultat }>) {
  if (resultat === 'OPPFYLT') {
    return <CheckmarkCircleIcon aria-hidden className="fp-rule__icon fp-rule__icon--success" />;
  }

  if (resultat === 'IKKE_OPPFYLT') {
    return <XMarkOctagonIcon aria-hidden className="fp-rule__icon fp-rule__icon--error" />;
  }

  return (
    <Tooltip content="Manuell vurdering">
      <FileSearchIcon aria-hidden className="fp-rule__icon fp-rule__icon--warning" />
    </Tooltip>
  );
}

function vurderLokalt(soknad: Soknad): Vedtak {
  const opptjeningsperiode = soknad.inntektshistorikk
    .toSorted((a, b) => a.maned.localeCompare(b.maned))
    .slice(-OPPTJENINGSPERIODE);
  const godkjentInntekt = opptjeningsperiode.filter(
    (inntekt) => GODKJENTE_INNTEKTSTYPER.includes(inntekt.type) && inntekt.belop > 0,
  );
  const godkjenteManeder = new Set(godkjentInntekt.map((inntekt) => inntekt.maned)).size;
  const annualisertInntekt = Math.round(
    (godkjentInntekt.reduce((sum, inntekt) => sum + inntekt.belop, 0) * 12) / OPPTJENINGSPERIODE,
  );
  const harNokManeder = godkjenteManeder >= KRAV_TIL_MANEDER;
  const harNokInntekt = annualisertInntekt >= HALV_G_2025;
  const opptjeningOppfylt = soknad.erNorskBorger && harNokManeder && harNokInntekt;

  const regelvurderinger: Regelvurdering[] = [
    {
      regel: 'Medlemskap i folketrygden',
      resultat: soknad.erNorskBorger ? 'OPPFYLT' : 'IKKE_OPPFYLT',
      begrunnelse: soknad.erNorskBorger
        ? 'Søker er norsk borger i testdataene.'
        : 'Søker er ikke norsk borger i testdataene.',
    },
    {
      regel: 'Opptjening 6 av 10 måneder',
      resultat: harNokManeder ? 'OPPFYLT' : 'IKKE_OPPFYLT',
      begrunnelse: `${godkjenteManeder} av ${OPPTJENINGSPERIODE} måneder har godkjent inntekt.`,
    },
    {
      regel: 'Inntekt over 1/2G',
      resultat: harNokInntekt ? 'OPPFYLT' : 'IKKE_OPPFYLT',
      begrunnelse: `Annualisert inntekt er ${formatCurrency(annualisertInntekt)}. Kravet er ${formatCurrency(HALV_G_2025)}.`,
    },
  ];

  if (opptjeningOppfylt) {
    return {
      id: `vedtak-${soknad.id}`,
      soknadId: soknad.id,
      type: 'INNVILGET_FORELDREPENGER',
      tittel: 'Innvilget foreldrepenger',
      begrunnelse: 'Søknaden oppfyller den lokale forhåndsvurderingen for foreldrepenger.',
      regelvurderinger,
    };
  }

  if (soknad.erNorskBorger) {
    return {
      id: `vedtak-${soknad.id}`,
      soknadId: soknad.id,
      type: 'ENGANGSSTONAD',
      tittel: 'Innvilget engangsstønad',
      begrunnelse: 'Opptjeningskravet er ikke oppfylt, men søker kan vurderes for engangsstønad.',
      regelvurderinger: [
        ...regelvurderinger,
        {
          regel: 'Engangsstønad',
          resultat: 'OPPFYLT',
          begrunnelse: 'Søker oppfyller forenklet medlemskapskrav.',
        },
      ],
    };
  }

  return {
    id: `vedtak-${soknad.id}`,
    soknadId: soknad.id,
    type: 'AVSLAG',
    tittel: 'Avslag',
    begrunnelse: 'Søker oppfyller verken vilkårene for foreldrepenger eller engangsstønad.',
    regelvurderinger: [
      ...regelvurderinger,
      {
        regel: 'Engangsstønad',
        resultat: 'IKKE_OPPFYLT',
        begrunnelse: 'Søker oppfyller ikke forenklet medlemskapskrav.',
      },
    ],
  };
}

function lagInntektshistorikk(
  type: Inntektstype,
  belop: number,
  antallManeder = OPPTJENINGSPERIODE,
  startManed = 1,
): Inntektsregistrering[] {
  return Array.from({ length: antallManeder }, (_, index) => ({
    maned: `2026-${(startManed + index).toString().padStart(2, '0')}`,
    type,
    belop,
  }));
}

function maskFnr(fnr: string) {
  return `${fnr.slice(0, 6)}*****`;
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

function formatVedtakType(type: VedtakType) {
  const labels: Record<VedtakType, string> = {
    AVSLAG: 'Avslag',
    ENGANGSSTONAD: 'Engangsstønad',
    INNVILGET_FORELDREPENGER: 'Foreldrepenger',
    MANUELL_VURDERING: 'Manuell',
  };

  return labels[type];
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
