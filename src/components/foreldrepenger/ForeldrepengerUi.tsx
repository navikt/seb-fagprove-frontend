import { Box, Detail, HGrid, Heading, Label, Tag, VStack } from '@navikt/ds-react';
import type { ReactNode } from 'react';
import { formatRegelresultat, formatVedtakType } from '@/lib/foreldrepengerFormat';
import type {
  Regelresultat,
  SaksbehandlerVurdering,
  Vedtak,
  VedtakType,
  VurderingStatus,
} from '@/types/foreldrepenger';

export function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Box
      background="raised"
      borderColor="neutral-subtle"
      borderRadius="2"
      borderWidth="1"
      minHeight="78px"
      padding="space-16"
    >
      <Detail uppercase>{label}</Detail>
      <Heading size="medium" level="2">
        {value}
      </Heading>
    </Box>
  );
}

export function Surface({
  children,
  ariaLive,
  contentAlign = 'stretch',
  marginInline,
  maxWidth,
}: Readonly<{
  children: ReactNode;
  ariaLive?: 'off' | 'polite' | 'assertive';
  contentAlign?: 'start' | 'center' | 'end' | 'stretch';
  marginInline?: 'auto';
  maxWidth?: string;
}>) {
  return (
    <Box
      background="raised"
      borderColor="neutral-subtle"
      borderRadius="2"
      borderWidth="1"
      padding="space-16"
      aria-live={ariaLive}
      marginInline={marginInline}
      maxWidth={maxWidth}
    >
      <VStack align={contentAlign} gap="space-16">
        {children}
      </VStack>
    </Box>
  );
}

export function FactGrid({
  children,
  compact = false,
}: Readonly<{ children: ReactNode; compact?: boolean }>) {
  return (
    <HGrid
      as="dl"
      columns={{
        xs: 1,
        md: compact
          ? 'minmax(150px, 0.75fr) minmax(0, 1.25fr)'
          : 'minmax(140px, 0.75fr) minmax(0, 1.25fr)',
      }}
      gap={compact ? 'space-8 space-16' : 'space-12 space-16'}
      margin="space-0"
    >
      {children}
    </HGrid>
  );
}

export function Fact({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <>
      <Box as="dt">
        <Detail as="span">{label}</Detail>
      </Box>
      <Box as="dd" margin="space-0" minWidth="0">
        <Label as="span" size="small">
          {value}
        </Label>
      </Box>
    </>
  );
}

export function VedtakTag({ type }: Readonly<{ type: VedtakType }>) {
  const variant =
    type === 'INNVILGET_FORELDREPENGER' ? 'success' : type === 'AVSLAG' ? 'error' : 'warning';

  return (
    <Tag size="small" variant={variant}>
      {formatVedtakType(type)}
    </Tag>
  );
}

export function CaseStatusTag({
  saksbehandlerVurdering,
  status,
  vedtak,
}: Readonly<{
  saksbehandlerVurdering?: SaksbehandlerVurdering | null;
  status?: VurderingStatus | null;
  vedtak?: Vedtak | null;
}>) {
  if (saksbehandlerVurdering) {
    return (
      <Tag size="small" variant="success">
        Vurdert manuelt
      </Tag>
    );
  }

  if (vedtak) {
    return <VedtakTag type={vedtak.type} />;
  }

  if (status?.type === 'loading') {
    return (
      <Tag size="small" variant="moderate">
        Vurderes
      </Tag>
    );
  }

  if (status?.type === 'error') {
    return (
      <Tag size="small" variant="error">
        Feil
      </Tag>
    );
  }

  return (
    <Tag size="small" variant="neutral">
      Ikke vurdert
    </Tag>
  );
}

export function RegelResultatTag({ resultat }: Readonly<{ resultat: Regelresultat }>) {
  const variant =
    resultat === 'OPPFYLT'
      ? 'success'
      : resultat === 'IKKE_OPPFYLT'
        ? 'error'
        : resultat === 'MANUELL_VURDERING'
          ? 'warning'
          : 'neutral';

  return (
    <Tag size="small" variant={variant}>
      {formatRegelresultat(resultat)}
    </Tag>
  );
}
