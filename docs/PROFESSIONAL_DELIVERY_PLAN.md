# Professional Delivery Fast-Track

## Objective

Turn the current MVP repository into a repeatable, testable, deployable, and maintainable product foundation without adding functional requirements.

This is a foundation epic that temporarily precedes the product backlog in `docs/WORK_PLAN.md`. It does not redesign label workflows or add user-facing capabilities. Existing production behavior must remain available throughout the work.

## Success Criteria

The fast-track is complete when:

- A new contributor can use the documented Node version, install with `npm ci`, configure a safe local environment, migrate a non-production database, and run the application.
- One local command and one CI workflow run the required formatting, linting, Svelte/type checks, unit tests, production build, and isolated end-to-end tests.
- Automated tests cannot connect to the production database and remove all records they create, including after a failed test where practical.
- Preview/staging and production deployments use an explicit SvelteKit adapter, documented environment variables, controlled migrations, smoke checks, and a rollback procedure.
- Production has actionable error reporting, structured operational logs, availability checks, database backup/restore instructions, and a small incident runbook.
- Dependency updates, releases, security reports, and architectural decisions have clear repository procedures and owners.

## Scope Guardrails

Included:

- Repository standards and developer workflow.
- Automated quality gates and test isolation.
- Build, deployment, migration, release, and rollback practices.
- Observability, dependency maintenance, security maintenance, and operational documentation.

Excluded:

- New label types, templates, sizes, exports, catalogs, or customer workflows.
- Broad visual redesign.
- Multi-tenant or organization functionality.
- A full JavaScript-to-TypeScript rewrite. TypeScript can be introduced incrementally where it reduces risk.
- Refactoring unrelated product code solely to satisfy a preferred architecture.

## Working Method

Use the flow **Ready → In progress → Review → Done**. Complete one work package before starting another unless a dependency requires otherwise. Each task produces a repository artifact or a reproducible check.

For this epic, a task is Done only when:

- Its acceptance criteria pass locally and in the relevant CI/deployment environment.
- The supporting command or procedure is documented.
- No secret, personal data, generated report, or production test record is committed.
- Any lasting technical decision is captured in an Architecture Decision Record (ADR).
- Any known limitation is recorded as a follow-up task with an owner and priority.

## Current Baseline

Already present:

- `package-lock.json` and npm scripts for development, build, Drizzle migrations, and Playwright.
- Version-controlled Drizzle migrations.
- A Playwright configuration and one end-to-end label journey.
- README environment and authentication guidance.
- Architecture and GS1 requirement documents.
- A working Vercel production deployment.

Outstanding foundation gaps:

- No repository-pinned Node version or declared package-manager version.
- No formatter, linter, Svelte/type-check, or unit-test command.
- No continuous-integration workflow.
- End-to-end tests do not yet have a proven isolated database and complete failure-path cleanup.
- `adapter-auto` is still used instead of an explicit production adapter.
- Generated Playwright artifacts are present in the tracked working tree.
- No documented release, migration, rollback, backup/restore, incident, dependency-update, or vulnerability-reporting procedure.
- No application error-monitoring and operational logging standard.

## Agreed Delivery Architecture

Use the existing services with one clear responsibility each:

| Service/tool       | Responsibility                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| GitHub             | Source history, short-lived branches, pull requests, automated quality checks, dependency updates, and release records    |
| Vercel             | SvelteKit builds, selective feature previews, the stable staging deployment, production deployment, and deployment status |
| Neon               | PostgreSQL hosting for production, stable non-production work, and disposable automated-test databases                    |
| Drizzle schema     | The declared application database structure                                                                               |
| Drizzle migrations | The version-controlled history used to reproduce and advance every database environment                                   |
| Playwright         | Critical browser journeys against isolated test or preview environments                                                   |

Keep this as a one-person process: use pull requests as a review and evidence checkpoint, but do not add team ceremonies or approval roles that provide no value. GitHub Actions verifies changes; Vercel's Git integration performs deployments. Do not create a second deployment pipeline in GitHub Actions.

### Environment Model

