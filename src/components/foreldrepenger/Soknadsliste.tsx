import { BodyShort, Box, Detail, Heading, HStack, Tag, VStack } from '@navikt/ds-react';
import { CaseStatusTag } from '@/components/foreldrepenger/ForeldrepengerUi';
import {
  formatDate,
  formatRettsforhold,
  formatSaksnummer,
  formatSakstittel,
  maskerFodselsnummer,
} from '@/lib/foreldrepengerFormat';
import type {
  SaksbehandlerVurdering,
  Soknad,
  Vedtak,
  VurderingStatus,
} from '@/types/foreldrepenger';

type SoknadslisteProps = {
  soknader: Soknad[];
  selectedSoknadId: string;
  vedtakBySoknadId: Partial<Record<string, Vedtak>>;
  vurderingStatusBySoknadId: Partial<Record<string, VurderingStatus>>;
  saksbehandlerVurderingBySoknadId: Partial<Record<string, SaksbehandlerVurdering>>;
  onSelectSoknad: (soknadId: string) => void;
};

export function Soknadsliste({
  soknader,
  selectedSoknadId,
  vedtakBySoknadId,
  vurderingStatusBySoknadId,
  saksbehandlerVurderingBySoknadId,
  onSelectSoknad,
}: Readonly<SoknadslisteProps>) {
  return (
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
          {soknader.map((soknad) => {
            const vedtak = vedtakBySoknadId[soknad.id];
            const status = vurderingStatusBySoknadId[soknad.id];
            const saksbehandlerVurdering = saksbehandlerVurderingBySoknadId[soknad.id];
            const isSelected = soknad.id === selectedSoknadId;

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
                  onSelectSoknad(soknad.id);
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
                    {formatDate(soknad.termindato)} · {formatRettsforhold(soknad.rettsforhold)}
                  </Detail>
                </VStack>
              </Box>
            );
          })}
        </VStack>
      </VStack>
    </Box>
  );
}
