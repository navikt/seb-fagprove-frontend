import { Alert, BodyShort, Box, Button, Detail, Heading, HStack, VStack } from '@navikt/ds-react';
import { RotateRightIcon, TasklistStartIcon } from '@navikt/aksel-icons';
import { CaseStatusTag } from '@/components/foreldrepenger/ForeldrepengerUi';
import {
  formatSaksforklaring,
  formatSaksnummer,
  formatSakstittel,
} from '@/lib/foreldrepengerFormat';
import type {
  SaksbehandlerVurdering,
  Soknad,
  Vedtak,
  VurderingStatus,
} from '@/types/foreldrepenger';

type ValgtSoknadHeaderProps = {
  selectedSoknad: Soknad;
  visibleVedtak?: Vedtak | null;
  selectedSaksbehandlerVurdering?: SaksbehandlerVurdering | null;
  vurderingStatus?: VurderingStatus | null;
  isVurderingLoading: boolean;
  vurderingErrorMessage?: string | null;
  onStartManuellBehandling: (soknadId: string) => void;
  onRetryVurdering: () => void;
};

export function ValgtSoknadHeader({
  selectedSoknad,
  visibleVedtak,
  selectedSaksbehandlerVurdering,
  vurderingStatus,
  isVurderingLoading,
  vurderingErrorMessage,
  onStartManuellBehandling,
  onRetryVurdering,
}: Readonly<ValgtSoknadHeaderProps>) {
  return (
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
              Sak {formatSaksnummer(selectedSoknad.id)}: {formatSakstittel(selectedSoknad)}
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
              onClick={() => onStartManuellBehandling(selectedSoknad.id)}
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
                onClick={onRetryVurdering}
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
  );
}
