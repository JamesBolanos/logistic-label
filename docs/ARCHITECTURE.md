# Architecture

## Overview
- SvelteKit (Svelte 5) with Vite for build/dev.
- Tailwind CSS v4 via `@import "tailwindcss";` in `src/app.css` plus theme tokens.
- Better Auth for email/password sessions and Google OAuth.
- Neon Postgres with Drizzle ORM and checked-in SQL migrations.
- Server hooks expose the authenticated Better Auth user/session via `locals`.
- PDF generation renders 4x6 labels with vector GS1-128 barcodes.

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
- `src/lib/server/pdf/labelGenerator.js` produces 4x6 PDF labels.
- `src/lib/server/pdf/gs1Barcode.js` encodes supported GS1 application identifiers as Code 128 / GS1-128 bar patterns.
- Preview PDFs are short-lived files under `storage/preview`; generated PDFs are under `storage/pdf`.
- GS1 SSCC allocation, reuse, responsibility, and nested logistic unit rules are tracked in `docs/GS1_REQUIREMENTS.md`.
- GS1 Logistic Label layout, AI combination, barcode sizing, placement, and verification guidance is summarized in `docs/GS1_LOGISTIC_LABEL_GUIDE.md`; the source PDF is checked in as `docs/GS1_Logistic_Label_Guideline.pdf`.

## Validation
- Shared form validation in `src/lib/validation/formValidation.js` for login/signup and label inputs.

## Styling
- Tailwind v4; utility classes used across components. Theme tokens defined in `src/app.css`.

## CSP and security headers
- CSP meta in `src/app.html` allows Google reCAPTCHA domains.
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) are set in `src/hooks.server.js` (server-side).

## Known gaps / next steps
- Configure production `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, Google OAuth credentials, and Neon URL in Vercel.
- For Google OAuth in production, set `BETTER_AUTH_URL=https://www.sscc-labels.com` and register both `https://www.sscc-labels.com/api/auth/callback/google` and `https://sscc-labels.com/api/auth/callback/google` as authorized redirect URIs in Google Cloud.
- Add email delivery for verification and password reset flows.
- Add Apple OAuth when the developer account/callback requirements are ready.
- Implement SSCC allocation safeguards, including preventing SSCC reallocation for at least one year after shipment date.
- Align the label form, API validation, barcode encoder, and PDF renderer with `docs/GS1_LOGISTIC_LABEL_GUIDE.md`.
- Verify barcode output against physical scanners/GS1 certification requirements.
- Add test and lint scripts.
- Choose and configure a production adapter (currently `adapter-auto`).
