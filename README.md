# Logistic Label (SvelteKit)

SvelteKit app for GS1-128 logistic label workflows: authentication, dashboard, label creation, preview, and PDF download. Uses Better Auth, Drizzle ORM, Neon Postgres, Tailwind v4, and server-side PDF/barcode generation.

## Quick start
```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run dev -- --host --port 5173
# build: npm run build
# preview: npm run preview
```

For Google sign-in, configure a Google OAuth client with this callback URL:
`http://localhost:5173/api/auth/callback/google` locally, and `<production-origin>/api/auth/callback/google` in production.

For the production domain, set Vercel `BETTER_AUTH_URL` to `https://www.sscc-labels.com` and register the exact Google OAuth URLs below:

Authorized JavaScript origins:
```text
https://www.sscc-labels.com
https://sscc-labels.com
```

Authorized redirect URIs:
```text
https://www.sscc-labels.com/api/auth/callback/google
https://sscc-labels.com/api/auth/callback/google
```

Google requires redirect URIs to match exactly, including protocol, domain, `www`, path, and trailing slash.

## Tech stack
- SvelteKit (Svelte 5), Vite
- Tailwind CSS v4 (via `src/app.css`), custom theme tokens
- Auth: Better Auth with email/password and Google OAuth
- Data: Neon Postgres via Drizzle ORM
- PDF/Labels: server-side 4x6 PDF generation with vector GS1-128 barcode rendering
- reCAPTCHA: Google test key; CSP updated to allow recaptcha domains

## App structure
- Routes: `src/routes` (pages) and `src/routes/api` (endpoints)
- Components: `src/lib/components` (Auth, Labels, Layout)
- Server utilities: `src/lib/server` (auth, db, pdf)
- Validation: `src/lib/validation`
- Styling: `src/app.css` (Tailwind import + tokens)
- Database migrations: `drizzle/`

## Environment
```bash
LOGISTIC_LABEL_DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
BETTER_AUTH_URL="http://localhost:5173"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
PUBLIC_RECAPTCHA_SITE_KEY=""
RECAPTCHA_SECRET_KEY=""
PDF_STORAGE_PATH="storage/pdf"
PREVIEW_STORAGE_PATH="storage/preview"
```

Rotate any database URL or OAuth secret that has been shared in chat, logs, or issue trackers before using it in production.

## Auth flow
- Better Auth is mounted under `/api/auth/*` from `src/hooks.server.js`.
- Protected pages: `/dashboard`, `/labels`.
- Protected APIs: all `/api/*` routes except `/api/auth/*`.
- `event.locals.user` and `event.locals.session` are populated server-side from Better Auth.

## Dashboard data
- Endpoint: `/api/dashboard`
- Uses persisted `logistic_label` rows scoped to the authenticated user.

## Labels/PDF
- Generates 4x6 PDF labels with vector GS1-128 barcode rendering.
- Preview PDFs are stored under `storage/preview`; generated PDFs are stored under `storage/pdf`.
- SSCC allocation and nested logistic unit behavior should follow the documented GS1 rules in `docs/GS1_REQUIREMENTS.md`.
- The GS1 Logistic Label Guideline PDF is stored at `docs/GS1_Logistic_Label_Guideline.pdf`; the public source is https://www.gs1.org/docs/tl/GS1_Logistic_Label_Guideline.pdf, with app-specific analysis in `docs/GS1_LOGISTIC_LABEL_GUIDE.md`.
- Scanner validation and any formal GS1 certification still need physical/test-suite verification before real production use.

## CSP and reCAPTCHA
- CSP in `src/app.html` allows Google reCAPTCHA. Security headers (X-Frame-Options, etc.) set via `src/hooks.server.js`.
- Production must use a real Google reCAPTCHA v2 Checkbox site key in `PUBLIC_RECAPTCHA_SITE_KEY` and secret key in `RECAPTCHA_SECRET_KEY`. Register both `www.sscc-labels.com` and `sscc-labels.com` in Google reCAPTCHA Admin, then add both keys to Vercel Production environment variables and redeploy.
- The public Google test key is used only in local development when `PUBLIC_RECAPTCHA_SITE_KEY` is not set. If production shows "Captcha is not configured", the Vercel environment variable is missing.

## What is missing / next steps
- Email verification/password reset email delivery
- Apple OAuth, if required after Google
- Verify barcode output against physical scanners/GS1 certification requirements
- Tests and linting scripts
- Production adapter config for target hosting

## More details
See docs/ARCHITECTURE.md for routing, auth, data, and security notes.
See docs/GS1_REQUIREMENTS.md for GS1 SSCC allocation and aggregation rules captured for future implementation work.
See docs/GS1_LOGISTIC_LABEL_GUIDE.md for an app-focused analysis of the GS1 Logistic Label Guideline.
