# AGENTS.md — Lana Fox Modernization Guide

This file provides repository-wide instructions for AI coding assistants and must stay synchronized with [`.ai-wiki/modernization-plan.md`](./.ai-wiki/modernization-plan.md) and [`.ai-wiki/ai-instructions.md`](./.ai-wiki/ai-instructions.md).

---

## 1. Current Modernization Status

- **Completed:**
  - **Stages 1–4** (*TypeScript migration — merged*)
  - **Stages 5–8** (*React + Next.js App Router static export, modern CSS Modules, responsive AVIF/WebP image pipeline, unit tests, and Playwright E2E tests — merged*)
  - **Stage 9** (*Adapt the project to Azure: Azure Functions v4 HTTP & timer entry points, Azure Table Storage + ACS Email Managed Identity adapters, `staticwebapp.config.json`, isolated `deployment/api` lockfile + `scripts/package-release.mjs`, `infra/README.md` manual Portal/Cloudflare setup guide + reference Terraform `infra/*.tf`, and GitHub Actions CI/CD workflows*)
- **Current Checkpoint:** **Stage 10** (*Human-led verification and testing*), followed by **Stage 11** (*Bug fixes*) and **Stage 12** (*Human go/no-go decision → Commit & Push*).
- **Legacy Baseline Retention:** Retain `app/` until **Stage 13** (*Polish the project*) once the human owner confirms legacy retirement.

---

## 2. Workspace Structure & Local Ports

- **`packages/contracts` (`@lanafox/contracts`):** Shared TypeScript types and runtime Zod validation schemas (`contactSchema`, `ContactRequest`, `ContactResponse`, `Locale`, `Slug`, `MAX_BODY_BYTES = 24576`).
- **`apps/api` (`@lanafox/api`):** Modular TypeScript API service (`createHttpHandler`, `readBounded`, `createService`, `MemoryStore`) plus Azure Functions v4 adapters (`TableStore` using `@azure/data-tables` with ETag concurrency, `AcsMailer` using `@azure/communication-email` with HTML escaping, `createAzureContactHandler` for `POST`/`OPTIONS /api/contact`, and `createAzureCleanupHandler` for hourly `cleanupApiState` timer trigger). Enforces HMAC hashing, 24-hour idempotency, `10/hour` global and `3/hour` per-sender rate limits, and in-memory flood pre-checks (`limitedKeys`).
- **`apps/web` (`@lanafox/web`):** React 19 + Next.js 16 App Router static export (`output: 'export'`, `trailingSlash: true`) with CSS Modules, bilingual `/en/` and `/uk/` routes, responsive AVIF/WebP local derivatives (`scripts/optimize-images.mjs`), 36-photo uncropped Cloudinary gallery + accessible lightbox, `staticwebapp.config.json`, and honest local preview contact form. See [`apps/web/AGENTS.md`](./apps/web/AGENTS.md).
- **`deployment/api` & `scripts/package-release.mjs`:** Isolated production lockfile (`0` vulnerabilities) and release bundler producing verifiable `artifacts/web/`, `artifacts/api/`, and `artifacts/release.json`.
- **`infra/`:** Step-by-step manual Azure Portal & Cloudflare setup guide ([`infra/README.md`](./infra/README.md)) and matching reference Terraform configuration (`infra/*.tf`) for the single-`production` low-cost architecture.
- **`tests/`:** Automated unit/contract tests (`tests/unit/*.test.ts`) and Playwright browser E2E suite (`tests/e2e/*.spec.ts`).
- **`app/`:** Preserved legacy Express 4 / Handlebars reference baseline (`http://localhost:3000`). Only `app/bin/www` and `app/utils/environment.js` are updated to prevent `.env` secret values from being printed to stdout.
- **`.ai-wiki/`:** Persistent local knowledge base (gitignored). **Never revert, delete, or overwrite `.ai-wiki/`.**

| Service | Port | Command | Notes |
| :--- | :--- | :--- | :--- |
| Legacy reference (`app/`) | `3000` | `cd app && PORT=3000 node ./bin/www` | Side-by-side baseline comparison |
| Next.js dev server | `3101` | `npm run dev` | Hot-reloading dev server (`PHOTO_SOURCE=snapshot`) |
| Static export preview | `3102` | `npm run preview` | Serves `apps/web/out` with trailing-slash, CSP & `404` parity |
| Local mock API | `7071` | `npm run dev:api` | Loopback-only (`127.0.0.1:7071`); inbox at `/__test/inbox`; sends **no** email |

---

## 3. Runtime & Verification Commands (Stage 9)

Use the pinned **Node.js 24 LTS** version specified in [`.nvmrc`](./.nvmrc) (`24.22.2`). Copy `.env.example` to `apps/web/.env.local` (gitignored) and set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` before running `dev` or `build:preview` (`build:fixture` requires zero env configuration):

```sh
nvm use
npm ci
npm run build:fixture
npm run build:preview
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run package:release
npm run check:legacy-env
```

---

## 4. Security, Cost & Operational Rules

1. **No Secret Logging or Hardcoded Cloud Identifiers:** Never log `.env` values, `CLOUDINARY_URL`, `API_HASH_SECRET`, or `CONTACT_HASH_SECRET`. Never place secrets in `NEXT_PUBLIC_*` variables or committed files, and read the public Cloudinary cloud name strictly from `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` rather than hardcoding it in tracked JSON/code.
2. **No Real Email in Local Development/Tests:** Local development and preview builds must use `MemoryStore` and the local loopback test inbox (`http://localhost:7071/__test/inbox`) and display an explicit UI notice that no real email is sent.
3. **Azure Cost & DDoS Guardrails:** Keep a single `production` Azure environment (Azure Static Web Apps `Free`, Azure Functions Flex Consumption `FC1` with `0` always-ready instances and max `2` × `512 MB` instances, Cloudflare Free DNS/CDN/WAF in front of both frontend and API, Function inbound IP restrictions allowing only Cloudflare IPs, encrypted Function App setting `API_HASH_SECRET` with no Key Vault, `0.1 GB/day` Log Analytics cap, and 1 `Http5xx` metric alert + budget alerts without paid scheduled log-query alerts).
4. **Workspace Boundary:** Never execute broad filesystem searches outside `/Users/hryshchuk/Projects/lanafox` (e.g., never run `find /`).
5. **Checkpoint Discipline:** Update `AGENTS.md` at every implementation stage and stop at every human verification / go-no-go stage (Stages 2, 4, 6, 8, 10, 12, 14). Do not commit or push Stage 9 changes before Stage 12 approval.