Use two Neon projects to establish a privacy boundary. Drizzle migrations, rather than copies of production data, keep their schemas aligned.

```text
Neon production project
└── production branch               real customer data

Neon non-production project
├── main branch                     default non-production branch
├── staging branch                  stable preview/authentication verification
├── test-base branch                clean automated-test baseline
└── test/<run-id> branches          disposable CI data; deleted after each run
```

| Environment          | Code/deployment                                                                | Database                                                                                                                           | Data and lifecycle                                                                    |
| -------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Local development    | Local short-lived Git branch and SvelteKit server                              | An explicitly selected non-production branch                                                                                       | Synthetic; persistent but resettable                                                  |
| Automated test       | Pull-request commit on a GitHub runner                                         | Non-production disposable test branch, or an equivalent isolated Postgres instance when a Neon-specific behavior is not under test | Generated by the run and deleted afterward                                            |
| Pull-request preview | Selective Vercel preview for a feature or fix that benefits from hosted review | Shared non-production `staging` branch by default; manually isolated only when the change requires it                              | Synthetic; no automatic schema migration or destructive test execution                |
| Stable staging       | Vercel branch deployment on a stable staging domain                            | Non-production `staging` branch                                                                                                    | Synthetic production-like data; used when stable OAuth/CAPTCHA callbacks are required |
| Production           | Vercel Production from `master`                                                | Separate Neon production project/branch                                                                                            | Real customer data; persistent and access-restricted                                  |

Preview and test environments must never inherit or query production user data. Vercel Preview uses manually managed credentials for the fixed non-production `staging` branch. Vercel Production uses the separately connected production Neon resource. The application verifies the environment marker and Neon project identity before accepting either connection.

Do not connect the non-production Neon resource to all Vercel Preview deployments. That integration creates one persistent Neon branch per Git branch, even when a change does not affect the database. This exceeds the useful branch budget on the free plan and duplicates the disposable database isolation already provided by GitHub Actions. Dependabot branches skip the Vercel build through the project's Ignored Build Step; GitHub Actions remains their required validation. A feature preview may use the shared staging database when hosted review is valuable. Create a temporary isolated preview database manually only for a change that cannot safely share staging, and delete it after review.

Use Google's official reCAPTCHA test configuration and preview-only authentication secrets for ephemeral previews. Use the stable staging domain for complete Google OAuth, CAPTCHA-domain, cookie, and callback verification because dynamic preview URLs cannot be registered as exact OAuth callbacks safely.

### One-Person Change Flow

1. Select one ready task with acceptance criteria and create a short-lived branch from `master`.
2. Develop against an explicitly selected Neon non-production branch and run the fast local quality command.
3. Open a GitHub pull request as the review, traceability, and evidence record.
4. Run GitHub Actions quality checks. The E2E job creates a branch from `test-base`, uses synthetic data, and deletes the branch in its always-run cleanup step.
5. Use a Vercel feature preview only when hosted browser review adds value. Dependabot changes rely on GitHub Actions, and stable OAuth/CAPTCHA checks use `staging.sscc-labels.com`.
6. Inspect the diff, migration SQL, CI evidence, and any requested preview or staging smoke result.
7. Squash-merge only after required checks pass. Vercel builds the `master` commit for Production.
8. Apply any guarded, backward-compatible production migrations, satisfy Deployment Checks, and assign the production domain.
9. Run the production smoke checklist, review errors, record the release, and remove the short-lived Git branch and any manually created database branch.

Keep the persistent staging branch for release-critical verification that needs a stable domain or production-like callbacks. Routine dependency, workflow, and documentation changes should rely on GitHub checks without creating a hosted preview database.

### Drizzle and Migration Policy

Drizzle is the database schema authority. Keep a single schema and migration history for every environment:

```text
change Drizzle schema
        ↓
drizzle-kit generate
        ↓
review generated SQL
        ↓
commit schema + SQL + snapshot
        ↓
drizzle-kit check and migration tests
        ↓
drizzle-kit migrate on the target database
```

