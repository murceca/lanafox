# AGENTS.md — Lana Fox Modernization Guide

This file provides repository-wide instructions for AI coding assistants and must stay synchronized with [`.ai-wiki/modernization-plan.md`](./.ai-wiki/modernization-plan.md) and [`.ai-wiki/ai-instructions.md`](./.ai-wiki/ai-instructions.md).

---

## 1. Current Modernization Status

- **Completed:** **Stages 1–4** (*Migrate the project to TypeScript — Approved Option B*, verified and approved).
- **Next Stage:** **Stage 5** (*Migrate to the desired frameworks and technologies: React, Next.js App Router static export, modern CSS, unit tests, and Playwright E2E tests — without Azure-specific changes yet*), followed by **Stage 6** (*Human-led verification and testing*).
- **Defer Azure Implementation:** Do **not** add Azure SDK dependencies (`@azure/*`), `staticwebapp.config.json`, Terraform (`infra/`), or Azure deployment workflows until **Stage 9** (*Adapt the project to Azure*).

---

## 2. Workspace Structure

- **`packages/contracts` (`@lanafox/contracts`):** Shared TypeScript types and runtime Zod validation schemas (`contactSchema`, `ContactRequest`, `ContactResponse`, `Locale`, `Slug`, `MAX_BODY_BYTES`).
- **`apps/contact-api` (`@lanafox/contact-api`):** Framework-agnostic TypeScript contact service (`createService`, `MemoryStore`, `createHttpHandler`, `readBounded`) implementing HMAC hashing, 24-hour idempotency, `10/hour` global and `3/hour` per-sender rate limits, and in-memory flood pre-checks (`limitedKeys`).
- **`apps/web` (`@lanafox/web`):** Typed bilingual (`en`/`uk`) content models (`content/site.ts`, `content/home.json`, `content/policies.json`), Cloudinary photo manifest/discovery utilities (`lib/photos.ts`, `content/photos.production.json`, `content/photos.fixture.json`, `content/cloudinary-recovery.json`), local image helpers (`lib/local-images.ts`), and SEO metadata builders (`lib/seo.ts`). Next.js App Router UI and Playwright E2E tests will be added in Stage 5.
- **`app/`:** Preserved legacy Express 4 / Handlebars reference baseline. Only `app/bin/www` and `app/utils/environment.js` are updated to prevent `.env` secret values from being printed to stdout (`F01`).
- **`.ai-wiki/`:** Persistent local knowledge base (gitignored). **Never revert, delete, or overwrite `.ai-wiki/`.**

---

## 3. Runtime & Verification Commands (Stage 1)

Use the pinned **Node.js 24 LTS** version specified in [`.nvmrc`](./.nvmrc) (`24.22.2`):

```sh
nvm use
npm ci
npm run typecheck
npm run lint
npm run build
npm run check:legacy-env
npm run dev:api
```

---

## 4. Security & Operational Rules

1. **No Secret Logging or Exposure:** Never log `.env` values, `CLOUDINARY_URL`, or `CONTACT_HASH_SECRET`. Never place secrets in `NEXT_PUBLIC_*` variables or committed files.
2. **No Real Email in Local Development/Tests:** Local development and test harnesses must use `MemoryStore` and a no-op/local test inbox mailer.
3. **Workspace Boundary:** Never execute broad filesystem searches outside `/Users/hryshchuk/Projects/lanafox` (e.g., never run `find /`).
4. **Checkpoint Discipline:** Update `AGENTS.md` at every implementation stage and stop at every human verification / go-no-go stage (Stages 2, 4, 6, 8, 10, 12, 14).

