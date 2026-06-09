import { Heading } from '@navikt/ds-react';
import { Fact, FactGrid, Surface } from '@/components/foreldrepenger/ForeldrepengerUi';
import {
  formatCurrency,
  formatDate,
  formatDekningsgrad,
  formatRettsforhold,
  maskerFodselsnummer,
} from '@/lib/foreldrepengerFormat';
import type { Soknad } from '@/types/foreldrepenger';

export function SoknadDetaljer({ soknad }: Readonly<{ soknad: Soknad }>) {
  return (
    <Surface>
      <Heading size="small" level="3">
        Søker og søknad
      </Heading>
      <FactGrid>
        <Fact label="Fødselsnummer" value={maskerFodselsnummer(soknad.fodselsnummer)} />
        <Fact label="Norsk borger" value={soknad.erNorskBorger ? 'Ja' : 'Nei'} />
        <Fact label="Termindato" value={formatDate(soknad.termindato)} />
        <Fact label="Oppgitt årsinntekt" value={formatCurrency(soknad.oppgittArsinntekt)} />
        <Fact label="Barn" value={soknad.antallBarn.toString()} />
        <Fact label="Rett" value={formatRettsforhold(soknad.rettsforhold)} />
        <Fact label="Dekningsgrad" value={formatDekningsgrad(soknad.dekningsgrad)} />
      </FactGrid>
    </Surface>
  );
}
