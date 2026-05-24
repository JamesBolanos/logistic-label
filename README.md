# Logistic Label (SvelteKit)

Mocked SvelteKit app for GS1-128 logistic label workflows: auth (mock), dashboard, labels, and PDF/barcode stubs. Uses Tailwind v4 and in-memory data; no real backend or database is wired up yet.

## Quick start
```bash
npm install
npm run dev -- --host --port 5173
# build: npm run build
# preview: npm run preview
```

## Tech stack
- SvelteKit (Svelte 5), Vite
- Tailwind CSS v4 (via `src/app.css`), custom theme tokens
- Auth: mock endpoints setting `authToken` cookie; client guard via cookie check
- Data: in-memory stub DB (`src/lib/server/db/neon.js`)
- PDF/Labels: stub generators/placeholders
- reCAPTCHA: Google test key; CSP updated to allow recaptcha domains

## App structure
- Routes: `src/routes` (pages) and `src/routes/api` (endpoints)
- Components: `src/lib/components` (Auth, Labels, Layout)
- Server utilities: `src/lib/server` (auth, db stub, pdf stub)
- Validation: `src/lib/validation`
- Styling: `src/app.css` (Tailwind import + tokens)

## Auth flow (mock)
- Endpoints: `/api/auth/login`, `/api/auth/signup`, `/api/auth/logout`
- Cookie: `authToken` set on login; client guards check the cookie
- Test user: `test@example.com` / `password123`
- Note: Token is mock; httpOnly disabled in dev to allow client check. Enable secure/httpOnly for real deployments and move checks server-side.

## Dashboard data (mock)
- Endpoint: `/api/dashboard`
- Uses in-memory `logistic_labels` table stub; data resets on restart

## Labels/PDF (stub)
- Placeholder modules for barcode/PDF generation; no real output yet.

## CSP and reCAPTCHA
- CSP in `src/app.html` allows Google reCAPTCHA. Security headers (X-Frame-Options, etc.) set via `src/hooks.server.js`.

## What is missing / next steps
- Real database and models (replace `src/lib/server/db/neon.js`)
- Real auth (JWT or session) with secure cookies
- Implement actual PDF/barcode generation
- Tests and linting scripts
- Production adapter config for target hosting

## More details
See docs/ARCHITECTURE.md for routing, auth, data, and security notes.