- Use `drizzle-kit generate` to create versioned SQL migrations and `drizzle-kit migrate` to apply them.
- Run `drizzle-kit check` in CI to detect migration-history conflicts.
- Do not use `drizzle-kit push` against development branches shared by deployments, previews, staging, or production. It may be used only for explicitly disposable local experiments that will be recreated from committed migrations.
- Do not make routine schema changes in the Neon SQL editor. Emergency SQL must be recorded immediately as a reviewed migration or incident recovery artifact.
- Commit the schema change, generated SQL, and Drizzle snapshot together.
- Keep synthetic seed scripts separate from schema migrations and make them refuse production targets.
- Test the complete migration history against an empty database and test pending migrations against the previous released schema.
- Serialize migrations per target database branch so two builds cannot migrate the same branch concurrently.
- Use expand-and-contract production migrations: add compatible structures, deploy code that uses them, backfill if needed, then remove obsolete structures in a later release.
- Treat application rollback and database recovery separately. Vercel can restore earlier application code; database changes use forward recovery or a verified Neon restore branch.

Keep `drizzle-orm/neon-http` as the default runtime driver for short serverless queries. During the SSCC concurrency fix, prefer a single atomic PostgreSQL operation if it can safely allocate and save the label. Adopt the session-capable Neon driver only if the final design requires an interactive transaction.

### Free-Plan Boundary

Use free allowances efficiently through concurrency cancellation, short artifact retention, one initial Playwright browser, one stable non-production database, disposable CI branches, and selective Vercel previews. Do not provision a persistent database branch for every Git branch. Before using the deployment to generate financial gain, review the current Vercel plan and terms. Vercel Hobby is currently limited to personal, non-commercial use, so commercial launch requires a suitable paid Vercel plan or an approved alternative host. Keep the application portable by using the explicit SvelteKit adapter and standard environment contracts.

## Work Packages

### PD-01 — Establish a Reproducible Baseline (complete locally)

Purpose: make every later change comparable and reproducible.

- [x] Record the currently supported production runtime, deployment target, database provider, and package manager in `docs/professional-delivery/PD-01_BASELINE.md`.
- [x] Safely assess and record the existing install, build, migration, and Playwright baseline without changing production data; defer unsafe database execution to PD-03.
- [x] Classify existing failures as dependency/security, compatibility, configuration, environment/test safety, deployment, or generated-artifact risks.
- [x] Pin Node.js 24.x LTS in the repository and declare npm 11.x with the tested package-manager version.
- [x] Confirm `npm ci` succeeds from a clean archive of the committed revision using the committed lockfile.
- [x] Reconcile `.env.example` and README variables with the values referenced by the application; document exposure and environment requirements without recording values.
- [x] Add a short support policy for Node and dependency upgrades.
- [x] Add centralized fail-fast validation for required production variables and verify its error behavior with non-secret placeholders.

Acceptance criteria:

- The same documented commands produce a clean install and build on a new checkout and in CI.
- The app fails clearly when a required production environment variable is absent.
- Production secrets and database URLs do not appear in tracked files or command output committed to the repository.

### PD-02 — Repository Hygiene and Developer Checks (quality gates complete locally)

Purpose: make quality expectations executable rather than informal.

- [x] Choose and configure Prettier with Svelte support; add `format` and `format:check` scripts.
- [x] Choose and configure ESLint using its current flat configuration and Svelte support; add a `lint` script.
- [x] Add `svelte-check` and a `check` script. Enable useful JavaScript checking first, then introduce TypeScript incrementally in new or high-risk modules.
- [x] Add Vitest for deterministic business-rule tests that do not require a browser or live database.
- [x] Create a single `quality` script that runs the fast local checks in a documented order.
- [ ] Ignore Playwright reports, test results, local storage, coverage, and environment files; remove generated artifacts from version control without deleting useful source fixtures. Ignore rules are complete; previously tracked Playwright artifacts have active changes from the test-cleanup work and must be removed when that work is consolidated without overwriting it.
- [x] Add `CONTRIBUTING.md` with setup, branch, commit, testing, migration, and review expectations.
- [x] Add a lightweight pull-request template containing purpose, risk, validation, migration, observability, and release-note checks.

