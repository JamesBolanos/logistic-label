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
