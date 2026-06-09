import { Box, Heading, HStack, Table, Tag } from '@navikt/ds-react';
import { RegelResultatTag, Surface } from '@/components/foreldrepenger/ForeldrepengerUi';
import { formatSynligTekst } from '@/lib/foreldrepengerFormat';
import type { Vedtak } from '@/types/foreldrepenger';

export function RegelvurderingTabell({ vedtak }: Readonly<{ vedtak: Vedtak }>) {
  return (
    <Surface>
      <HStack align="center" gap="space-12" justify="space-between" wrap>
        <Heading size="small" level="3">
          Regelvurderinger
        </Heading>
        <Tag size="small" variant="moderate">
          {vedtak.regelvurderinger.length} regler
        </Tag>
      </HStack>
      <Box overflowX="auto">
        <Table size="small" zebraStripes>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell scope="col">Regel</Table.HeaderCell>
              <Table.HeaderCell scope="col">Resultat</Table.HeaderCell>
              <Table.HeaderCell scope="col">Begrunnelse</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {vedtak.regelvurderinger.map((regel) => (
              <Table.Row key={regel.regel}>
                <Table.HeaderCell scope="row">{regel.regel}</Table.HeaderCell>
                <Table.DataCell>
                  <RegelResultatTag resultat={regel.resultat} />
                </Table.DataCell>
                <Table.DataCell>{formatSynligTekst(regel.begrunnelse)}</Table.DataCell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Box>
    </Surface>
  );
}
