# AI Work Log

This is a concise handoff log for meaningful work increments. It is not a chat transcript, command history, backlog, or release history. Current priority and state belong in [`KANBAN.md`](./KANBAN.md); user-visible releases belong in `src/lib/content/releases.ts`.

## Entry Format

Keep the newest entry first and include only:

- Date and Kanban ID.
- Result or current state.
- Decisions that future work must preserve.
- Material files or migrations.
- Validation evidence.
- One next action or blocking condition.

Never include secrets, personal data, production records, private usage statistics, reset links, database URLs, or raw command output.

## 2026-10-28 — `RENDER-001` — PDF label rendering consistency improvements

- Result: standardized separator stroke hierarchy, added 4 pt text clearance, made field labels bold, widened count and gross-weight cells, and wrapped long PO numbers in structured labels.
- Decisions: major separators use 1.5 pt, minor separators and dividers use 0.8 pt, outer borders remain 1.2 pt. Long PO numbers wrap to two lines instead of shrinking below 8 pt. Representative PDFs are generated under `.output/representative-pdfs` and are not committed.
- Material files: `src/lib/server/labels/layout.js`, `tests/unit/labelGenerator.test.js`, `scripts/render-representative-pdfs.js`, `package.json`.
- Validation: `npm run quality` passes (27 test files, 198 tests, TypeScript check, and Vercel build); `npm run lint` and `npm run format:check` pass.
- Next: developer creates the feature branch, runs `npm run quality`, opens the PR, and merges.

## 2026-10-22 — `UX-002`/`UX-003`/`PRODUCT-001` — Production release

- Result: the app shell, dedicated product and printer pages, saved products with brand and net content, and validated label settings are live on `www.sscc-labels.com`. Release notes for the app shell, saved products, and settings validation are published and visible on production `/updates`.
- Release evidence: production migrations `0009`–`0011` were applied from the reviewed `staging` tip (`b8da923`) by guarded run 39882279880 before merge. Release PR #48 passed Quality and E2E (run 39882274786), was squash-merged as `56c1a7f`, and Vercel Production deployed it. The `master` push CI run also passed. Anonymous production checks return 200 for `/` and `/updates` and redirects for the application routes.
- Decisions: the saved-products note was published with the release and its destination corrected from `/settings` to `/products`; a separate fix note was added for inline settings validation. Production ledger verification was indirect: the previous production migration run (38948947047) applied the `master` migration set ending at `0008`, and no later production migration ran before this release.
- Remaining: developer-authenticated production smoke (settings save, product create/edit, label history downloads). The developer database migrations `0009`–`0011` were applied by guarded run 39882741690.
- Material files: `src/lib/content/releases.ts`, `docs/KANBAN.md`.

## 2026-10-22 — `UX-003` — Settings form fix and local end-to-end verification

- Result: `/settings` renders and saves again, and the full Playwright suite passes locally (9/9) against the developer Neon branch. The blocker was the Superforms adapter: `zod@4` was paired with the Zod v3 adapter, so `/settings` returned 500 and the label-preview and products specs timed out.
- Decisions: `labelSettingsSchema` mirrors `validateLabelSettings` — 4–12 digit company prefix and the prefix-dependent serial ceiling — so invalid input is reported inline instead of as a save failure. The unused `productSchema` was deleted; product validation stays in `src/lib/server/db/products.js`. The settings form action records the same `company_settings_saved`/`workflow_failed` operational events as `POST /api/settings` and derives `setup_type` from `is_configured`. Decorative required asterisks in the product form are `aria-hidden`, and `tests/products.spec.js` now locates the field with `/^GTIN/` because the label text is `GTIN *`. `tests/label-preview.spec.js` derives a per-run GS1 company prefix so SSCCs from earlier runs on a persistent database cannot collide.
- Material files: `src/lib/validation/schemas.js`, `src/routes/(app)/settings/+page.server.js`, `src/routes/(app)/settings/+page.svelte`, `src/lib/components/Labels/SavedProducts.svelte`, `tests/products.spec.js`, `tests/label-preview.spec.js`, `tests/unit/labelSettingsSchema.test.ts`.
- Validation: `npm run quality` passes (25 files, 188 unit tests, TypeScript check, Vercel build; the two Svelte warnings predate this work); `npx playwright test` passes 9/9 locally. Stale end-to-end test accounts left on the developer database by interrupted runs were removed before the passing run.
- Next: released to production in PR #48; see the 2026-10-22 production release entry.

