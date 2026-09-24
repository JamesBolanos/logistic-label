# Logistic Label (SvelteKit)

SvelteKit app for GS1-128 logistic label workflows: authentication, dashboard, label creation, preview, and PDF download. Uses Better Auth, Drizzle ORM, Neon Postgres, Tailwind v4, and server-side PDF/barcode generation.

## Supported toolchain

- Node.js 24.x LTS. Use the latest available security patch within this major version.
- npm 11.x; the repository records the tested version in `packageManager`.
- Install exactly from `package-lock.json` with `npm ci` for CI and reproducible setup.

Run `nvm use` to select the repository version when using nvm. Review the supported Node major at least every six months and upgrade before it leaves maintenance support. Dependency upgrades must retain the lockfile and pass the repository quality pipeline.

## Quick start

Install dependencies and pull the linked project's Development variables:

```bash
nvm use
npm ci
vercel link
vercel env pull .env.local --environment=development
npm run quality
npm run dev -- --host --port 5173
# build: npm run build
# preview: npm run preview
```

If Vercel access is unavailable, copy `.env.example` to `.env.local` and replace every placeholder with nonproduction values. Put machine-specific overrides, such as a local Better Auth secret and URL, in `.env.development.local`. Both files are ignored by Git.

Database generation and migration are separate, deliberate operations. Do not run them as part of routine application startup; first verify that the database environment and Neon project identity match the intended nonproduction target.

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

| Variable | Exposure | Requirement |
|---|---|---|
| `APP_ENV` | Server only | Set to `development`, `test`, `preview`, `staging`, or `production`; Vercel's system `VERCEL_ENV` identifies Production when `APP_ENV` is omitted |
| `LOGISTIC_LABEL_DATABASE_URL` | Server only | Required for database-backed application behavior and Drizzle migrations |
| `DATABASE_ENVIRONMENT` | Server only | Required when a database URL is configured; set to `production` or `nonproduction` to identify the database environment |
| `LOGISTIC_LABEL_NEON_PROJECT_ID` | Server only | Required when a database URL is configured; supplied by the Neon integration to identify the connected project |
| `EXPECTED_NEON_PROJECT_ID` | Server only | Required when a database URL is configured; project-owned value that must match `LOGISTIC_LABEL_NEON_PROJECT_ID` |
| `BETTER_AUTH_SECRET` | Server only | Required outside local development; use a separate secret in each environment |
| `BETTER_AUTH_URL` | Server only | Required outside local development; must be the canonical URL for that environment |
| `GOOGLE_CLIENT_ID` | Server only | Required where Google sign-in is enabled |
| `GOOGLE_CLIENT_SECRET` | Server only | Required where Google sign-in is enabled |
| `PUBLIC_RECAPTCHA_SITE_KEY` | Browser-visible | Required for email authentication outside local development; use the matching key type and domain |
| `RECAPTCHA_SECRET_KEY` | Server only | Required for email authentication outside local development; must match the site key |
| `PREVIEW_STORAGE_PATH` | Server only | Optional legacy hash-preview directory; defaults to `storage/preview` |

For local development, pull Development variables into `.env.local` or copy `.env.example` there and replace its placeholders. Never reuse production database or authentication credentials in development, tests, or previews. Vercel variables must be scoped separately to Development, Preview, and Production.

Before initializing a configured database connection, the application verifies that `DATABASE_ENVIRONMENT` matches the deployment and that the actual Neon project ID matches `EXPECTED_NEON_PROJECT_ID`. A mismatch stops database initialization. At server startup, a Production deployment also refuses to run when a required database, Better Auth, Google, or reCAPTCHA variable is missing. `BETTER_AUTH_URL` must be an absolute HTTPS URL. Configuration errors identify variable names but never print their values.

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
- The active preview and download endpoints generate PDF responses on demand. The legacy hash-preview reader can read short-lived files from `PREVIEW_STORAGE_PATH`; no active endpoint currently writes generated PDFs to `storage/pdf`.
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
