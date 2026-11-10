# AGENTS.md — `@lanafox/web` (Next.js Static Export)

This workspace contains the modernized bilingual (`en` / `uk`) Lana Fox portfolio frontend built with **React 19**, **Next.js 16 App Router**, **TypeScript (strict mode)**, and **CSS Modules**.

---

## 1. Static-Export Constraints (`output: 'export'`)

- `next.config.mjs` enforces `output: "export"`, `trailingSlash: true`, and `images: { unoptimized: true }`.
- **Forbidden Next.js Server Features:** Do not add Route Handlers (`route.ts`) that depend on request-time headers/cookies, Server Actions (`"use server"`), `middleware.ts`, ISR (`revalidate`), or dynamic routes without `generateStaticParams` (`dynamicParams = false`).
- **Locale HTML Attribute:** `app/layout.tsx` provides the root shell (`app/not-found.tsx` handles static `404.html`), `components/HtmlLangSync.tsx` synchronizes `document.documentElement.lang` on client navigations, and `scripts/finalize-export.mjs` stamps `<html lang="uk">` into every pre-rendered `out/uk/**/index.html` file so Ukrainian pages have accurate static `lang` attributes even with JavaScript disabled.

---

## 2. Photo & Image Modes

- **Gallery build modes (`PHOTO_SOURCE`):**
  - `fixture`: 6 local repository images (`content/photos.fixture.json`) for deterministic offline/CI builds (`npm run build:fixture`). Requires zero environment variables.
  - `snapshot`: All 36 recovered Cloudinary photos (`content/photos.production.json`) for local preview (`npm run build:preview`). Reads `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` from gitignored `apps/web/.env.local` (or shell env).
  - `cloudinary`: Live build-time verification against Cloudinary Admin Search API (`CLOUDINARY_URL` build secret required; never exposed to client bundles).
- **Aspect Ratios:** Gallery CSS (`components/PortfolioGallery.module.css`) must preserve every photograph's natural `width / height` aspect ratio (`object-fit: contain`) without cropping tiles.
- **Local Responsive Derivatives:** `scripts/optimize-images.mjs` generates responsive `.avif` and `.webp` files into gitignored `apps/web/public/optimized/` before `dev` and `build`, keeping source images in `apps/web/public/images/` intact.