Acceptance criteria:

- `npm run format:check`, `npm run lint`, `npm run check`, `npm run test:unit`, and `npm run build` all exit successfully.
- Generated reports do not appear in `git status` after the checks run.
- Formatting does not create a repository-wide unrelated rewrite; adoption is staged if necessary.

### PD-03 — Build a Risk-Based Test Pyramid

Purpose: protect the business-critical paths with the smallest useful test suite.

- [ ] Inventory the business rules and classify each check as unit, integration, or end-to-end.
- [ ] Add unit coverage for SSCC/check-digit rules, validation, date handling, and any deterministic PDF/layout calculations that can be tested without comparing implementation details.
- [ ] Add database integration coverage for SSCC uniqueness/allocation, label ownership, settings ownership, and migrations.
- [ ] Create the Neon non-production project and a dedicated test configuration that cannot access the production project. Require an explicit test marker in addition to environment-scoped credentials.
- [ ] Add synthetic, deterministic seed builders separate from Drizzle schema migrations; make seed and cleanup commands refuse production targets.
- [ ] Verify the complete committed Drizzle migration history against an empty disposable database and pending migrations against the previous released schema.
- [ ] Make Playwright start its own application server and isolated test database in local and CI runs.
- [ ] Finish the current Playwright account-cleanup work for success, post-signup failure, later failure, timeout, and interrupted-run leftovers.
- [ ] Keep the browser suite small: email signup/login, Google sign-in smoke testing where safely automatable, settings, preview/generation, history/download, and authorization boundaries.
- [ ] Define stable test data/builders and prohibit tests from relying on production users, production OAuth secrets, or execution order.
- [ ] Delete disposable Neon test branches in an always-run cleanup step and add a bounded cleanup job for run-owned branches left by interrupted workflows.

Acceptance criteria:

- Tests abort before execution if the configured database matches the production host/database or lacks the explicit test marker.
- Test and preview credentials cannot connect to the production Neon project.
- A failed end-to-end run leaves no run-owned users, accounts, sessions, settings, or labels after cleanup/recovery.
- Repeated local and CI runs are independent and give the same result.
- Test failures retain useful traces while successful runs do not dirty the repository.

### PD-04 — Add Continuous Integration

Purpose: prevent changes from bypassing the agreed quality gates.

- [ ] Add a GitHub Actions workflow triggered for pull requests and `master`, the current production/default branch.
- [ ] Use the pinned Node/npm versions and `npm ci`; cache only safe dependency data.
- [ ] Run formatting, linting, Svelte/type checking, unit tests, `drizzle-kit check`, fresh-database migration validation, incremental migration validation, and the production build.
- [ ] Run integration and Playwright tests against an ephemeral or otherwise isolated Postgres database.
- [ ] Upload test traces/reports only on failure with a defined retention period.
- [ ] Add dependency caching and job concurrency cancellation without hiding failures.
- [ ] Keep deployment ownership in Vercel's Git integration; do not deploy the application a second time from GitHub Actions.
- [ ] Trigger the deployed-preview Playwright/smoke job when Vercel reports the preview ready, and associate its result with the originating commit.
- [ ] Protect the default branch so required checks and review must pass before merge.
- [ ] Add a visible CI status badge after the workflow is stable.

Acceptance criteria:

- A clean pull request passes without access to production secrets or production data.
- GitHub and Vercel show one unambiguous result for each required check, and a preview test targets the deployment created from the same commit.
- Deliberate formatting, lint, unit, build, migration, and end-to-end failures are each detected by the expected job.
- A superseded CI run is cancelled and no CI-created database records remain afterward.

### PD-05 — Make Deployment and Migrations Repeatable

Purpose: make a release a controlled procedure rather than an implicit platform action.

