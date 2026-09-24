# Contributing

This repository uses a lightweight pull-request workflow that is practical for a one-person product and still leaves a reviewable delivery record.

## Local setup

1. Use Node.js 24 and npm 11 (`nvm use` when nvm is available).
2. Run `npm ci` so the installed tree matches `package-lock.json`.
3. Copy `.env.example` to `.env.local` and use development-only credentials.
4. Never point routine local commands, tests, or seeds at the Production Neon project. Apply production migrations only through the guarded release procedure.

Database commands validate the environment marker and Neon project identity before connecting. CI creates its E2E database from the non-production `test-base` branch and deletes it after the run. Local E2E remains opt-in and must use an explicitly isolated non-production target.

## Change workflow

1. Create a short-lived branch from `master` using a descriptive name such as `fix/captcha-error` or `delivery/add-ci`.
2. Keep a change focused on one outcome. Update documentation with behavior or operational changes.
3. For a schema change, edit the Drizzle schema, generate SQL with `npm run db:generate`, and review the schema, SQL, and snapshot together. Follow the guarded procedure in `docs/professional-delivery/PD-05_PREVIEW_ENVIRONMENT_RUNBOOK.md`; do not use `drizzle-kit push` for shared or Production databases.
4. Run `npm run quality` before opening the pull request.
5. Open a pull request even when working alone. Review its diff and CI evidence, use a Vercel preview when hosted review adds value, complete the checklist, and merge only after required checks pass.

Use clear commit subjects in the imperative form, for example `Add production configuration validation`. A pull request may contain one commit or a small coherent series; avoid mixing generated reports, secrets, and local data into commits.

## Checks

`npm run quality` runs these gates in order:

1. Prettier validation for the initial adopted scope.
2. ESLint for JavaScript and Svelte files.
3. Svelte diagnostics and JavaScript-aware project checking.
4. Deterministic Vitest unit tests.
5. Drizzle migration-history validation.
6. The Production build.

Prettier adoption begins with delivery configuration, new unit tests, server configuration, and professional-delivery documents. Existing application and feature files retain their current formatting to avoid an unrelated repository-wide rewrite. Format a legacy file when making a substantive change to it, then add it to the enforced scope in `package.json`. Do not reformat active work belonging to another change.

Eligible application pull requests run Playwright against a disposable Neon branch in CI. Documentation-only changes and Dependabot pull requests skip secret-backed E2E. Dependabot still runs the complete secret-free Quality job; reproduce a selected dependency update on a maintainer branch when it needs database/browser validation. Local Playwright runs require a confirmed non-production database. Successful test runs must not leave test accounts, database branches, or generated reports behind.

## Dependency updates

Dependabot checks npm and GitHub Actions weekly. Compatible npm minor and patch updates are grouped; major TypeScript and Svelte Vite plugin updates are deferred until the framework, Vite, and linting peer ranges support them together. There is no automatic merge.

For each update, review the release notes and peer requirements, run `npm run quality`, and use a maintainer branch for E2E when the dependency can affect runtime, authentication, data access, PDF output, or deployment. Security updates remain eligible even when routine major version updates are deferred.

## Review and release notes

Assess risk from the user's perspective: authentication and account linking, data ownership, SSCC allocation, PDF/barcode correctness, migrations, configuration, and deployment behavior. Record the checks that provide evidence for the changed risk.

Add a published entry to the file-backed What's New history when a user can observe the change. Internal refactoring, test-only work, and documentation-only work normally do not need a user-facing entry.
