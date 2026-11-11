# AI Collaboration Guide

This file is the stable entry point for AI-assisted work in this repository. Keep it short so a new session can recover the current context without reading every historical document.

## Read Order

1. Read [`docs/KANBAN.md`](docs/KANBAN.md) for current priority and status.
2. Read only the newest relevant entry in [`docs/WORK_LOG.md`](docs/WORK_LOG.md).
3. Read the source and the specific reference or runbook linked by the selected item.
4. Consult [`docs/WORK_PLAN.md`](docs/WORK_PLAN.md) or [`docs/PROFESSIONAL_DELIVERY_PLAN.md`](docs/PROFESSIONAL_DELIVERY_PLAN.md) only when the item needs their detailed analysis.

Do not treat unchecked items in older plans, generated AI history, or historical snapshots as the active queue. `docs/KANBAN.md` is the only current status source.

## Working Agreement

- Work in a lightweight Kanban flow: **Backlog → Ready → In progress → Review → Accomplished**.
- Keep at most one item in progress. Finish, block, or return it to Ready before starting another.
- Give each item a stable ID and define its need, outcome, acceptance evidence, and dependencies before coding.
- The AI edits files and explains the result. The developer runs Git, pull-request, merge, migration, and deployment commands unless explicitly requested otherwise.
- Keep communication concise. Report decisions, material risk, validation, and the next action; do not paste successful command output.
- Use targeted checks while developing and run `npm run quality` once when the change is final.
- Use focused browser or database tests only when the changed risk requires them. Documentation-only changes do not need E2E.
- Vercel is the supported deployment target. Cloudflare build status is not an acceptance signal for this project.
- Never place secrets, personal data, production records, raw labels, or private usage reports in tracked documentation or logs.

## Status Updates

- Move the selected item into **Work in progress** before implementation.
- Move it to **Review** when implementation and acceptance evidence are ready, even if developer review, merge, or deployment is still pending. Do not leave completed implementation in progress just because release work remains.
- Move it to **Accomplished** only after the required merge or release is confirmed.
- Add one concise, dated work-log entry for a meaningful implementation increment. If release is pending, say so; update that same entry with the actual release evidence rather than waiting for a later feature or creating a duplicate. Record decisions and evidence, not a transcript.
- Update existing Kanban entries instead of copying status into README files, architecture notes, or detailed plans.
