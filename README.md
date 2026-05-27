# Seb Fagprøve Frontend

Frontend for fagprøveprosjektet med Next.js, NAV Aksel designsystem og NAIS deployment.

> Tilhørende backend: `seb-fagprove-backend`
>
> Frontend er koblet mot backend-appen `seb-fagprove-backend-dev` via `/api`.

## Bruk

Kopier filene inn i et nytt, tomt repo:

```bash
# Opprett et nytt tomt repo på GitHub
cd seb-fagprove-frontend
rm -rf .git
git init
git remote add origin git@github.com:navikt/seb-fagprove-frontend.git

# Installer avhengigheter
pnpm install

# Start utviklingsserver
pnpm dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

For å teste fullstack-koblingen lokalt må backend kjøre på [http://localhost:8080](http://localhost:8080).
Next.js videresender kall til `/api/*` videre til backend gjennom `next.config.ts`.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) med App Router
- **UI-bibliotek**: [NAV Aksel](https://aksel.nav.no/) (ds-react v8)
- **Tema**: Lys/mørk modus med next-themes
- **Mocking**: [MSW](https://mswjs.io/) (Mock Service Worker) for utvikling
- **Språk**: TypeScript 5

### Forutsetninger

- Node.js 20+
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate`)
- GitHub Personal Access Token med `read:packages` scope for `@navikt` pakker

## Prosjektstruktur

```
src/
├── app/              # Next.js App Router sider
│   ├── layout.tsx    # Root layout med Aksel + tema
│   └── page.tsx      # Startside
├── components/       # React-komponenter
│   ├── ThemeProvider.tsx  # Tema-wrapper
│   └── ThemeToggle.tsx    # Tema-bytter knapp
└── mocks/            # MSW mock-oppsett
    ├── MSWProvider.tsx    # Provider for utvikling
    ├── handlers.ts        # API mock-handlers
    └── browser.ts         # Service worker setup
```

## TODOs etter kloning

1. Bytt `seb-fagprove-frontend-dev` i `.nais/app.yaml` til endelig appnavn hvis du får et annet navn.
2. Bytt ingress-URL i `.nais/app.yaml` til samme appnavn.
3. Bytt `BACKEND_URL` og `accessPolicy.outbound.rules.application` til endelig backendnavn.
4. Bytt `image_suffix` i `.github/workflows/main.yaml` til samme frontendnavn.
5. Autoriser repoet for deploy i Nais Console.

## Fullstack-kobling

- Frontend kaller `/api/status` fra `src/components/BackendStatus.tsx`.
- `next.config.ts` proxier `/api/:path*` til `BACKEND_URL`.
- Lokalt brukes `http://localhost:8080` hvis `BACKEND_URL` ikke er satt.
- På NAIS er `BACKEND_URL` satt til `http://seb-fagprove-backend-dev`, som bruker service discovery.

## NAIS

Denne malen har et dev-oppsett i `.nais/app.yaml`:

- `metadata.name`: `seb-fagprove-frontend-dev`
- `ingress`: `https://seb-fagprove-frontend-dev.intern.dev.nav.no`
- `BACKEND_URL`: `http://seb-fagprove-backend-dev`
- outbound access policy til `seb-fagprove-backend-dev`

GitHub Actions workflowen deployer til `dev-gcp` ved push til `main` eller manuelt med `workflow_dispatch`.

## Scripts

| Kommando            | Beskrivelse            |
| ------------------- | ---------------------- |
| `pnpm dev`          | Start utviklingsserver |
| `pnpm build`        | Bygg for produksjon    |
| `pnpm start`        | Kjør produksjonsbygg   |
| `pnpm lint`         | Kjør ESLint            |
| `pnpm prettier`     | Sjekk formatering      |
| `pnpm prettier:fix` | Fiks formatering       |
