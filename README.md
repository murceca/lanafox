# Lana Fox

📸 Bilingual (`en` / `uk`) photography portfolio website for **Lana Fox** (`https://lanafox.eu`).

---

## Technology Stack

- **Language:** TypeScript (strict mode) across npm workspaces
- **Frontend:** React 19 + Next.js 16 App Router (`output: 'export'` static HTML export)
- **Styling:** Modern CSS Modules, CSS Grid/Flexbox, reduced-motion support
- **Images & Gallery:** Cloudinary responsive delivery + `sharp` build-time AVIF/WebP local derivatives
- **API Service:** Framework-agnostic TypeScript API (`@lanafox/api`) with shared Zod runtime contracts (`@lanafox/contracts`), HMAC fingerprinting, 24-hour idempotency, and hourly rate limits (`10/hour` global, `3/hour` per sender)
- **Runtime:** Node.js 24 LTS (pinned via [`.nvmrc`](.nvmrc))
- **Testing:** Node native unit/contract tests (`node --test`) + Playwright E2E browser suite

---

## Workspace Structure

```text
.
├── apps/
│   ├── web/            # @lanafox/web — Next.js App Router static export (/en/ & /uk/)
│   └── api/            # @lanafox/api — HTTP core & domain services (e.g. contact)
├── packages/
│   └── contracts/      # @lanafox/contracts — Shared TypeScript types & Zod schemas
├── scripts/            # Image optimizer, static export verifier, preview server & mock API
├── tests/
│   ├── unit/           # Unit & contract tests
│   └── e2e/            # Playwright browser E2E tests
└── app/                # Preserved legacy Express 4 / Handlebars reference baseline
```

---

## Getting Started

1. **Use Node.js 24 LTS** (pinned in [`.nvmrc`](.nvmrc)):
   ```sh
   nvm use
   ```
2. **Install dependencies:**
   ```sh
   npm ci
   ```
3. **Configure local environment** (required for `snapshot` / `cloudinary` gallery modes; `build:fixture` requires zero env setup):
   ```sh
   cp .env.example apps/web/.env.local
   ```
   Set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` in `apps/web/.env.local` (gitignored).

---

## Local Development & Preview

| Service | Port | Command | Description |
| :--- | :--- | :--- | :--- |
| **Next.js dev server** | `3101` | `npm run dev` | Hot-reloading dev server (`http://localhost:3101/en/`) |
| **Static export preview** | `3102` | `npm run preview` | Serves `apps/web/out` (`http://localhost:3102/en/` & `/uk/`) |
| **Local mock API** | `7071` | `npm run dev:api` | Loopback-only (`http://localhost:7071/api/contact`); test inbox at `http://localhost:7071/__test/inbox` (**sends no real email**) |
| **Legacy reference (`app/`)** | `3000` | `cd app && PORT=3000 node ./bin/www` | Preserved legacy baseline for side-by-side comparison |

### Gallery Build Modes (`PHOTO_SOURCE`)
- **`fixture`** (`npm run build:fixture`): Uses 6 local repository images for deterministic offline/CI builds without cloud configuration.
- **`snapshot`** (`npm run build:preview` or default `npm run build`): Uses the committed 36-photo portfolio manifest with `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (no API secret required).
- **`cloudinary`** (`npm run build:cloudinary`): Verifies the curated manifest against the live Cloudinary Admin Search API at build time (`CLOUDINARY_URL` build secret required).

---

## Verification & Testing

```sh
npm run build:fixture     # Offline 6-photo fixture static export
npm run build:preview     # Full 36-photo preview static export
npm run lint              # ESLint across workspaces, scripts, and tests
npm run typecheck         # TypeScript strict check across all workspaces
npm test                  # Unit & contract tests
npm run test:e2e          # Playwright E2E browser suite (starts preview + mock API)
npm run check:legacy-env  # Legacy .env secret-logging regression check
```

---

## Follow Lana Fox

- [Instagram](https://www.instagram.com/lanafox.ph/)
- [Threads](https://www.threads.net/@lanafox.ph)
- [Facebook](https://www.facebook.com/lanafox.ph/)

## License

Distributed under the [MIT License](LICENSE).
