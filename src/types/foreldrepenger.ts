export type Inntektstype =
  | 'ARBEID'
  | 'SYKEPENGER'
  | 'FORELDREPENGER'
  | 'SVANGERSKAPSPENGER'
  | 'DAGPENGER'
  | 'AAP'
  | 'PLEIEPENGER'
  | 'STIPEND_LANEKASSEN';

export type Rettsforhold = 'BEGGE' | 'KUN_MOR' | 'KUN_FAR';
export type Dekningsgrad = 'HUNDRE_PROSENT' | 'ATTI_PROSENT';
export type Regelresultat = 'OPPFYLT' | 'IKKE_OPPFYLT' | 'IKKE_AKTUELL' | 'MANUELL_VURDERING';
export type VedtakType =
  | 'INNVILGET_FORELDREPENGER'
  | 'ENGANGSSTONAD'
  | 'AVSLAG'
  | 'MANUELL_VURDERING';

export type Inntektsregistrering = {
  maned: string;
  type: Inntektstype;
  belop: number;
};

export type Soknad = {
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

export type Regelvurdering = {
  regel: string;
  resultat: Regelresultat;
  begrunnelse: string;
};

export type Beregningsgrunnlag = {
  arssats: number;
  oppgittArsinntekt: number;
  avvikProsent: number | null;
  grunnlagBelop: number | null;
  kreverManuellVurdering: boolean;
};

export type Stonadsperiode = {
  totalUker: number;
  rettsforhold: Rettsforhold;
  antallBarn: number;
  dekningsgrad: Dekningsgrad;
};

export type Kvoter = {
  modrekvote: number;
  fedrekvote: number;
  fellesperiode: number;
  forhandskvoteMor: number;
  flerbarnsbonus: number;
  totalUker: number;
};

export type Vedtak = {
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

export type SoknaderState =
  | { type: 'loading' }
  | { type: 'success'; soknader: Soknad[] }
  | { type: 'error'; message: string };

export type VurderingStatus = { type: 'loading' } | { type: 'error'; message: string };
export type SaksbehandlerResultat = Exclude<VedtakType, 'MANUELL_VURDERING'>;

export type SaksbehandlerVurdering = {
  resultat: SaksbehandlerResultat;
  begrunnelse: string;
};