## 2026-10-22 — `UX-002` — Public and application route groups with a dark-mode shell

- Result: the app is split into `(public)`, `(auth)`, and `(app)` SvelteKit route groups. Public pages use a top marketing header and footer; the authenticated workspace uses a fixed left sidebar (Dashboard, Label Generator, Saved Labels, owner Statistics, Settings) with an account header for profile and logout. Dark mode is class-based, applies before first paint, and is available from a shared toggle on every shell. The generator now uses a split-pane layout with the form on the left and the live thermal preview on the right at `lg` and above.
- Decisions: URLs are unchanged (route groups do not affect paths) and no redirect table was added. `src/routes/+layout.svelte` keeps only `app.css`, analytics, and theme initialization; each group owns its shell. `src/routes/(app)/+layout.server.js` guards the whole application group while the global hook keeps its path list as defense in depth, so a future `(app)` page is protected without editing the hook. The theme lives in `src/lib/theme/theme.svelte.js` with the storage key duplicated in the pre-paint script in `src/app.html`; the two must stay in sync. `Navbar.svelte` and `ProtectedRoute.svelte` were removed. Palette-based Tailwind tokens are kept for the few intentionally fixed surfaces (label preview and diagram, hero buttons); everything else uses the palette tokens with `dark:` variants because the print preview and the guide diagram must not change with the theme. Zod and Superforms are deliberately not part of this item; the shared validation modules are the seam they will replace.
- Material files: `src/app.css`, `src/app.html`, `src/routes/+layout.svelte`, `src/routes/(public)/`, `src/routes/(auth)/`, `src/routes/(app)/`, `src/lib/components/Layout/`, `src/lib/theme/theme.svelte.js`, `tests/label-preview.spec.js`, `package.json` format scope, `docs/ARCHITECTURE.md`, `docs/KANBAN.md`.
- Validation: `npm run quality` passes (24 files, 179 unit tests, no Svelte diagnostics, TypeScript project check, and Vercel build); a focused browser check confirmed the public and application shells in both themes, the class-based `dark` state and pre-paint restore, the sidebar drawer sliding from `x = -288` to `0` at a 390 px viewport, the generator split pane, and the post-sign-up client-side redirect with the account shown in the new header and sidebar.
- Release: the `2026-10-22-app-shell-and-dark-mode` What's New entry is published from 2026-10-22 and reaches the home page, `/updates`, and the What's New panel.
- Next: released to production in PR #48; see the 2026-10-22 production release entry.

## 2026-10-21 — `PRODUCT-001` — GS1 validity flag for saved products

- Result: a product number that fails the GS1 check digit now saves with a visible warning, and a new `gs1_valid` column records whether the stored number is a valid GS1 code. Labels still reject invalid GTINs.
- Decisions: the owner asked to keep the warning without blocking the save (2026-10-21). The 8/12/13/14-digit format remains a hard validation error; the check digit becomes a soft warning; the stored value stays in the padded 14-digit form; the flag is recomputed whenever the number changes; migration `0010` backfills existing rows with the same mod-10 formula the application uses; per-account GTIN uniqueness and label-side GTIN validation are unchanged, and the label picker annotates saved numbers that are not valid GS1 GTINs.
- Material files: `src/lib/server/db/schema.js`, `src/lib/server/db/products.js` (+ `.d.ts`), `src/lib/components/Labels/SavedProducts.svelte`, `src/lib/components/Labels/LabelForm.svelte`, `drizzle/0010_superb_dreadnoughts.sql` plus snapshot and journal, the unit and end-to-end tests, `docs/ARCHITECTURE.md`, and `docs/KANBAN.md`.
- Validation: `npm run quality` passes (24 files, 179 unit tests, no Svelte diagnostics, TypeScript project check, and Vercel build); the backfill formula was checked against the application's validator on valid and invalid GTIN examples; the end-to-end spec covers the warning, the save, the stored flag, and the flagged row on the disposable branch.
- Release: merged into `staging` in pull request #46 (merge commit `1170df0`), and the guarded staging dispatch (run 39710319104) applied migration `0010` immediately after the merge. `staging.sscc-labels.com` serves the new deployment with no products errors recorded after the migration.
- Next: released to production in PR #48; migrations `0009`–`0011` were applied to production before the merge. The developer database migration remains a separate dispatch.