- [ ] Record an ADR for the agreed GitHub/Vercel/Neon/Drizzle responsibilities, confirm Vercel as the current deployment target, and replace `adapter-auto` with the explicit supported SvelteKit adapter.
- [x] Create separate Neon production and non-production projects. Keep non-production `main`, `test-base`, and `staging` branches with synthetic data only.
- [x] Connect Vercel Preview to the fixed non-production `staging` branch through manually scoped variables and Vercel Production to the separate production Neon resource; enforce the boundary with environment and project-identity guards.
- [x] Disable automatic per-preview Neon branching. Use disposable CI branches for automated isolation and create a manual temporary preview branch only when a specific change requires it.
- [x] Configure the stable `staging.sscc-labels.com` domain for Google OAuth, real CAPTCHA-domain, callback, cookie, and logout verification.
- [ ] Maintain an environment-variable inventory with purpose, exposure (`public` or `server-only`), required environments, and rotation owner.
- [ ] Add migration scripts for generate, check, migrate, fresh-database verification, and previous-release verification; prohibit `push` in shared and production workflows.
- [ ] Verify committed Drizzle migrations in the disposable CI database before applying them through a guarded step to the shared staging database; never let arbitrary preview builds migrate shared staging automatically.
- [ ] Make the production release apply only reviewed, committed migrations through a guarded environment-aware step. A migration failure must stop the release.
- [ ] Document and verify the expand-and-contract migration sequence, including forward recovery and when a destructive cleanup is allowed.
- [ ] Add a non-destructive deployment smoke check covering the home page, login page, CAPTCHA rendering, and an authenticated health-critical path using a dedicated test account where appropriate.
- [ ] Use Vercel Deployment Checks to prevent production-domain promotion until the selected GitHub quality and release checks pass.
- [ ] Document the release flow from reviewed commit through preview verification, production deployment, smoke check, and release record.
- [ ] Document rollback for application code and forward-recovery for database migrations; do not rely on reversing a destructive migration.
- [ ] Verify custom domains, OAuth callbacks, CAPTCHA domains, security headers, and production environment scope after deployment.
- [ ] Review the Vercel plan before commercial launch and record whether to move to a commercial Vercel plan or an approved alternative host.

Acceptance criteria:

- Preview deployments cannot read or modify production data.
- A new empty Neon database reaches the current schema using only the committed Drizzle migration history.
- Preview and production report the expected Drizzle migration state for the deployed commit.
- A release can be reproduced from a specific commit and has a recorded result.
- A failed build, migration check, or smoke check prevents or clearly marks a failed release.
- The rollback/run-forward procedure has been rehearsed without affecting customer data.

### PD-06 — Add Operational Visibility

Purpose: detect and diagnose failures before relying on user reports.

- [ ] Define a structured logging contract: timestamp, severity, environment, operation, request/correlation ID, duration, outcome, and controlled error category.
- [ ] Exclude passwords, tokens, cookies, CAPTCHA responses, database URLs, emails, company names, and raw label contents from logs and telemetry.
- [ ] Select and document an error-monitoring approach with source maps, environment/release tags, alert ownership, and a free-tier/cost review.
- [ ] Add a minimal health/readiness endpoint that does not expose configuration or sensitive dependency details.
- [ ] Add uptime checks for the public application and a safe authenticated synthetic check if operationally justified.
- [ ] Define initial alerts for sustained availability failure, elevated server errors, failed releases, and database exhaustion/connection problems.
- [ ] Document how operational events and GA4 product analytics differ and where each is recorded.

Acceptance criteria:

- A deliberately generated server error can be found by release/environment and correlation ID without exposing sensitive data.
- The health and uptime checks detect an unavailable deployment.
- Every alert has a named response procedure and avoids alerting on a single harmless client error.

### PD-07 — Secure and Maintain the Supply Chain

Purpose: keep the foundation healthy after the fast-track ends.

- [ ] Add automated dependency-update pull requests with grouping and a controlled schedule.
- [ ] Enable dependency and secret scanning available for the repository host.
- [ ] Add `SECURITY.md` with supported versions, private vulnerability-reporting instructions, response expectations, and prohibited disclosure of user data.
- [ ] Review direct dependencies for maintenance, license, necessity, and replacement cost; record high-impact choices in ADRs.
- [ ] Define patch, minor, and major update rules and how security updates are expedited.
- [ ] Verify production secrets are scoped to the smallest environment and document a rotation/revocation checklist.
- [ ] Review HTTP security headers, authentication rate limits, session/cookie settings, authorization boundaries, and database least privilege.

