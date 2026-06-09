import {
  Alert,
  BodyLong,
  Button,
  Modal,
  Radio,
  RadioGroup,
  Textarea,
  VStack,
} from '@navikt/ds-react';
import { FileCheckmarkIcon } from '@navikt/aksel-icons';
import { Fact, FactGrid } from '@/components/foreldrepenger/ForeldrepengerUi';
import {
  formatAvvik,
  formatCurrency,
  formatOptionalCurrency,
  formatRettsforhold,
  formatSaksnummer,
  formatSynligTekst,
  maskerFodselsnummer,
} from '@/lib/foreldrepengerFormat';
import type { SaksbehandlerResultat, Soknad, Vedtak } from '@/types/foreldrepenger';

type ManuellBehandlingModalProps = {
  open: boolean;
  soknad?: Soknad | null;
  vedtak?: Vedtak | null;
  resultat: SaksbehandlerResultat;
  begrunnelse: string;
  onResultatChange: (resultat: SaksbehandlerResultat) => void;
  onBegrunnelseChange: (begrunnelse: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export function ManuellBehandlingModal({
  open,
  soknad,
  vedtak,
  resultat,
  begrunnelse,
  onResultatChange,
  onBegrunnelseChange,
  onSave,
  onClose,
}: Readonly<ManuellBehandlingModalProps>) {
  return (
    <Modal
      header={{
        heading: 'Manuell behandling',
        label: soknad ? `Sak ${formatSaksnummer(soknad.id)}` : undefined,
        size: 'small',
      }}
      onClose={onClose}
      open={open}
      placement="top"
      width="medium"
    >
      <Modal.Body>
        {soknad && vedtak ? (
          <VStack gap="space-16">
            <Alert variant="warning">{formatSynligTekst(vedtak.begrunnelse)}</Alert>
            <FactGrid compact>
              <Fact label="Saksnummer" value={formatSaksnummer(soknad.id)} />
              <Fact label="Fødselsnummer" value={maskerFodselsnummer(soknad.fodselsnummer)} />
              <Fact label="Oppgitt årsinntekt" value={formatCurrency(soknad.oppgittArsinntekt)} />
              <Fact
                label="Beregnet årsinntekt"
                value={formatOptionalCurrency(vedtak.beregningsgrunnlag?.arssats ?? null)}
              />
              <Fact
                label="Avvik"
                value={formatAvvik(vedtak.beregningsgrunnlag?.avvikProsent ?? null)}
              />
              <Fact label="Rett" value={formatRettsforhold(soknad.rettsforhold)} />
            </FactGrid>
            <RadioGroup
              legend="Saksbehandlers konklusjon"
              onChange={(value) => onResultatChange(value as SaksbehandlerResultat)}
              value={resultat}
            >
              <Radio value="INNVILGET_FORELDREPENGER">Innvilg foreldrepenger</Radio>
              <Radio value="ENGANGSSTONAD">Innvilg engangsstønad</Radio>
              <Radio value="AVSLAG">Avslag</Radio>
            </RadioGroup>
            <Textarea
              label="Begrunnelse"
              maxLength={500}
              minRows={4}
              onChange={(event) => onBegrunnelseChange(event.target.value)}
              value={begrunnelse}
            />
          </VStack>
        ) : (
          <BodyLong>Ingen manuell sak er valgt.</BodyLong>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button icon={<FileCheckmarkIcon aria-hidden />} onClick={onSave}>
          Lagre vurdering
        </Button>
        <Button onClick={onClose} variant="secondary">
          Avbryt
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
