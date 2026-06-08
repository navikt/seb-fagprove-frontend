import type {
  Dekningsgrad,
  Inntektstype,
  Regelresultat,
  Rettsforhold,
  Soknad,
  VedtakType,
} from '@/types/foreldrepenger';

export const GODKJENTE_INNTEKTSTYPER: Inntektstype[] = [
  'ARBEID',
  'SYKEPENGER',
  'FORELDREPENGER',
  'SVANGERSKAPSPENGER',
  'DAGPENGER',
  'AAP',
  'PLEIEPENGER',
];

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

export function maskerFodselsnummer(fodselsnummer: string) {
  return `${fodselsnummer.slice(0, 6)}*****`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('nb-NO', {
    currency: 'NOK',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('nb-NO').format(new Date(value));
}

export function formatSaksnummer(id: string) {
  const match = id.match(/fp-(\d+)/i);

  return match ? `FP-${match[1]}` : id.toUpperCase();
}

export function formatSakstittel(soknad: Soknad) {
  return SAKSTITLER[soknad.id] ?? formatSakstittelFraBeskrivelse(soknad.beskrivelse);
}

export function formatSaksforklaring(soknad: Soknad) {
  return SAKSFORKLARINGER[soknad.id] ?? formatSynligTekst(soknad.beskrivelse);
}

function formatSakstittelFraBeskrivelse(value: string) {
  const title = value
    .replace(/^Happy path:\s*/i, '')
    .split(/[—→]/)[0]
    .trim();

  return truncate(title || value, 84);
}

export function formatSynligTekst(value: string) {
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

export function formatVedtakType(type: VedtakType) {
  const labels: Record<VedtakType, string> = {
    AVSLAG: 'Avslag',
    ENGANGSSTONAD: 'Engangsstønad',
    INNVILGET_FORELDREPENGER: 'Foreldrepenger',
    MANUELL_VURDERING: 'Manuell behandling',
  };

  return labels[type];
}

export function formatRegelresultat(resultat: Regelresultat) {
  const labels: Record<Regelresultat, string> = {
    IKKE_AKTUELL: 'Ikke aktuell',
    IKKE_OPPFYLT: 'Ikke oppfylt',
    MANUELL_VURDERING: 'Manuell vurdering',
    OPPFYLT: 'Oppfylt',
  };

  return labels[resultat];
}

export function formatRettsforhold(value: Rettsforhold) {
  const labels: Record<Rettsforhold, string> = {
    BEGGE: 'Begge foreldre',
    KUN_FAR: 'Kun far',
    KUN_MOR: 'Kun mor',
  };

  return labels[value];
}

export function formatDekningsgrad(value: Dekningsgrad) {
  return value === 'HUNDRE_PROSENT' ? '100 prosent' : '80 prosent';
}

export function formatAvvik(value: number | null) {
  if (value === null) {
    return 'Ikke beregnet';
  }

  return `${new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 }).format(value)} prosent`;
}

export function formatOptionalCurrency(value: number | null) {
  return value === null ? 'Ikke beregnet' : formatCurrency(value);
}

export function formatJaNei(value: boolean) {
  return value ? 'Ja' : 'Nei';
}

export function formatInntektstype(value: Inntektstype) {
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
