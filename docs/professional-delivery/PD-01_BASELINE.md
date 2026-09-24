# PD-01 Reproducible Baseline

Baseline captured: 2026-09-22 (America/Managua)

## Source and platform

| Item                               | Baseline                                                |
| ---------------------------------- | ------------------------------------------------------- |
| Repository branch                  | `master`                                                |
| Commit tested from a clean archive | `b9962b3184c73fe174f5e6c52eb0b92e72076016`              |
| Deployment target                  | Vercel, currently using SvelteKit `adapter-auto`        |
| Database provider                  | Neon PostgreSQL                                         |
| Schema and migrations              | Drizzle ORM and Drizzle Kit; three committed migrations |
| Package manager                    | npm with `package-lock.json` lockfile version 3         |
| Local baseline runtime             | Node.js 24.12.0 and npm 11.9.0 on macOS arm64           |
| Repository runtime contract        | Node.js 24.x and npm 11.x                               |

The clean archive excluded all uncommitted working-tree changes. Commands that could access a database used no real connection, or were not run when isolation could not be proven.

## Reproducibility results

| Check                               | Result               | Evidence and classification                                                                                                                   |
| ----------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                            | Passed               | Installed 106 packages from the committed lockfile; reported two deprecated transitive `@esbuild-kit` packages                                |
| `npm run build`                     | Passed with warnings | Completed using explicit non-production placeholder values; did not connect to a database                                                     |
| Production configuration rejection  | Passed               | A production-mode preview server refused to start with all required variables empty and listed names only                                     |
| Production configuration acceptance | Passed               | The preview server started with complete non-secret placeholders and returned HTTP 200 for `/`; no database connection was attempted          |
| Dependency audit                    | Attention required   | 13 advisories: 6 moderate and 7 high; includes direct runtime dependencies such as Better Auth and SvelteKit plus build dependencies          |
| Drizzle migration execution         | Not run              | The existing local database target is not yet proven to be isolated from Production; executing migrations would violate the delivery plan     |
| Playwright end-to-end test          | Not run              | The current test and cleanup helper use the configured development database directly; database isolation and target guards are required first |

## Dependency stabilization result

The controlled update completed on 2026-09-22 and retained the existing major versions of the application framework and build tool. Better Auth moved from 1.6.11 to 1.7.5, SvelteKit from 2.49.5 to 2.70.3, Svelte from 5.25.5 to 5.57.1, Vite from 6.4.1 to 6.4.3, and the Drizzle packages received patch updates. The regenerated lockfile resolves a valid peer-dependency tree, `npm ls --depth=0` succeeds, and the Production build succeeds.

The update removed all seven high-severity findings and the Svelte/SvelteKit compatibility warnings. `npm audit` now reports four moderate findings in the Drizzle Kit command-line dependency chain (`@esbuild-kit/esm-loader`, `@esbuild-kit/core-utils`, and their old `esbuild`). Drizzle Kit is a development-only migration tool and is not loaded by the deployed application. npm proposes downgrading Drizzle Kit to 0.18.1, which is not an acceptable security fix. Keep the exception visible and reassess it whenever Drizzle Kit is upgraded.

Better Auth 1.7.5 does not require a core schema migration for this application's current email/password and Google configuration. Authentication regression checks against an isolated database remain part of PD-03; they must cover an existing session, fresh email signup and login, and Google account linking before the update is released.

## Build warnings

The initial successful build reported:

- SvelteKit imports of `fork` and `settled` that are unavailable from the locked Svelte version.
- Unused imports inside Better Auth packages.
- `adapter-auto` could not select a production platform during the local build.

The adapter warning is expected until PD-05 installs the explicit Vercel adapter. The dependency update resolved the Svelte/SvelteKit export warnings. The remaining unused-import warnings originate inside Better Auth packages and do not prevent the build.

## Environment contract review

Application source currently reads:

- `LOGISTIC_LABEL_DATABASE_URL`
- `APP_ENV` (or Vercel's system-provided `VERCEL_ENV`)
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `PUBLIC_RECAPTCHA_SITE_KEY`
- `RECAPTCHA_SECRET_KEY`
- `PREVIEW_STORAGE_PATH`

`PDF_STORAGE_PATH` was documented but not read by the application, so it was removed from the example environment contract. The active PDF endpoints return generated data directly; a legacy hash-preview endpoint still reads from `PREVIEW_STORAGE_PATH`.

## Risk classification and next actions

| Finding                                                                              | Classification                        | Next action                                                                                                                                        |
| ------------------------------------------------------------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime high-severity dependency advisories                                          | Addressed in PD-01                    | Controlled compatible updates removed all seven high-severity findings; complete isolated authentication regression checks in PD-03 before release |
| Four moderate Drizzle Kit toolchain advisories                                       | Accepted development-tool risk        | Do not apply npm's unsafe downgrade; reassess on each Drizzle Kit update and keep the tool outside the deployed runtime                            |
| Svelte/SvelteKit export warnings                                                     | Addressed in PD-01                    | Compatible Svelte and SvelteKit updates removed the warnings                                                                                       |
| E2E and migration commands can use the configured database                           | Environment/test safety risk          | Implement the non-production Neon project, explicit target markers, and refusal guards before execution                                            |
| Production configuration previously fell back or failed only when a feature was used | Configuration risk addressed in PD-01 | Centralized startup validation now requires the database, Better Auth, Google, and reCAPTCHA configuration and an HTTPS auth URL in Production     |
| `adapter-auto` remains configured                                                    | Deployment configuration risk         | Replace it with the explicit Vercel adapter under PD-05                                                                                            |
| Generated Playwright artifacts are tracked in the working tree                       | Repository hygiene issue              | Resolve under PD-02 without overwriting the current test work                                                                                      |

## PD-01 status

The install/build baseline, toolchain contract, environment documentation, and fail-fast Production configuration gate are reproducible. PD-01 is complete locally; its commands will become required CI checks under PD-04. Migration and end-to-end execution move to PD-03 because running them before isolation would risk production data.