## 2026-10-21 — `PRODUCT-001` — Staging database migration completed after products 500s

- Result: migration `0009` is now applied to the persistent staging Neon branch, and staging products requests can succeed again.
- Diagnosis: staging returned "Failed to load products" with runtime logs showing `NeonDbError: relation "product" does not exist` (Postgres `42P01`) for both `GET` and `POST /api/products`. The migration dispatch the developer had run (CI run 39705748244 at 01:27Z) predated the feature commits (first push 01:36Z, pull request #44 merge 01:49Z), so the staging database was at migration `0008` when the new code deployed. This matches the deployment guide's warning that a green build does not prove the schema migrated.
- Decisions: fix the environment rather than the code — the endpoint error path behaved as designed (generic 500, no data exposure). The guarded dispatch ran from the `staging` Git branch with target `staging` after the merge, which is the documented sequence: migration dispatches must follow the merge that carries the migration.
- Validation: CI run 39708947039 resolved target `staging`, the nonproduction project and `staging` database branch, and reported "migrations applied successfully". Anonymous requests still receive 401 from the authentication guard, so final confirmation is the developer reloading the staging Settings page behind sign-in.
- Material files: none. No code, schema, or migration file changed.
- Next: the developer reloads the staging Settings page to confirm the products list loads, then the browser check, developer database migration, and guarded production migration complete the item.

## 2026-10-21 — `PRODUCT-001` — Staging promotion after an E2E locator fix

- Result: the saved-products feature is on `staging.sscc-labels.com` through pull request #44 into `staging` (merge commit `3afd0cf`), with the CI Quality and end-to-end jobs passing and the staging database migrated by the developer beforehand.
- Diagnosis: the first end-to-end run timed out because the row locator filtered by product name stopped matching once the row entered edit mode — the name then lives in an input value instead of the row text. Rows now carry a stable `data-product-id` attribute and the spec captures each product id from its creation response; the rerun finished in 79 seconds covering create, edit, confirm-delete, picker-filled label creation through history, and delete-without-touching-labels.
- Decisions: the release note stays draft until the production release, so the staging `/updates` page does not announce the feature yet; the web app branch policy keeps feature-branch pushes deployment-free, and the staging deployment only followed the merge.
- Material files: `src/lib/components/Labels/SavedProducts.svelte`, `tests/products.spec.js`.
- Validation: `npm run quality` passes locally; CI run 39707668320 passes Quality and E2E with the committed migrations applied to a disposable branch; `staging.sscc-labels.com/guide` renders the saved-products section, `/` returns 200, and `/updates` hides the draft note.
- Next: the developer confirms the staging picker in a browser behind authentication, applies migration `0009` to the developer database, and completes the guarded production migration before merging into `master`.

## 2026-10-21 — `PRODUCT-001` — Saved products implemented

- Result: per-account saved products (product name, internal reference, GTIN) with a Settings manager, an owner-scoped `/api/products` API, and a label-form picker that fills the GTIN of an identical-contents label.
- Decisions: products store the padded 14-digit GTIN and are unique per account (`product_user_gtin_uidx`), so duplicate GTINs return a friendly validation error instead of a database failure. Selecting a product fills only the GTIN; shipment values stay per label, and deleting a product never touches saved labels or SSCCs. `product_saved` is recorded server-side as first product or update and mirrored in the browser, `product_selected` records picker adoption, and analytics failures never block the workflow. The What's New entry stays draft until release.
- Material files: `src/lib/server/db/schema.js`, `src/lib/server/db/products.js` (+ `.d.ts`), `src/routes/api/products/`, `src/lib/components/Labels/SavedProducts.svelte`, `src/lib/components/Labels/LabelForm.svelte`, `src/routes/labels/+page.svelte`, `src/routes/settings/+page.svelte`, `src/routes/guide/+page.svelte`, `src/lib/analytics/events.ts`, `src/lib/server/analytics/operationalEvents.js`, `src/lib/content/releases.ts`, `drizzle/0009_rich_cable.sql` plus snapshot and journal, the new unit and end-to-end tests, the cleanup helper, `docs/analytics/MEASUREMENT_PLAN.md`, `docs/ARCHITECTURE.md`, and `docs/KANBAN.md`.
- Validation: `npm run quality` passes (24 files, 177 unit tests, no Svelte diagnostics, TypeScript project check, and Vercel build); dev-server smoke checks returned HTTP 200 for `/`, `/guide`, `/updates`, and `/privacy`, redirects for protected pages, the guide section renders, and the draft release note stays hidden. The new end-to-end spec awaits the CI disposable-branch run; no database migration was applied by this session.
- Next: the developer applies migration `0009` to the developer database, opens the pull request so CI runs the end-to-end suite, and performs the focused browser check of the picker before the item moves to Review.

## 2026-10-21 — `PRODUCT-001` — Saved products selected as the next feature

- Result: the owner reviewed the board, work plan, work log, and the private September usage evidence, then chose saved products as the next implementable feature. `PRODUCT-001` moved from Backlog to the first Ready item with need, outcome, acceptance evidence, and dependencies defined; `EXPORT-002` stays in Ready as a developer closeout with no remaining AI implementation work, and `DATA-001`/`FEEDBACK-001` follow it.
- Decisions: the product list stays minimal — product name, internal reference, GTIN — and is stored separately from label rows; selecting a product pre-fills only product fields, while shipment-specific values remain per-label entries; deleting a product never touches saved labels, SSCCs, or template versions. Measurement-plan event additions and a What's New entry are part of the item, not follow-ups.
- Evidence: the decision used the dated private usage reports in the git-ignored `usage_log/` directory (one repeat creator re-entering a small set of products on most labels, most external users stopping before or at first label). Fresh production aggregates were not pulled for the decision because the production database credential is a Vercel sensitive variable the CLI cannot export; the owner can compare this decision against `/admin/statistics` and a dated usage report when one is next saved.
- Material files: `docs/KANBAN.md` only. No code, schema, or migration change.
- Validation: documentation-only change; Markdown links and formatting kept valid. No E2E needed.
- Next: developer review of the item definition, then an implementation session moves `PRODUCT-001` into Work in progress.

## 2026-10-21 — `DELIVERY-002` — Developer database migration and staging promotion

- Result: the developer database and the staging database are both migrated to the committed journal, and `staging.sscc-labels.com` serves the current release again.
- Diagnosis: the `staging` Git branch had been left at pull request #30 from 2026-10-05, so the Vercel Preview deployment behind `staging.sscc-labels.com` was seventeen days old and was missing the LAN print bridge feature, the Excel export, the SvelteKit 3 migration, and the restored label settings form. The staging database had also not been migrated since 2026-09-29, so migration `0008` and the five printer columns on `label_settings` were missing there. The `dev` dispatch updated the developer database only, because it targets a different Neon branch.
- Decisions: promote `master` to `staging` with pull request #41 instead of merging the individual features, because `staging` was a strict ancestor of `master` and one promotion carried every pending change with no unrelated work to reconcile. The staging migration was dispatched immediately after the merge, so the interval in which the new code ran against the old schema was about one minute. Migration `0008` only adds columns with defaults, so it is backward-compatible with the code that was deployed on staging.
- Material files: `docs/KANBAN.md` records the closed items. No application code, schema, or migration file changed.
- Validation: pull request #41 passed GitHub Quality and the isolated end-to-end job; the staging migration run reported the resolved target and then "migrations applied successfully"; `staging.sscc-labels.com` now resolves to the `git-staging` preview deployment created from the promotion, with the Vercel deployment status Ready; the developer database reports nine applied migrations and the five printer columns on `label_settings`. The staging pages themselves sit behind Vercel deployment protection, so a browser smoke test by the developer is still outstanding.
- Next: the developer confirms the staging pages in a browser, and the next feature is promoted to `staging` before it reaches `master`.

## 2026-10-21 — `DELIVERY-002` — Developer database migration target in CI

- Result: the CI workflow now offers a `dev` migration target. A manually dispatched run applies the committed migrations to the developer database in the non-production Neon project, which until now no target could reach.
- Decisions: the target is named `dev` because the database is the developer one behind `.env.local`, not a deployed environment. It is accepted only from the reviewed `master` or `staging` Git branches, so unreviewed schema cannot reach the shared developer database. It uses the non-production Neon credential, the `nonproduction` database environment, and needs no confirmation, so the production project stays unreachable from it. The job still loads an existing branch and refuses to create one, and it now lists the available branch names when the expected branch is missing. The job name is static because the `inputs` context is not evaluable in a job name on push and pull request events, which is what made the old name render as a literal expression there and made the dispatch-only job look like it was not running. The resolved target, project, branch, and database environment are reported by a step that also writes to the run summary.
- Diagnosis: the migration job was never broken. It is `workflow_dispatch` only by design, so pushes and pull requests skip it, and its input offered just `staging` and `production`. The developer database was therefore never migrated by GitHub and drifted three migrations behind the committed journal.
- Material files: `.github/workflows/ci.yml`, `HOW_TO_DEPLOY_A_NEW_FEATURE.md`, `docs/professional-delivery/PD-05_PREVIEW_ENVIRONMENT_RUNBOOK.md`, `docs/KANBAN.md`.
- Validation: the workflow file parses and passes the repository Prettier check; the `nonproduction` migration target and database environment pass the existing `resolveMigrationTarget` and `assertDatabaseEnvironment` guards; a read-only query confirmed the developer database belongs to the non-production project. No migration was executed and no branch was created.
- Next: developer review and merge of pull request #40, then dispatch **Actions → CI → Run workflow → branch `master` → target `dev`** to bring the developer database up to date.

## 2026-10-21 — `EXPORT-003` — Restore the label settings form removed by the Excel export

- Result: the Settings page again offers the company name, GS1 Company Prefix, extension digit, and next serial reference form together with the LAN printer settings, while keeping the Excel data export added in pull request #39. The page is rebuilt with the Tailwind classes the rest of the application uses instead of a scoped stylesheet.
- Decisions: the export was meant to be added to the Settings page, not to replace it, so the form is restored rather than the export removed. The `/sign-in` redirect introduced by the same change now points to `/login`, which is the real login route, and the page title follows the application convention again. No schema, API, or analytics change was needed because the settings API and persistence layer were never affected.
- Root cause: pull request #39 merged with a failed Quality check and a skipped end-to-end job, so the removed form was never exercised. Pull request #40 is the first change where Quality passes, so the end-to-end suite ran and reported the missing fields.
- Material files: `src/routes/settings/+page.svelte` and `src/routes/settings/+page.server.js`.
- Validation: `npm run quality` passes (22 files, 151 unit tests, no Svelte diagnostics, TypeScript project check, and Vercel build). A local browser check against the development server confirms the form renders with all four fields, the Data Export button, and the LAN printer section. The CI end-to-end job applies migrations to a fresh branch and all 8 tests pass, including the label-settings save and persistence path; the local check could not complete that path because the configured development database is three migrations behind.
- Next: developer review, merge, and deployment of pull request #40; the development database still needs `npm run db:migrate` for local use.

## 2026-10-21 — `EXPORT-001` — Excel export announcement and board correction

- Result: the user data export, already merged into `master` in pull request #39 (commit `f1219f8`), is now announced in What's New and `/updates`, and `EXPORT-001` moved from Backlog to Accomplished. The exporter itself was not changed.
- Decisions: publish the announcement under the existing `data_export_excel` feature key using the wording reviewed on the earlier export branch, dated 2026-10-20 to match the merge. The gap was announcement and board state, not behavior, so no export or schema work was repeated.
- Material files: `src/lib/content/releases.ts` (one published entry) and `docs/KANBAN.md` (board entry). No migration, no schema change, and no runtime behavior change.
- Validation: `npm run quality` passes (22 files, 151 unit tests, no Svelte diagnostics, TypeScript project check, and Vercel build). The new entry sorts ahead of the 2026-10-15 entry and the home page still lists two recent updates. A browser download of a generated workbook was not performed.
- Next: developer review and merge of the SvelteKit 3 branch, then deployment so the announcement becomes visible.

## 2026-10-21 — `DEPS-001` — SvelteKit 3 upgrade

- Result: the application builds, type-checks, and runs on `@sveltejs/kit@3.0.0`; the `config_file_unsupported` failure that broke `npm run quality` is resolved.
- Decisions: adapter configuration moved from `svelte.config.js` into the `sveltekit(...)` Vite plugin; internal imports use the `#lib` subpath alias declared in `package.json` with explicit file extensions; environment variables are declared once in `src/env.js` and imported by name from `$app/env/private` and `$app/env/public`; framework-level validators stay optional so `validateServerEnvironment()` remains the production gate; `cookie` moves to 2.0.1, the version Kit 3 declares, after a differential check confirmed the previous 1.1.1 pin was behaviorally identical for every function Kit uses; `json()` from `@sveltejs/kit` is retained because it also sets `content-length`.
- Material files: `vite.config.js`, `package.json`, `jsconfig.json`, `tsconfig.check.json`, `README.md`, new `src/env.js`, and 49 source files updated for the `#lib` alias and the Kit 3 environment modules; `svelte.config.js` deleted.
- Validation: `npm run quality` passes (22 files, 151 unit tests, no Svelte diagnostics, TypeScript project check, and Vercel build); dev and preview servers return HTTP 200 for `/`, `/login`, `/signup`, and `/privacy`; the public reCAPTCHA key reaches the browser payload in both modes and the private database variable resolves without warnings.
- Next: developer review, merge, and deployment. The work is committed on `fix/sveltekit-3-migration`, branched from `origin/master`; pushing, the pull request, the merge, and any deployment remain developer actions. No migration was executed.

## 2026-10-16 — `DOC-002` — Feature deployment guide

- Result: added root-level `HOW_TO_DEPLOY_A_NEW_FEATURE.md` and linked it from contributor guidance, the environment runbook, and the Kanban documentation map.
- Decisions: document the current manual release gates rather than imply CI enforces them; distinguish staged-revision quality checks, shared-database migrations, production promotion, recovery, and required documentation. Include workflow cancellation and branch synchronization caveats.
- Release context: the developer reported successful production migration recovery for `PRINT-001`; its Kanban entry now records that release evidence while physical hardware validation remains under `VERIFY-001`. Production was not independently inspected.
- Validation: Markdown formatting, 56 local document links, and shell syntax for all 15 command examples pass; `npm run quality` passes (151 unit tests, no Svelte diagnostics, and Vercel build). No E2E needed for documentation-only changes.
- Next: developer review and merge of the guide; no Git, migration, or deployment actions were executed.

## 2026-10-16 — `PRINT-001` — Web-printing explanation and setup tutorial

- Result: the public guide and LAN printer settings explain browser → local bridge → network printer, with download and setup-guide links. The bridge-owned [tutorial](https://github.com/JamesBolanos/print-bridge/blob/main/DOCS/sscc-labels-setup.md) covers macOS/Windows installation, origins, address/port/DPI setup, first print, upgrades, and troubleshooting.
- Decisions: keep installation instructions in the bridge repo; explain that Test bridge connection checks the listener, not paper output. Site copy distinguishes the computer address from the printer address. No printing behavior or schema changes in this increment.
- Validation: `npm run quality` passes (151 tests, Vercel build); both Svelte components pass autofixer; tutorial links and instructions checked against source. Bridge documentation published in commit `1b56549`; no installer release needed.
- Next: developer review/deployment of the label-maker changes and their previously generated settings migration.

## 2026-10-15 — `PRINT-001` — Bridge download and defaults

- Result: added a GitHub installer download link to LAN printer settings and instructions distinguishing fresh installs from upgrades.
- Decisions: bridge v1.0.0-beta.4 defaults allow the apex and www HTTPS label-maker origins; existing bridge configurations remain untouched. Link targets the latest GitHub release for macOS Apple silicon and Windows 64-bit installers.
- Validation: label-maker `npm run quality` passes (151 tests and Vercel build); Svelte autofixer is clean. Bridge `make check` and `make lint` pass, including CORS and saved-origin preservation tests.
- Release verified 2026-10-16: [Print Bridge v1.0.0-beta.4](https://github.com/JamesBolanos/print-bridge/releases/tag/v1.0.0-beta.4) published both installers; GitHub CI and installer workflows passed. Existing bridge settings are preserved on upgrade.
- Next: developer review/deployment of the label-maker changes with their settings migration.

## 2026-10-15 — `PRINT-001` — Review

- Result: saved-label LAN printing through the local bridge, per-user printer settings, and a connection check. PDF/ZPL downloads and label generation are unchanged.
- Decisions: independent printer-settings PATCH preserves the SSCC sequence; browser sends the existing ZPL exactly once, with explicit printer port and saved DPI; virtual capture and uncertain delivery are shown separately. No print-job tables or physical-print confirmation records.
- Material files: printing client and validation, printer-settings component, history action, settings API/persistence, loopback CSP, and generated `0008_print_bridge_settings.sql` plus snapshot/journal. Migration changes only five columns in `label_settings`.
- Validation: `npm run quality` passes (22 files, 151 tests, Vercel build); three mocked Playwright checks pass on dedicated port 5187, including the app CSP and existing PDF/ZPL downloads. Svelte autofixer reports no issues. No database or physical printer was used by these checks.
- Next: developer review, guarded migration testing/application, and deployment; verify the deployed HTTPS origin with the installed bridge and physical printer. Migration has been generated, not applied.

## 2026-10-08 — `EXPORT-002` — Public guidance ready for review

- Result: enabled the ZPL announcement in What's New and `/updates`; the home feature card and public guide now explain PDF/ZPL downloads.
- Decisions: users choose a printer resolution in Saved labels and send the downloaded file through their printer software; guidance explains SSCC reuse, label sizes, and PDF print scale. Publishing app content does not deploy the site.
- Material files: `src/lib/content/releases.ts`, `src/routes/guide/+page.svelte`, and `src/routes/+page.svelte`.
- Validation: `npm run quality` passes (19 files, 112 unit tests, Vercel build); direct requests to the built server confirm the ZPL announcement and guidance on `/`, `/updates`, and `/guide` without database access.
- Next: developer review, merge, and deployment to make the feature and its announcement available on the live site.

## 2026-10-08 — `EXPORT-002` — Review

- Result: saved-label ZPL downloads with 203/300/600 dpi selection, owner-scoped access, retryable download errors, and existing SSCC reuse.
- Decisions: PDF and ZPL share versioned layouts and GS1-128 encoding; ZPL uses whole-dot graphic bars and escaped UTF-8 text. No migration, external rendering service, or direct printer delivery. Release note remains draft until release.
- Material files: shared `src/lib/server/labels/layout.js`, ZPL adapter and download endpoint, history controls, and `docs/labels/ZPL_EXPORT.md`.
- Validation: `npm run quality` passes with 19 files and 112 unit tests, including 24 new renderer/endpoint checks; focused browser download/retry check passes; 11 representative original/refactored PDFs match byte-for-byte. Physical printer/scanner verification remains unavailable.
- Next: developer review and merge; publish the draft release note when released.

## 2026-10-05 — `DOC-001` — Accomplished

- Result: audited tracked Markdown and consolidated current status into a WIP-limited Kanban board.
- Decisions: `docs/KANBAN.md` is the only current status source; detailed plans remain requirements references; `.aider*` history is not project documentation; `docs/PRIVACY.md` is the only privacy-policy file.
- Reconciliation: update stale README, architecture, and professional-delivery statements; remove the root privacy duplicate; clean shell wrapper text from the dated package analysis.
- Validation: all local Markdown links resolve; `npm run quality` passes with 17 test files and 88 unit tests.
- Next: merge PR #30, then select `UX-001` as the only active item.

## 2026-10-04 — Public supported-label guide — Accomplished

- Result: released `/guide` with two supported shipping situations, simplified label diagrams, use/avoid guidance, encoded AIs, sizes, and direct generator links.
- Decisions: unsupported and customer-specific situations remain visible but unavailable; generator query parameters preselect only supported workflows.
- Evidence: PR #29 merged as `eb03540`; GitHub CI passed; `master` and `staging` were synchronized; the canonical production guide returned HTTP 200.
