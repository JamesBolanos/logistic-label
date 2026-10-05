# Architecture

## Overview

- SvelteKit (Svelte 5) with Vite for build/dev.
- Tailwind CSS v4 via `@import "tailwindcss";` in `src/app.css` plus theme tokens.
- Better Auth for email/password sessions and Google OAuth.
- Neon Postgres with Drizzle ORM and checked-in SQL migrations.
- Server hooks expose the authenticated Better Auth user/session via `locals`.
- PDF generation renders 4×3, 4×6, and 6×8 labels with vector GS1-128 barcodes.

## Routing

- Pages under `src/routes/`
  - `/` landing
  - `/login`, `/signup`
  - `/reset-password`
  - `/guide`, `/updates`, `/privacy` (public)
  - `/dashboard` (protected)
  - `/labels` (listing/creation pages)
  - `/admin/statistics` (owner-only)
- API endpoints under `src/routes/api/`
  - `auth/`: Better Auth mounted under `/api/auth/*`
  - `dashboard/`: aggregated dashboard data
  - `labels/`: create, list
  - `pdf/`: generate, preview, download

## Auth flow

- `src/lib/server/auth/betterAuth.js` configures Better Auth with Drizzle and Neon.
- Email/password auth is enabled.
- Google OAuth is enabled through `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- Apple OAuth is intentionally deferred.
- Server guard:
  - `src/hooks.server.js` resolves the Better Auth session, sets `event.locals.user` and `event.locals.session`, redirects protected pages, and blocks protected APIs.
  - Better Auth handles `/api/auth/*` requests.

## Data layer

- `src/lib/server/db/index.js` creates the Neon HTTP client and Drizzle database instance.
- `src/lib/server/db/schema.js` defines Better Auth tables, user settings, logistic labels, and operational events.
- `drizzle/` contains SQL migrations.
- Label rows are scoped by Better Auth user id.

## Dashboard data

- Endpoint: `/api/dashboard`
- Requires an authenticated session; computes totals, today count, last label, unique GTINs, recent labels, and first-label onboarding progress from Postgres.
- Onboarding is derived from existing settings, successful preview events, and saved-label totals. It adds no user-profile state or database table, and existing label creators are treated as complete.

## Labels and PDF

- `src/lib/server/pdf/labelGenerator.js` produces 4×6, 4×3, and 6×8 PDF labels, including a two-copy transport-label sheet.
- `src/lib/server/pdf/gs1Barcode.js` encodes supported GS1 application identifiers as Code 128 / GS1-128 bar patterns.
- `src/lib/labels/scenarios.js` defines the business-facing shipping situations and maps available choices to stable stored label types.
- `src/lib/labels/workflows.js` defines the technical label types, transport vocabularies, packaging-level vocabulary, homogeneous date AIs, print layouts, and template versions.
- New records persist an explicit label type, template version, print layout, and the fields needed to reproduce the selected label. Existing `legacy_demo` / `v1` and guided `v2` records continue through their original renderers; transport labels use `v3` and structured homogeneous labels use `v4`.
- The active preview and download endpoints generate PDF responses on demand. A legacy hash-preview reader can read short-lived files from `PREVIEW_STORAGE_PATH`; the current application does not write generated PDFs to `storage/pdf`.
- GS1 SSCC allocation, reuse, responsibility, and nested logistic unit rules are tracked in `docs/GS1_REQUIREMENTS.md`.
- GS1 Logistic Label layout, AI combination, barcode sizing, placement, and verification guidance is summarized in `docs/GS1_LOGISTIC_LABEL_GUIDE.md`; the source PDF is checked in as `docs/GS1_Logistic_Label_Guideline.pdf`.

## Validation

- Shared form validation in `src/lib/validation/formValidation.js` for login/signup and label inputs.
- The same label rules validate browser and API requests. The PDF renderer receives only validated, normalized guided-label data and rejects barcode content that cannot fit at the supported dimensions.
- A successful preview response includes a controlled verification summary for the UI: label type, layout, AIs, check results, and fixed warnings. It never includes the SSCC, GTIN, addresses, lot, or other shipment contents.

## Styling

- Tailwind v4; utility classes used across components. Theme tokens defined in `src/app.css`.

## CSP and security headers

- CSP meta in `src/app.html` allows Google reCAPTCHA domains.
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) are set in `src/hooks.server.js` (server-side).
- `src/lib/server/config/environment.js` validates required Production configuration at server startup. Vercel supplies `VERCEL_ENV`; other deployments can set `APP_ENV=production`.

## Current constraints

- Production and stable staging have separate Neon projects and environment-scoped authentication, Google OAuth, reCAPTCHA, and Resend configuration. The application validates the database environment and project identity before connecting.
- SSCC allocation is atomic and unique, but the product still needs an explicit one-year minimum non-reallocation policy tied to identifier retention.
- New workflows must use scenario-specific fields and valid AI combinations from `docs/GS1_LOGISTIC_LABEL_GUIDE.md`; unsupported scenarios remain unavailable rather than accepting ambiguous data.
- Automated preflight checks cannot establish physical barcode print grade or scanner performance. Representative printed labels remain blocked until suitable hardware is available.
- The explicit Vercel adapter is the supported deployment target and must remain compatible with SvelteKit upgrades.

Current priority and status are maintained only in [`KANBAN.md`](./KANBAN.md).
