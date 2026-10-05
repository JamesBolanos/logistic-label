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
