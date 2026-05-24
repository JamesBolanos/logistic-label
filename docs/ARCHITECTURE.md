# Architecture

## Overview
- SvelteKit (Svelte 5) with Vite for build/dev.
- Tailwind CSS v4 via `@import "tailwindcss";` in `src/app.css` plus theme tokens.
- Mocked backend: in-memory auth and DB stubs, placeholder PDF/barcode generators.
- Auth cookie (`authToken`) set by API; client guards check the cookie.

## Routing
- Pages under `src/routes/`
  - `/` landing
  - `/login`, `/signup`
  - `/dashboard` (protected)
  - `/labels` (listing/creation pages)
- API endpoints under `src/routes/api/`
  - `auth/`: login, signup, logout
  - `dashboard/`: aggregated dashboard data
  - `labels/`: create, list
  - `pdf/`: generate, preview, download (stubs)

## Auth flow (mock)
- Login/signup endpoints set `authToken` cookie.
- Client guards:
  - `src/routes/+layout.js` checks `authToken` cookie for protected routes.
  - `src/lib/components/Layout/ProtectedRoute.svelte` checks cookie on mount.
- Test user seeded: `test@example.com` / `password123`.
- Cookie flags: `httpOnly: false`, `secure: false`, `sameSite: 'lax'` for dev. For production: set `httpOnly: true`, `secure: true`, and perform server-side auth checks.

## Data layer (stub)
- `src/lib/server/db/neon.js`: in-memory store with a minimal `query` that supports dashboard needs (counts, unique GTINs, recents) and filters by `user_id`. Data is non-persistent and resets on restart.
- Labels stored in `data.logistic_labels` array with fields: `id, user_id, gtin, lot_number, created_at` (others can be added when implementing real DB).

## Dashboard data
- Endpoint: `/api/dashboard`
- Requires `authToken` cookie; uses stub DB to compute totals, today count, last label, unique GTINs, recent labels.

## Labels and PDF (stub)
- `src/lib/server/pdf/labelGenerator.js` and `src/lib/pdf/barcodeGenerator.js` are placeholders; no real PDF/barcode output yet. Replace with real generators and binary responses when implementing.

## Validation
- Shared form validation in `src/lib/validation/formValidation.js` for login/signup and label inputs.

## Styling
- Tailwind v4; utility classes used across components. Theme tokens defined in `src/app.css`.

## CSP and security headers
- CSP meta in `src/app.html` allows Google reCAPTCHA domains.
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) are set in `src/hooks.server.js` (server-side).

## Known gaps / next steps
- Replace mock auth with real auth (JWT or session) and enable secure/httpOnly cookies; move auth checks server-side.
- Replace stub DB with real database and migrations.
- Implement actual PDF/barcode generation.
- Add tests and linting (no scripts presently).
- Choose and configure a production adapter (currently `adapter-auto`).
