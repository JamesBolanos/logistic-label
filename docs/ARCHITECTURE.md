# Architecture

## System overview

- SvelteKit 5 with Vite; Tailwind CSS 4 supplies the shared application styling.
- Better Auth manages email/password sessions and Google OAuth.
- Neon Postgres stores application data. Drizzle defines the schema and checked-in SQL migrations.
- Server hooks resolve the session and expose the authenticated user through SvelteKit locals.
- Vercel is the supported deployment target; production and nonproduction use separate Neon projects.

## Routing and application boundaries

- `src/routes/` separates public information pages, authentication pages, and the authenticated application. Route groups do not appear in URLs.
- `src/routes/+layout.svelte` owns global styles, analytics initialization, and theme initialization. Shared page shells are in `src/lib/components/Layout/`.
- The `(app)` server layout protects the authenticated workspace; `src/hooks.server.js` also guards protected paths and APIs.
- API routes are grouped by domain under `src/routes/api/`: authentication, dashboard, labels, products, PDF, and ZPL.
- The private `/admin/statistics` page is permissioned separately by configured owner IDs. Its reporting contract and deployment setup are documented in the [analytics measurement plan](./analytics/MEASUREMENT_PLAN.md) and [owner statistics runbook](./analytics/OWNER_STATISTICS_RUNBOOK.md).

## Authentication and persistence

- `src/lib/server/auth/betterAuth.js` configures Better Auth with the Drizzle adapter.
- `src/lib/server/db/index.js` creates the Neon HTTP client and Drizzle instance; `src/lib/server/db/schema.js` defines auth tables, settings, saved products, labels, and operational events.
- `drizzle/` contains the versioned SQL migration history. Use the [feature release guide](./HOW_TO_DEPLOY_A_NEW_FEATURE.md) and [environment runbook](./professional-delivery/PD-05_PREVIEW_ENVIRONMENT_RUNBOOK.md) for migration and environment procedures.
- User-owned records are scoped to the Better Auth user ID.

## Labels and output adapters

Label workflows produce persisted, versioned label data that can be rendered by the PDF and ZPL adapters. The adapters share physical layout definitions; saved records retain their template version for compatibility. SSCC allocation and supported GS1 rules are covered by the [GS1 requirements](./GS1_REQUIREMENTS.md) and [logistic label guide](./GS1_LOGISTIC_LABEL_GUIDE.md).

Use the focused references for supported inputs and behavior:

- [Guided label workflows](./labels/GUIDED_LABEL_WORKFLOWS.md)
- [ZPL export](./labels/ZPL_EXPORT.md)
- [LAN printing](./labels/LAN_PRINTING.md)

## Validation and presentation

- Shared field validation lives in `src/lib/validation/`; Zod schemas are used with SvelteKit Superforms for server actions and client validation.
- The same relevant rules are applied to browser and API inputs. Preview responses expose controlled verification results, not raw shipment contents.
- `src/app.css` defines Tailwind theme tokens; `src/lib/theme/theme.svelte.js` owns shared theme state, with a pre-paint script in `src/app.html`.

## Security and deployment constraints

- CSP in `src/app.html` allows the configured authentication providers and loopback-only Print Bridge connections. Printer LAN destinations are sent to the local bridge, not contacted by the hosted application.
- `src/hooks.server.js` sets security headers. `src/lib/server/config/environment.js` validates required production configuration and database project identity before connecting.
- Production and staging use separate Neon projects and environment-scoped authentication, CAPTCHA, and email configuration.
- SSCC allocation is atomic and unique. The product still needs an explicit one-year minimum non-reallocation policy tied to identifier retention.
- Automated preflight checks do not establish physical barcode print grade or scanner performance; hardware verification remains necessary.

Current product priorities and status are maintained only in [`KANBAN.md`](./KANBAN.md).
