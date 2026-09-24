cat << 'EOF' > GEMINI_PACKAGE_ANALYSIS.md
# Package.json Analysis: logistic-label

## Key Information & Metadata

* **Project Name:** `logistic-label`
* **Version:** `0.0.1` (Early development stage)
* **Private:** `true` (Prevents accidental publishing to the public npm registry)
* **Module Type:** ESM (`"type": "module"`)
* **Package Manager:** `npm@11.9.0`
* **Engine Constraints:** Requires Node.js `24.x` and npm `11.x`.

---

## Tech Stack Overview

| Layer | Technologies |
| :--- | :--- |
| **Frontend / Web Framework** | **Svelte 5** (`^5.57.1`) + **SvelteKit 2** (`^2.70.3`) |
| **Styling** | **Tailwind CSS v4** (`^4.0.0`) via `@tailwindcss/vite` |
| **Database & ORM** | **Drizzle ORM** (`^0.45.3`) with **Neon Postgres** (`@neondatabase/serverless`) |
| **Authentication** | **Better Auth** (`^1.7.5`) using the `@better-auth/drizzle-adapter` |
| **Build Tooling** | **Vite 6** (`^6.4.3`) |
| **Deployment / Hosting** | Configured for Vercel via `@sveltejs/adapter-vercel` |
| **Observability** | `@opentelemetry/api` for telemetry/tracing |

---

## Quality Assurance & Testing Pipeline

Your project has a strong emphasis on testing, formatting, and linting:

* **Unit Testing:** Powered by **Vitest** (`vitest run tests/unit`).
* **End-to-End (E2E) Testing:** Powered by **Playwright** (`@playwright/test`), including headless, headed, and UI interactive modes.
* **Linting & Formatting:** ESLint 10, Prettier 3 (with `prettier-plugin-svelte`), and `eslint-plugin-svelte`.
* **Type Checking:** Svelte-check combined with TypeScript (`tsc`).
* **All-in-one Gatekeeper:** `npm run quality` sequences code checking, linting, unit tests, schema consistency checks, and a production build step to ensure build stability before deployment or merging.

---

## Scripts Breakdown

* **Development & Build:**
  * `npm run dev`: Starts the local Vite development server.
  * `npm run build`: Builds the application for production.
  * `npm run preview`: Previews the production build locally.
* **Database Management (Drizzle Kit):**
  * `npm run db:check`: Validates the Drizzle schema against the migrations output directory (`./drizzle`).
  * `npm run db:generate`: Generates SQL migration files from your schema.
  * `npm run db:migrate`: Applies migrations to your Postgres database.
  * `npm run db:studio`: Opens Drizzle Studio (a local Web UI to inspect database data).
* **Testing & Quality:**
  * `npm run test:unit`: Executes Vitest tests.
  * `npm run test:e2e`, `test:e2e:headed`, `test:e2e:ui`: Launches Playwright test suite in different modes.
  * `npm run quality`: Runs code style check, linter, type-check, unit tests, DB schema check, and build verification.

---

## Notable Observations

1. **Explicit Version Targets:** Node `24.x` and npm `11.x` are set in the `engines` field, representing very modern runtime requirements.
2. **Security / Dependency Overrides:** You have an explicit override `"cookie": "1.1.1"`. This is usually added to force nested transitive dependencies to use a patched version of `cookie`.
3. **Specific Prettier Scope:** The `format` and `format:check` scripts target specific directories and files explicitly rather than running universally over all project files.
EOF