import { Alert, BodyLong, BodyShort, Heading, HStack, Label, Tag, VStack } from '@navikt/ds-react';
import { Fact, FactGrid, Surface, VedtakTag } from '@/components/foreldrepenger/ForeldrepengerUi';
import { formatSaksnummer, formatSynligTekst, formatVedtakType } from '@/lib/foreldrepengerFormat';
import type { SaksbehandlerVurdering, Vedtak } from '@/types/foreldrepenger';

type VurderingspanelProps = {
  visibleVedtak?: Vedtak | null;
  selectedSaksbehandlerVurdering?: SaksbehandlerVurdering | null;
  isVurderingLoading: boolean;
};

export function Vurderingspanel({
  visibleVedtak,
  selectedSaksbehandlerVurdering,
  isVurderingLoading,
}: Readonly<VurderingspanelProps>) {
  return (
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
            <Fact label="Regler vurdert" value={visibleVedtak.regelvurderinger.length.toString()} />
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
                    Konklusjon: {formatVedtakType(selectedSaksbehandlerVurdering.resultat)}.
                  </BodyShort>
                  <BodyShort>{selectedSaksbehandlerVurdering.begrunnelse}</BodyShort>
                </VStack>
              </Alert>
            ) : (
              <Alert variant="warning">Saken venter på manuell konklusjon fra saksbehandler.</Alert>
            ))}
          <BodyLong>{formatSynligTekst(visibleVedtak.begrunnelse)}</BodyLong>
        </>
      ) : (
        <BodyLong>
          {isVurderingLoading ? 'Automatisk vurdering kjøres.' : 'Vurderingen er ikke klar ennå.'}
        </BodyLong>
      )}
    </Surface>
  );
}
