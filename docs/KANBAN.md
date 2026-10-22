# Product Kanban

Last reviewed: 2026-10-21 (America/Managua)

This is the only current source for work status and priority. Detailed requirements remain in the linked plans and runbooks, but their checklists do not determine what is active.

Product goal: maintain a useful free GS1 logistic-label tool that helps users complete clear shipping tasks and creates qualified opportunities for tailored implementations.

## Working Policy

- Flow: **Backlog → Ready → In progress → Review → Accomplished**.
- Work-in-progress limit: **one item** across In progress and Review.
- Select work by user value, data or standards risk, evidence, and effort.
- Every implementation item needs acceptance criteria, appropriate tests, a release note when user-visible, and a short entry in [`WORK_LOG.md`](./WORK_LOG.md).
- Keep private usage evidence in the git-ignored `usage_log/` directory.

## Work in Progress

None.

## Review

### `PRODUCT-001` — Saved products for repeat label creation

- Need: the proven repeat creator re-enters product data on every label despite a small set of known products; nothing in the product persists reference data. Private evidence: the dated usage reports in the git-ignored `usage_log/` directory.
- Outcome: a small per-account product list — product name, internal reference, and GTIN — that pre-fills product fields when creating a label. Shipment-specific values (lot, date, count, weight, addresses) remain per-label entries and are never stored in the product list.
- Acceptance: authenticated, owner-scoped product create/list/update/delete; the product number must contain 8, 12, 13, or 14 digits, and a failed GS1 check digit is a visible warning that does not block saving while a stored `gs1_valid` flag records whether the number is a valid GS1 code; labels keep rejecting invalid GTINs; selecting a product fills only product fields; deleting a product never changes saved labels, SSCCs, or template versions; measurement-plan event additions are implemented so analytics failures cannot block the workflow; a What's New entry is published and the guide mentions the product list.
- Evidence planned: `npm run quality` (unit tests for API scoping, validation, and product pre-fill), the CI end-to-end job against a disposable branch covering product creation through a saved label, and a focused browser check of the picker and empty state.
- Status: both increments are verified in CI and deployed to staging. The first is pull request #44 (merge commit `3afd0cf`), with migration `0009` applied by the guarded staging dispatch (run 39708947039). The owner-requested GS1 flag is pull request #46 (merge commit `1170df0`): the check-digit warning no longer blocks saving, and the `gs1_valid` column records GS1 validity, backfilled by migration `0010` (applied by guarded dispatch run 39710319104), verified by `npm run quality` (24 files, 179 unit tests) and CI run 39710106289. `staging.sscc-labels.com` serves the new deployment with no products errors recorded after the migration. Outstanding: the staging browser check of the uncorrected-number flow, migrations `0009`+`0010` on the developer database, and the guarded production migration before any merge into `master`.
- Dependencies: existing shared validation and label APIs; one new table and migration applied through the guarded procedure; measurement-plan event contract additions; no renderer, SSCC-allocation, or template-version change. Product deletion must never orphan label history.
- Source: [Work Plan §4](./WORK_PLAN.md#4-improvements) and private usage reports (`usage_log/`, git-ignored).

## Ready

Items are ordered. Start only the first item unless new evidence changes priority.

### `EXPORT-002` — Download saved labels as ZPL

- Need: users need a `.zpl` file for ZPL-compatible thermal printers.
- Outcome: download a saved label as PDF or ZPL, selecting 203, 300, or 600 dpi for ZPL without allocating another SSCC.
- Acceptance: authenticated, owner-scoped downloads; original template/layout and GS1 data preserved; supported printer resolutions use whole-dot barcode modules and checked quiet zones; user text cannot inject printer commands; visible download/retry controls; existing PDFs remain compatible; public guide explains PDF/ZPL downloads and the announcement appears in What's New and `/updates`.
- Evidence: `npm run quality` passes (19 files, 112 unit tests, Vercel build); focused browser ZPL/PDF download and retry check passes; 11 representative PDFs match the original renderer byte-for-byte; built public pages `/`, `/updates`, and `/guide` render the ZPL announcement and guidance.
- Status: prior review evidence retained; no AI implementation work remains; awaits developer closeout after the `PRINT-001` production release.
- Release: release note enabled and public guidance complete in app content; ready for developer review, merge, and deployment.
- Dependencies: existing saved-label/settings APIs and GS1 encoder; no migration, print bridge, or external rendering service. Physical printer verification remains `VERIFY-001`.
- Architecture: includes the `ARCH-001` shared-layout extraction needed by this concrete export.
- Source: user request on 2026-10-08; [ZPL export reference](./labels/ZPL_EXPORT.md).

### `UX-001` — Immediate history refresh and PDF recovery

- Need: a saved label is currently missing from history until its automatic PDF download succeeds, encouraging unnecessary SSCC creation after a download failure.
- Outcome: show the saved record immediately and explain how to download it from history without creating another SSCC.
- Acceptance: history refreshes after save confirmation while the PDF request is pending; HTTP/network download failures show saved-label recovery guidance; history downloads reuse the saved record; successful downloads and save failures retain their correct behavior.
- Status: returned to Ready while the user-requested ZPL export takes priority.
- Evidence planned: focused browser regression checks and `npm run quality`.
- Dependencies: existing save, history-list, and PDF-download APIs; no migration or new service.
- Source: [Work Plan §4](./WORK_PLAN.md#4-improvements).

| Order | ID             | Outcome                                                                                               | Why now                                                              | Detailed source                                                                      |
| ----: | -------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
|     3 | `DATA-001`     | Prevent SSCC reallocation for at least one year after shipment, with clear retention behavior         | GS1 identifier integrity and real-world data safety                  | [GS1 requirements](./GS1_REQUIREMENTS.md#allocating-serial-shipping-container-codes) |
|     4 | `FEEDBACK-001` | Add a categorized request path that separates suggestions from concrete tailored-project requirements | Converts user interest into actionable product and business evidence | [Work Plan §4](./WORK_PLAN.md#4-improvements)                                        |

## Backlog

| ID             | Theme                | Desired outcome                                                                                                | Notes or dependency                                                                                   |
| -------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `SEARCH-001`   | Existing labels      | Filter SSCC, GTIN, and lot search by creation date                                                             | Small user-facing improvement                                                                         |
| `INSIGHT-001`  | Product evidence     | Review Search Console and accumulated product events, then adjust priorities                                   | Requires enough usage data; do not infer adoption from clicks alone                                   |
| `FEEDBACK-002` | User research        | Interview or survey repeat creators, one-time creators, configured non-creators, and signup-only users         | Record task, printer, output, and obstacle without placing identities in Git                          |
| `LABEL-001`    | Identifier lifecycle | Make reprint of an existing logistic unit distinct from allocating a new SSCC                                  | Depends on lifecycle rules from `DATA-001`                                                            |
| `LABEL-002`    | Compatibility        | Preserve saved label data and renderer versions as settings and layouts evolve                                 | Existing `v1`–`v4` compatibility is the baseline                                                      |
| `WORKFLOW-001` | New labels           | Select the next scenario from repeated requests or a tailored engagement                                       | Candidates include AI (01), mixed units, perishables, and retailer-specific routing guides            |
| `DELIVERY-001` | Migrations/releases  | Complete fresh and incremental migration verification, release gates, smoke checks, and recovery documentation | Detailed delivery backlog remains in the professional plan                                            |
| `DELIVERY-003` | Migrations/releases  | Keep `staging` current with `master` and detect a stale staging deployment before it serves outdated code      | The `staging` branch fell sixteen commits behind in October 2026 and served a seventeen-day-old build |
| `OPS-001`      | Operations           | Add privacy-safe error monitoring, structured logs, readiness/uptime checks, and alerts                        | Keep operational telemetry separate from product analytics                                            |
| `SEC-001`      | Security             | Add `SECURITY.md`, scanning, secret rotation, access review, and auth/header/database review                   | Prioritize before commercial expansion                                                                |
| `RECOVERY-001` | Continuity           | Document provider recovery limits and run a non-production restore drill; add incident and outage runbooks     | Do not copy production personal data into the drill                                                   |

## Blocked or Deferred

| ID              | Item                                                                         | Reason to wait                                      | Resume condition                                              |
| --------------- | ---------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| `VERIFY-001`    | Print representative labels and verify them with a physical scanner/verifier | Required hardware is unavailable                    | Printer and suitable scanner/verifier available               |
| `ANALYTICS-001` | Compare update viewers, feature-link users, and later successful use         | Current cohort is small and coverage began recently | Enough external usage accumulates for a meaningful comparison |
| `AUTH-001`      | Apple OAuth and email verification                                           | No demonstrated user need yet                       | Repeated user/customer need or contractual requirement        |

## Accomplished

### `EXPORT-003` — Restore the label settings form removed by the Excel export

- Outcome: the Settings page offers the label settings form, the LAN printer settings, and the Excel data export together.
- Acceptance evidence: `npm run quality` passes (22 files, 151 unit tests, no Svelte diagnostics, TypeScript project check, and Vercel build); the CI end-to-end job applies migrations to a fresh branch and all 8 tests pass, including the label-settings save and persistence path; a local browser check confirms the form renders with all four fields, the Data Export button, and the LAN printer section.
- Release evidence: merged into `master` in pull request #40 on 2026-10-21 (commit `fa11edd`) and promoted to `staging` in pull request #41. The restored form is covered by the `data_export_excel` What's New entry; no separate announcement was published because the removal was never announced.
- Root cause: pull request #39 merged with a failed Quality check and a skipped end-to-end job, so the removed form was never exercised.

### `DEPS-001` — SvelteKit 3 upgrade

- Outcome: the application builds, type-checks, and runs on `@sveltejs/kit@3.0.0`; the `config_file_unsupported` failure that broke every build is resolved.
- Acceptance evidence: `npm run quality` passes (22 files, 151 unit tests, no Svelte diagnostics, TypeScript project check, and Vercel build); dev and preview servers return HTTP 200 for `/`, `/login`, `/signup`, and `/privacy`; the public reCAPTCHA key reaches the browser payload in both modes and the private database variable resolves without warnings.
- Release evidence: merged into `master` in pull request #40 on 2026-10-21 (commit `fa11edd`) and promoted to `staging` in pull request #41. No user-visible behavior change, so no What's New entry was required.

### `DELIVERY-002` — Developer database migration target in CI

- Outcome: a manually dispatched `dev` target applies the committed migrations to the developer database in the non-production Neon project.
- Acceptance evidence: the dispatch offers `dev`; the job accepts only the reviewed `master` or `staging` Git branches, targets the existing non-production `main` branch, uses the non-production Neon credential, needs no confirmation, and refuses to create a missing branch; a wrong branch name fails with the list of available branches; the run reports the resolved target, project, branch, and database environment. The `nonproduction` migration target and database environment pass the existing `resolveMigrationTarget` and `assertDatabaseEnvironment` guards.
- Release evidence: merged into `master` in pull request #40 on 2026-10-21 (commit `fa11edd`). On 2026-10-21 the developer dispatched the `dev` target from `master` and the migration applied successfully; the developer database then reported nine applied migrations and the `print_bridge_host`, `print_bridge_port`, `printer_hostname`, `printer_port`, and `printer_dpi` columns on `label_settings`. The same guarded job applied the pending staging migration after pull request #41.
- Decisions: the target is named `dev` because the database is the developer one rather than a deployed environment. It is restricted to the reviewed `master` and `staging` Git branches so unreviewed schema cannot reach the shared developer database. It requires no confirmation because the production project, credential, and confirmation field are never involved.

### `EXPORT-001` — Download all user data as Excel

- Outcome: a user can download their account details, company settings (including the GS1 company prefix), and every label they created as a single `.xlsx` file with "Account & Settings" and "Labels" sheets.
- Acceptance evidence: the export endpoint returns 401 without a session and 503 without a database, and scopes every query to the current user id; the response uses the `.xlsx` MIME type with a dated attachment filename and `private, no-store`; a successful export records a `data_export_succeeded` operational event with `documentFormat: 'xlsx'`. `npm run quality` passes (22 files, 151 unit tests, and Vercel build). No browser download of a generated workbook was performed, so the produced file contents are verified by code review only.
- Release evidence: merged into `master` in pull request #39 (commit `f1219f8`); the `data_export_excel` What's New entry is published from 2026-10-20 and reaches the home page, `/updates`, and the What's New panel.
- Dependencies: none; the exporter reads the existing user, label-settings, and label tables.

### `PRINT-001` — Send saved labels through the local print bridge

- Outcome: bridge setup guidance, per-user printer settings, connection check, and Print via bridge for saved labels; PDF/ZPL downloads and existing SSCCs are preserved.
- Acceptance evidence: prior `npm run quality` passed (151 unit tests and Vercel build); three focused mocked browser checks passed; migration snapshots contained only the five intended settings columns.
- Release evidence: on 2026-10-16 the developer reported production deployment and successful recovery through the guarded production migration workflow. The AI did not independently inspect production or execute the migration.
- Remaining hardware validation belongs to `VERIFY-001`; successful database recovery does not establish physical printer/scanner compatibility.
- Reference: [LAN printing](./labels/LAN_PRINTING.md).

### `DOC-002` — Document feature deployment from staging to production

- Outcome: a root-level deployment guide covering the current GitHub/Vercel/Neon flow, commands, documentation, verification, and recovery.
- Acceptance evidence: workflow/runbook cross-check complete; 56 local document links and 15 shell examples validated; Markdown formatting and `npm run quality` pass (151 unit tests and Vercel build). No E2E needed for documentation-only work.
- Release evidence: merged into `master` in commit `f521af6`; the guide is [HOW_TO_DEPLOY_A_NEW_FEATURE.md](../HOW_TO_DEPLOY_A_NEW_FEATURE.md).

| Area                | Delivered outcome                                                                                                                                                     | Evidence                                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Delivery foundation | Pinned Node/npm, local quality command, GitHub Quality and isolated E2E, guarded Neon environments, stable staging, Vercel adapter, and controlled dependency updates | [Professional delivery plan](./PROFESSIONAL_DELIVERY_PLAN.md), [runbook](./professional-delivery/PD-05_PREVIEW_ENVIRONMENT_RUNBOOK.md) |
| Authentication      | Email/password and Google sign-in, protected data, password recovery, logout refresh, and safe Google error recovery                                                  | [Password recovery runbook](./auth/PASSWORD_RECOVERY_RUNBOOK.md)                                                                       |
| Product analytics   | Privacy-safe GA4 events, persisted operational events, owner-only 7/30-day statistics, and private dated usage reports                                                | [Measurement plan](./analytics/MEASUREMENT_PLAN.md)                                                                                    |
| Label correctness   | Atomic SSCC allocation, shared validation, GS1-128 rendering, physical-dimension preflight checks, and legacy label compatibility                                     | [Architecture](./ARCHITECTURE.md)                                                                                                      |
| Supported workflows | Transport identification and identical-content logistic-unit flows with scenario-specific forms and 4 × 3, 4 × 6, and 6 × 8 PDF layouts                               | [Workflow reference](./labels/GUIDED_LABEL_WORKFLOWS.md)                                                                               |
| User guidance       | First-label onboarding, automated label checks, public What's New history, and a public supported-label guide with direct generator links                             | `/dashboard`, `/updates`, and `/guide`                                                                                                 |
| Documentation flow  | One authoritative Kanban board, concise AI handoffs, reconciled repository documentation, and a token-efficient AI read order                                         | `DOC-001`; `AGENTS.md`, `docs/KANBAN.md`, and `docs/WORK_LOG.md`                                                                       |

## Documentation Map

Use this map to avoid loading every Markdown file into an AI session.

| Document                                                                     | Role                                                                                 |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [`../AGENTS.md`](../AGENTS.md)                                               | Stable AI collaboration rules and read order                                         |
| [`KANBAN.md`](./KANBAN.md)                                                   | Current priority and status; authoritative board                                     |
| [`WORK_LOG.md`](./WORK_LOG.md)                                               | Concise dated handoffs and decision evidence                                         |
| [`WORK_PLAN.md`](./WORK_PLAN.md)                                             | Detailed product analysis and candidate requirements                                 |
| [`PROFESSIONAL_DELIVERY_PLAN.md`](./PROFESSIONAL_DELIVERY_PLAN.md)           | Detailed delivery, security, operations, and recovery backlog                        |
| [`../README.md`](../README.md)                                               | Setup, stack, environment contract, and repository entry point                       |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md)                                   | Branch, quality, PR, dependency, and release workflow                                |
| [`../HOW_TO_DEPLOY_A_NEW_FEATURE.md`](../HOW_TO_DEPLOY_A_NEW_FEATURE.md)     | Staging-to-production release steps, migration commands, and documentation checklist |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)                                       | Current system structure and durable technical constraints                           |
| [`GS1_REQUIREMENTS.md`](./GS1_REQUIREMENTS.md)                               | SSCC allocation and aggregation rules                                                |
| [`GS1_LOGISTIC_LABEL_GUIDE.md`](./GS1_LOGISTIC_LABEL_GUIDE.md)               | App-specific analysis of the source GS1 guideline                                    |
| [`labels/GUIDED_LABEL_WORKFLOWS.md`](./labels/GUIDED_LABEL_WORKFLOWS.md)     | Current workflow inputs, AIs, layouts, and compatibility                             |
| [`PRIVACY.md`](./PRIVACY.md)                                                 | Canonical repository privacy statement                                               |
| `analytics/*.md`, `auth/*.md`, `professional-delivery/*.md`                  | Focused measurement, authentication, environment, and baseline runbooks              |
| [`PACKAGE_ANALYSIS_SEP_24.md`](./PACKAGE_ANALYSIS_SEP_24.md)                 | Historical package snapshot; not a current status source                             |
| [`../.github/pull_request_template.md`](../.github/pull_request_template.md) | Pull-request review checklist                                                        |

Ignored `.aider*` files are generated local AI-tool history and are not project documentation.
