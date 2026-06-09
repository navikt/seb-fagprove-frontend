import { HGrid, VStack } from '@navikt/ds-react';
import { InntektshistorikkTabell } from '@/components/foreldrepenger/InntektshistorikkTabell';
import { RegelvurderingTabell } from '@/components/foreldrepenger/RegelvurderingTabell';
import { SoknadDetaljer } from '@/components/foreldrepenger/SoknadDetaljer';
import { ValgtSoknadHeader } from '@/components/foreldrepenger/ValgtSoknadHeader';
import { VedtakDetaljer } from '@/components/foreldrepenger/VedtakDetaljer';
import { Vurderingspanel } from '@/components/foreldrepenger/Vurderingspanel';
import type {
  SaksbehandlerVurdering,
  Soknad,
  Vedtak,
  VurderingStatus,
} from '@/types/foreldrepenger';

type ValgtSoknadPanelProps = {
  selectedSoknad: Soknad;
  visibleVedtak?: Vedtak | null;
  selectedSaksbehandlerVurdering?: SaksbehandlerVurdering | null;
  vurderingStatus?: VurderingStatus | null;
  isVurderingLoading: boolean;
  vurderingErrorMessage?: string | null;
  onStartManuellBehandling: (soknadId: string) => void;
  onRetryVurdering: () => void;
};

export function ValgtSoknadPanel({
  selectedSoknad,
  visibleVedtak,
  selectedSaksbehandlerVurdering,
  vurderingStatus,
  isVurderingLoading,
  vurderingErrorMessage,
  onStartManuellBehandling,
  onRetryVurdering,
}: Readonly<ValgtSoknadPanelProps>) {
  return (
    <VStack gap="space-16" as="section" aria-label="Valgt søknad">
      <ValgtSoknadHeader
        selectedSoknad={selectedSoknad}
        visibleVedtak={visibleVedtak}
        selectedSaksbehandlerVurdering={selectedSaksbehandlerVurdering}
        vurderingStatus={vurderingStatus}
        isVurderingLoading={isVurderingLoading}
        vurderingErrorMessage={vurderingErrorMessage}
        onStartManuellBehandling={onStartManuellBehandling}
        onRetryVurdering={onRetryVurdering}
      />

      <HGrid
        align="start"
        columns={{ xs: 1, lg: 'minmax(330px, 0.95fr) minmax(420px, 1.05fr)' }}
        gap="space-16"
      >
        <SoknadDetaljer soknad={selectedSoknad} />
        <Vurderingspanel
          visibleVedtak={visibleVedtak}
          selectedSaksbehandlerVurdering={selectedSaksbehandlerVurdering}
          isVurderingLoading={isVurderingLoading}
        />
      </HGrid>

      {visibleVedtak && <VedtakDetaljer vedtak={visibleVedtak} />}
      {visibleVedtak && <RegelvurderingTabell vedtak={visibleVedtak} />}
      <InntektshistorikkTabell soknad={selectedSoknad} />
    </VStack>
  );
}
