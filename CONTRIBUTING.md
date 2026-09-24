# Contributing

This repository uses a lightweight pull-request workflow that is practical for a one-person product and still leaves a reviewable delivery record.

## Local setup

1. Use Node.js 24 and npm 11 (`nvm use` when nvm is available).
2. Run `npm ci` so the installed tree matches `package-lock.json`.
3. Copy `.env.example` to `.env` and use development-only credentials.
4. Never point local commands, tests, seeds, or migrations at the Production Neon project.

Database-backed tests and migration verification remain disabled until PD-03 adds explicit target guards and an isolated non-production Neon project.

## Change workflow

1. Create a short-lived branch from `master` using a descriptive name such as `fix/captcha-error` or `delivery/add-ci`.
2. Keep a change focused on one outcome. Update documentation with behavior or operational changes.
3. For a schema change, edit the Drizzle schema, generate SQL with `npm run db:generate`, and review the schema, SQL, and snapshot together. Do not use `drizzle-kit push` for shared or Production databases.
4. Run `npm run quality` before opening the pull request.
5. Open a pull request even when working alone. Review its diff and Vercel preview, complete the checklist, and merge only after required checks pass.

Use clear commit subjects in the imperative form, for example `Add production configuration validation`. A pull request may contain one commit or a small coherent series; avoid mixing generated reports, secrets, and local data into commits.

## Checks

`npm run quality` runs these gates in order:

1. Prettier validation for the initial adopted scope.
2. ESLint for JavaScript and Svelte files.
3. Svelte diagnostics and JavaScript-aware project checking.
4. deterministic Vitest unit tests.
5. the Production build.

Prettier adoption begins with delivery configuration, new unit tests, server configuration, and professional-delivery documents. Existing application and feature files retain their current formatting to avoid an unrelated repository-wide rewrite. Format a legacy file when making a substantive change to it, then add it to the enforced scope in `package.json`. Do not reformat active work belonging to another change.

Run Playwright only with a confirmed non-production database. Successful test runs must not leave test accounts or generated reports in version control.

## Review and release notes

Assess risk from the user's perspective: authentication and account linking, data ownership, SSCC allocation, PDF/barcode correctness, migrations, configuration, and deployment behavior. Record the checks that provide evidence for the changed risk.

Add a release-note entry when a user can observe the change. Internal refactoring, test-only work, and documentation-only work normally do not need a user-facing entry. The What's New delivery mechanism will be implemented in the product work plan; until then, describe the intended note in the pull request.
