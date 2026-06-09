import { Box, Heading, HStack, Table, Tag } from '@navikt/ds-react';
import { Surface } from '@/components/foreldrepenger/ForeldrepengerUi';
import {
  GODKJENTE_INNTEKTSTYPER,
  formatCurrency,
  formatInntektstype,
} from '@/lib/foreldrepengerFormat';
import type { Soknad } from '@/types/foreldrepenger';

export function InntektshistorikkTabell({ soknad }: Readonly<{ soknad: Soknad }>) {
  return (
    <Surface>
      <HStack align="center" gap="space-12" justify="space-between" wrap>
        <Heading size="small" level="3">
          Inntektshistorikk
        </Heading>
        <Tag size="small" variant="moderate">
          {soknad.inntektshistorikk.length} måneder
        </Tag>
      </HStack>
      <Box overflowX="auto">
        <Table size="small" zebraStripes>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell scope="col">Måned</Table.HeaderCell>
              <Table.HeaderCell scope="col">Type</Table.HeaderCell>
              <Table.HeaderCell scope="col">Beløp</Table.HeaderCell>
              <Table.HeaderCell scope="col">Godkjent</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {soknad.inntektshistorikk.map((inntekt) => (
              <Table.Row key={`${inntekt.maned}-${inntekt.type}-${inntekt.belop}`}>
                <Table.HeaderCell scope="row">{inntekt.maned}</Table.HeaderCell>
                <Table.DataCell>{formatInntektstype(inntekt.type)}</Table.DataCell>
                <Table.DataCell>{formatCurrency(inntekt.belop)}</Table.DataCell>
                <Table.DataCell>
                  {GODKJENTE_INNTEKTSTYPER.includes(inntekt.type) ? 'Ja' : 'Nei'}
                </Table.DataCell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Box>
    </Surface>
  );
}
