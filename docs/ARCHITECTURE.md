# Architecture

## Overview

- SvelteKit (Svelte 5) with Vite for build/dev.
- Tailwind CSS v4 via `@import "tailwindcss";` in `src/app.css` plus theme tokens.
- Better Auth for email/password sessions and Google OAuth.
- Neon Postgres with Drizzle ORM and checked-in SQL migrations.
- Server hooks expose the authenticated Better Auth user/session via `locals`.
- PDF generation renders 4×3, 4×6, and 6×8 labels with vector GS1-128 barcodes.

## Routing

- Pages under `src/routes/` are grouped by audience; route groups do not appear in the URL.
  - `(public)/`: unauthenticated marketing and information pages that share a top marketing header and footer — `/` (home landing), `/guide`, `/updates`, `/privacy`.
  - `(auth)/`: `/login`, `/signup`, `/reset-password`, framed by a minimal centered card shell.
  - `(app)/`: authenticated workspace with a fixed left sidebar and an account header — `/dashboard`, `/labels` (generator), `/labels/create`, `/labels/history`, `/settings`, `/admin/statistics`.
- `src/routes/+layout.svelte` keeps only global concerns: `app.css`, the Google Analytics component, and theme initialization.
- `src/routes/(app)/+layout.server.js` guards the whole application group and redirects unauthenticated visitors to `/login`; `src/hooks.server.js` keeps its path guard as defense in depth.
- Shared shell components live in `src/lib/components/Layout/` (`PublicHeader`, `Footer`, `AppSidebar`, `AppHeader`, `Logo`, `ThemeToggle`).
- API endpoints under `src/routes/api/`
  - `auth/`: Better Auth mounted under `/api/auth/*`
  - `dashboard/`: aggregated dashboard data
  - `labels/`: create, list
  - `products/`: manage the per-account saved product list that pre-fills the label form
  - `pdf/`: generate, preview, download
  - `zpl/`: download saved labels at the selected printer resolution

## Auth flow

