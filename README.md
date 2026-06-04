# Seb Fagprøve Frontend

Frontend for fagprøveprosjektet mitt i IT-utviklerfaget. Prosjektet er en enkel saksbehandlerflate for test-søknader om foreldrepenger.

Frontend er laget med Next.js, React, TypeScript og NAV Aksel designsystem. Den deployes til NAIS dev og kommuniserer med backend gjennom relative `/api`-kall.

Tilhørende backend: `seb-fagprove-backend`

## Brukerveiledning

Frontend brukes av en saksbehandler som skal se søknader om foreldrepenger, kontrollere søknadsdata og lese resultatet fra den automatiske vurderingen.

For å bruke frontend lokalt:

1. Start backend først:

```bash
cd seb-fagprove-backend
./gradlew run
```

2. Start frontend i en ny terminal:

```bash
cd seb-fagprove-frontend
pnpm install
pnpm dev
```

3. Åpne frontend i nettleseren:

[http://localhost:3000](http://localhost:3000)

Når siden åpnes, henter frontend søknader fra backend og sender dem til automatisk vurdering.

## Saksbehandlerflyt

1. Saksbehandler åpner applikasjonen.
2. Søknadene vises i listen til venstre.
3. Hver søknad får en status: foreldrepenger, engangsstønad, avslag eller manuell behandling.
4. Saksbehandler velger en søknad i listen.
5. Valgt søknad viser søkerdata, inntektshistorikk, beregningsgrunnlag, stønadsperiode, kvotefordeling og regelvurderinger.
6. Hvis en sak trenger manuell behandling, vises et varsel øverst på siden.
7. Knappen `Åpne saken` velger den manuelle saken.
8. Saksbehandler kan åpne `Start manuell behandling`, kontrollere grunnlaget og registrere konklusjon med begrunnelse.

Manuell vurdering lagres foreløpig bare i frontend-state. Den sendes ikke til backend ennå.

## Resultater i brukergrensesnittet

Frontend viser disse resultattypene:

- `Foreldrepenger`: søknaden er automatisk innvilget for foreldrepenger.
- `Engangsstønad`: søknaden oppfyller ikke opptjeningskravet, men kan få engangsstønad.
- `Avslag`: søknaden oppfyller ikke kravene.
- `Manuell behandling`: saken må vurderes av saksbehandler.
- `Vurdert manuelt`: saksbehandler har registrert en manuell konklusjon i frontend.

Ved lokal test av søknadene fra DigiSIS vises disse resultatene:

| Søknad | Resultat           |
| ------ | ------------------ |
| FP-001 | Foreldrepenger     |
| FP-002 | Avslag             |
| FP-003 | Engangsstønad      |
| FP-004 | Engangsstønad      |
| FP-005 | Manuell behandling |
| FP-006 | Foreldrepenger     |
| FP-007 | Foreldrepenger     |
| FP-008 | Foreldrepenger     |
| FP-009 | Engangsstønad      |
| FP-010 | Foreldrepenger     |
| FP-011 | Foreldrepenger     |
| FP-012 | Foreldrepenger     |

## Personvern i visningen

Frontend viser ikke hele fødselsnummeret i saksbehandlerflaten. Fødselsnummer maskeres slik:

```text
040590*****
```

Dette er gjort fordi applikasjonen skal vise hvordan personopplysninger kan begrenses i brukergrensesnittet, selv om datagrunnlaget er testdata.

## Fullstack-kobling

Frontend kaller backend gjennom relative API-kall:

```http
GET /api/foreldrepenger/soknader
POST /api/foreldrepenger/vurder
```

I `next.config.ts` blir `/api/:path*` sendt videre til backend:

- lokalt: `http://localhost:8080`
- på NAIS dev: `http://seb-fagprove-backend-dev`

Dette gjør at frontend-koden kan bruke samme `/api/...`-sti lokalt og i NAIS dev.

I NAIS dev blir `BACKEND_URL` sendt inn under Docker-builden fra GitHub Actions. Dette er nødvendig fordi Next.js bruker `next.config.ts` under bygging av frontend-image. Det gjør at deployet frontend-image peker på backend-service i dev, ikke på en lokal backend-adresse.

## Bygg og kvalitetssjekk

```bash
pnpm lint
pnpm build
pnpm prettier
```

`pnpm lint` sjekker kodekvalitet.
`pnpm build` kontrollerer at Next.js-applikasjonen kan bygges for produksjon.
`pnpm prettier` sjekker formatering.

For å formatere automatisk:

```bash
pnpm prettier:fix
```

## Teknologi

- Next.js 16
- React 19
- TypeScript
- NAV Aksel
- pnpm
- NAIS
- GitHub Actions

## Prosjektstruktur

```text
src/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ForeldrepengerDashboard.tsx
└── mocks/
    ├── handlers.ts
    ├── browser.ts
    ├── server.ts
    └── MSWProvider.tsx
```

## NAIS

Prosjektet deployes bare til dev i fagprøven.

- appnavn: `seb-fagprove-frontend-dev`
- cluster: `dev-gcp`
- ingress: `https://seb-fagprove-frontend-dev.intern.dev.nav.no`
- backend: `http://seb-fagprove-backend-dev`
- workflow: `.github/workflows/main.yaml`
- NAIS-fil: `.nais/app.yaml`

Dev deployes ved push til `main` eller manuelt fra GitHub Actions.

Repoet må være autorisert i Nais Console for teamet `laerlinger`.

Frontend trenger at `seb-fagprove-backend-dev` er deployet og kjører i dev. Backend må kunne hente søknader fra DigiSIS API-et, ellers vil frontend vise feilmelding når søknadene lastes.

## Avgrensninger

- Frontend er en fagprøve-løsning med testdata fra DigiSIS.
- Manuell vurdering lagres foreløpig bare lokalt i nettleseren.
- Det finnes ingen innlogging eller database i denne versjonen.
- Løsningen bruker NAV Aksel-komponenter for layout og skjemaelementer.
