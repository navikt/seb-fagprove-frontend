import { HGrid, Heading } from '@navikt/ds-react';
import { Fact, FactGrid, Surface } from '@/components/foreldrepenger/ForeldrepengerUi';
import {
  formatAvvik,
  formatCurrency,
  formatDekningsgrad,
  formatJaNei,
  formatOptionalCurrency,
  formatRettsforhold,
} from '@/lib/foreldrepengerFormat';
import type { Vedtak } from '@/types/foreldrepenger';

export function VedtakDetaljer({ vedtak }: Readonly<{ vedtak: Vedtak }>) {
  return (
    <HGrid align="start" columns={{ xs: 1, lg: 3 }} gap="space-16">
      {vedtak.beregningsgrunnlag && (
        <Surface>
          <Heading size="small" level="3">
            Beregningsgrunnlag
          </Heading>
          <FactGrid compact>
            <Fact label="Årssats" value={formatCurrency(vedtak.beregningsgrunnlag.arssats)} />
            <Fact
              label="Oppgitt årsinntekt"
              value={formatCurrency(vedtak.beregningsgrunnlag.oppgittArsinntekt)}
            />
            <Fact label="Avvik" value={formatAvvik(vedtak.beregningsgrunnlag.avvikProsent)} />
            <Fact
              label="Grunnlag"
              value={formatOptionalCurrency(vedtak.beregningsgrunnlag.grunnlagBelop)}
            />
            <Fact
              label="Manuell vurdering"
              value={formatJaNei(vedtak.beregningsgrunnlag.kreverManuellVurdering)}
            />
          </FactGrid>
        </Surface>
      )}

      {vedtak.stonadsperiode && (
        <Surface>
          <Heading size="small" level="3">
            Stønadsperiode
          </Heading>
          <FactGrid compact>
            <Fact label="Total periode" value={`${vedtak.stonadsperiode.totalUker} uker`} />
            <Fact label="Rett" value={formatRettsforhold(vedtak.stonadsperiode.rettsforhold)} />
            <Fact label="Barn" value={vedtak.stonadsperiode.antallBarn.toString()} />
            <Fact
              label="Dekningsgrad"
              value={formatDekningsgrad(vedtak.stonadsperiode.dekningsgrad)}
            />
          </FactGrid>
        </Surface>
      )}

      {vedtak.kvoter && (
        <Surface>
          <Heading size="small" level="3">
            Kvotefordeling
          </Heading>
          <FactGrid compact>
            <Fact label="Mødrekvote" value={`${vedtak.kvoter.modrekvote} uker`} />
            <Fact label="Fedrekvote" value={`${vedtak.kvoter.fedrekvote} uker`} />
            <Fact label="Fellesperiode" value={`${vedtak.kvoter.fellesperiode} uker`} />
            <Fact label="Forhåndskvote mor" value={`${vedtak.kvoter.forhandskvoteMor} uker`} />
            <Fact label="Flerbarnsbonus" value={`${vedtak.kvoter.flerbarnsbonus} uker`} />
            <Fact label="Sum" value={`${vedtak.kvoter.totalUker} uker`} />
          </FactGrid>
        </Surface>
      )}
    </HGrid>
  );
}