- `src/lib/server/auth/betterAuth.js` configures Better Auth with Drizzle and Neon.
- Email/password auth is enabled.
- Google OAuth is enabled through `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- Apple OAuth is intentionally deferred.
- Server guard:
  - `src/hooks.server.js` resolves the Better Auth session, sets `event.locals.user` and `event.locals.session`, redirects protected pages, and blocks protected APIs. The `(app)` layout guard repeats the redirect for the whole application group.
  - Better Auth handles `/api/auth/*` requests.

## Data layer

- `src/lib/server/db/index.js` creates the Neon HTTP client and Drizzle database instance.
- `src/lib/server/db/schema.js` defines Better Auth tables, user settings, saved products, logistic labels, and operational events.
- `drizzle/` contains SQL migrations.
- Label rows are scoped by Better Auth user id.

## Dashboard data

- Endpoint: `/api/dashboard`
- Requires an authenticated session; computes totals, today count, last label, unique GTINs, recent labels, and first-label onboarding progress from Postgres.
- Onboarding is derived from existing settings, successful preview events, and saved-label totals. It adds no user-profile state or database table, and existing label creators are treated as complete.

## Labels and exports

- `src/lib/server/labels/layout.js` supplies versioned physical layouts to the PDF and ZPL adapters.
- `src/lib/server/pdf/labelGenerator.js` produces 4×6, 4×3, and 6×8 PDF labels, including a two-copy transport-label sheet.
- `src/lib/server/zpl/labelGenerator.ts` produces ZPL using the shared GS1-128 bar patterns at whole-dot printer resolutions. The owner-scoped endpoint downloads existing labels without allocating another SSCC; see [ZPL export](./labels/ZPL_EXPORT.md).
- `src/lib/printing/print-bridge-client.ts` sends existing ZPL from the browser to the user's local bridge, which forwards it to a LAN printer. Per-user parameters live in `label_settings`; a separate printer-settings save preserves the SSCC sequence. See [LAN printing](./labels/LAN_PRINTING.md).
- `src/lib/server/pdf/gs1Barcode.js` encodes supported GS1 application identifiers as Code 128 / GS1-128 bar patterns.
- `src/lib/labels/scenarios.js` defines the business-facing shipping situations and maps available choices to stable stored label types.
- `src/lib/labels/workflows.js` defines the technical label types, transport vocabularies, packaging-level vocabulary, homogeneous date AIs, print layouts, and template versions.
- Saved products are per-account reference data (name, internal reference, GTIN) with a stored `gs1_valid` flag that records whether the number passes the GS1 check digit. An uncorrected number may be saved as reference data, while labels keep rejecting invalid GTINs. Selecting a product in the label form fills only the GTIN; shipment values remain on each label, and deleting a product never changes saved labels or SSCCs.
- New records persist an explicit label type, template version, print layout, and the fields needed to reproduce the selected label. Existing `legacy_demo` / `v1` and guided `v2` records continue through their original renderers; transport labels use `v3` and structured homogeneous labels use `v4`.
- The active preview and download endpoints generate PDF responses on demand. A legacy hash-preview reader can read short-lived files from `PREVIEW_STORAGE_PATH`; the current application does not write generated PDFs to `storage/pdf`.
- GS1 SSCC allocation, reuse, responsibility, and nested logistic unit rules are tracked in `docs/GS1_REQUIREMENTS.md`.
- GS1 Logistic Label layout, AI combination, barcode sizing, placement, and verification guidance is summarized in `docs/GS1_LOGISTIC_LABEL_GUIDE.md`; the source PDF is checked in as `docs/GS1_Logistic_Label_Guideline.pdf`.

## Validation

- Shared form validation in `src/lib/validation/formValidation.js` for login/signup and label inputs.
- The same label rules validate browser and API requests. The PDF renderer receives only validated, normalized guided-label data and rejects barcode content that cannot fit at the supported dimensions.
- A successful preview response includes a controlled verification summary for the UI: label type, layout, AIs, check results, and fixed warnings. It never includes the SSCC, GTIN, addresses, lot, or other shipment contents.

## Styling

- Tailwind v4 via `@import "tailwindcss";` in `src/app.css`.
- Semantic color tokens (`--color-background`, `--color-foreground`, `--color-surface`, `--color-border-default`, `--color-muted-foreground`, `--color-accent`, and related names) reference `--app-*` variables declared for `:root` and `.dark`, so one set of component classes serves both themes. Prefer these utilities over fixed palette values; keep the raw palette tokens for the few fixed contexts (label preview, print preview).
- Dark mode is class-based through `@custom-variant dark (&:where(.dark, .dark *))` in `src/app.css`.
- `src/lib/theme/theme.svelte.js` owns the shared theme state: it applies the theme to `<html>`, persists the explicit choice in `localStorage` under `sscc-labels-theme`, and follows the operating-system preference until the user chooses. The pre-paint script in `src/app.html` applies the stored theme before first render to avoid a flash; keep the storage key in sync in both places. `ThemeToggle.svelte` reads that module, so every toggle on a page stays consistent.

## Form architecture

- The label generator is a split-pane view: form controls on the left and the live thermal preview on the right (`src/routes/(app)/labels/+page.svelte`).
- `src/lib/validation/formValidation.js` holds shared field validation, and `src/lib/server/validation/formValidation.js` reuses it for API requests.

## CSP and security headers

- CSP meta in `src/app.html` allows Google reCAPTCHA domains and HTTP connections to `127.0.0.1`/`localhost` bridge ports. Bridge settings restrict hosts to those loopback names; printer LAN addresses are sent in the bridge request body.
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) are set in `src/hooks.server.js` (server-side).
- `src/lib/server/config/environment.js` validates required Production configuration at server startup. Vercel supplies `VERCEL_ENV`; other deployments can set `APP_ENV=production`.

## Current constraints

- Production and stable staging have separate Neon projects and environment-scoped authentication, Google OAuth, reCAPTCHA, and Resend configuration. The application validates the database environment and project identity before connecting.
- SSCC allocation is atomic and unique, but the product still needs an explicit one-year minimum non-reallocation policy tied to identifier retention.
- New workflows must use scenario-specific fields and valid AI combinations from `docs/GS1_LOGISTIC_LABEL_GUIDE.md`; unsupported scenarios remain unavailable rather than accepting ambiguous data.
- Automated preflight checks cannot establish physical barcode print grade or scanner performance. Representative printed labels remain blocked until suitable hardware is available.
- The explicit Vercel adapter is the supported deployment target and must remain compatible with SvelteKit upgrades.

Current priority and status are maintained only in [`KANBAN.md`](./KANBAN.md).
