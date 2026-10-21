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
