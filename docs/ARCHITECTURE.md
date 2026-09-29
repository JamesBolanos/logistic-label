# Architecture

## Overview

- SvelteKit (Svelte 5) with Vite for build/dev.
- Tailwind CSS v4 via `@import "tailwindcss";` in `src/app.css` plus theme tokens.
- Better Auth for email/password sessions and Google OAuth.
- Neon Postgres with Drizzle ORM and checked-in SQL migrations.
- Server hooks expose the authenticated Better Auth user/session via `locals`.
- PDF generation renders 4×6 and 4×3 labels with vector GS1-128 barcodes.

## Routing

- Pages under `src/routes/`
  - `/` landing
  - `/login`, `/signup`
  - `/dashboard` (protected)
  - `/labels` (listing/creation pages)
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
- `src/lib/server/db/schema.js` defines Better Auth tables plus `logistic_label`.
- `drizzle/` contains SQL migrations.
- Label rows are scoped by Better Auth user id.

## Dashboard data

- Endpoint: `/api/dashboard`
- Requires an authenticated session; computes totals, today count, last label, unique GTINs, and recent labels from Postgres.

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

## Styling

- Tailwind v4; utility classes used across components. Theme tokens defined in `src/app.css`.

## CSP and security headers

- CSP meta in `src/app.html` allows Google reCAPTCHA domains.
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) are set in `src/hooks.server.js` (server-side).
- `src/lib/server/config/environment.js` validates required Production configuration at server startup. Vercel supplies `VERCEL_ENV`; other deployments can set `APP_ENV=production`.

## Known gaps / next steps

- Configure production `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, Google OAuth credentials, and Neon URL in Vercel.
- For Google OAuth in production, set `BETTER_AUTH_URL=https://www.sscc-labels.com` and register both `https://www.sscc-labels.com/api/auth/callback/google` and `https://sscc-labels.com/api/auth/callback/google` as authorized redirect URIs in Google Cloud.
- Configure and validate the Resend sending domain and environment-specific API keys for password recovery. Email verification remains a future flow.
- Add Apple OAuth when the developer account/callback requirements are ready.
- Implement SSCC allocation safeguards, including preventing SSCC reallocation for at least one year after shipment date.
- Extend the guided workflow only with scenario-specific fields and valid AI combinations from `docs/GS1_LOGISTIC_LABEL_GUIDE.md`.
- Verify barcode output against physical scanners/GS1 certification requirements.
- Expand integration and business-rule coverage as product areas change.
- Keep the explicit Vercel adapter aligned with the supported SvelteKit version.