Acceptance criteria:

- A dependency update is tested through the same CI gates as an application change.
- Secret scanning detects a safe test pattern or is otherwise verified using the provider's documented procedure.
- The repository explains how to report and handle a vulnerability without publishing secrets or personal data.

### PD-08 — Backups, Recovery, and Operating Runbooks

Purpose: make failures recoverable and routine maintenance understandable.

- [ ] Record the database provider's backup/PITR capability, retention, ownership, and recovery limits.
- [ ] Create and execute a restore drill into a non-production database; record elapsed time and verification results without copying unnecessary personal data.
- [ ] Define retention and cleanup for generated PDFs, previews, test artifacts, sessions, and operational logs.
- [ ] Add concise runbooks for failed deployment, failed migration, authentication outage, database outage, excessive errors, compromised secret, and storage exhaustion.
- [ ] Add a release checklist and a post-release verification checklist.
- [ ] Add an incident template with impact, timeline, containment, recovery, root cause, and follow-up actions.
- [ ] Assign a review cadence for dependencies, backups, alerts, access, runbooks, and supported runtimes.

Acceptance criteria:

- A non-production restore is completed and verified from documented steps.
- Each runbook identifies detection, immediate containment, recovery, communication, and escalation ownership.
- Scheduled maintenance tasks have a visible cadence and a responsible owner.

### PD-09 — Close the Foundation Epic

Purpose: prove the repository is ready to resume product delivery.

- [ ] Run the complete quality pipeline from a clean checkout.
- [ ] Deploy a release candidate to the isolated preview/staging environment and complete the smoke checklist.
- [ ] Release the foundation changes to production using the documented process and verify production without creating customer records.
- [ ] Review all temporary exceptions and convert unresolved risks into prioritized backlog items.
- [ ] Record baseline lead time, deployment result, test duration, and known operational limits for comparison after later releases.
- [ ] Publish a concise repository release note; add a user-facing What's New entry only for changes that affect users.

Acceptance criteria:

- CI, deployment, smoke checks, monitoring, and rollback/forward-recovery procedures have each been exercised.
- The default branch is protected by the agreed checks.
- No critical or high-risk foundation item remains undocumented.
- Product work can resume through the normal backlog and Definition of Done.

## Fast-Track Sequence

| Order | Package                          | Depends on         | Exit evidence                           |
| ----: | -------------------------------- | ------------------ | --------------------------------------- |
|     1 | PD-01 Reproducible baseline      | None               | Baseline record and pinned toolchain    |
|     2 | PD-02 Repository checks          | PD-01              | Local quality commands pass             |
|     3 | PD-03 Test pyramid and isolation | PD-01, PD-02       | Safe repeatable test run                |
|     4 | PD-04 Continuous integration     | PD-02, PD-03       | Required CI checks pass                 |
|     5 | PD-05 Deployment and migrations  | PD-01, PD-04       | Preview release and smoke evidence      |
|     6 | PD-06 Operational visibility     | PD-05              | Error/health signal verified            |
|     7 | PD-07 Supply-chain maintenance   | PD-04              | Update and security procedures verified |
|     8 | PD-08 Recovery and runbooks      | PD-05, PD-06       | Restore drill and runbooks verified     |
|     9 | PD-09 Epic closeout              | All prior packages | Foundation release completed            |

PD-06 and PD-07 can run in parallel after their dependencies are complete. Everything else should follow the sequence above to avoid automating an unsafe test or deployment process.

## First Execution Slice

Start with PD-01 and the non-disruptive parts of PD-02:

1. Capture the clean-checkout baseline and classify current failures.
2. Pin Node/npm and verify `npm ci` plus the existing build.
3. Reconcile environment documentation and protect generated artifacts.
4. Add formatter, linter, and Svelte/type checks with minimal code churn.
5. Establish the `quality` command before changing test or deployment behavior.

This slice creates the gate used to assess every remaining fast-track task.
