# Product Kanban

Last reviewed: 2026-10-05 (America/Managua)

This is the only current source for work status and priority. Detailed requirements remain in the linked plans and runbooks, but their checklists do not determine what is active.

Product goal: maintain a useful free GS1 logistic-label tool that helps users complete clear shipping tasks and creates qualified opportunities for tailored implementations.

## Working Policy

- Flow: **Backlog → Ready → In progress → Review → Accomplished**.
- Work-in-progress limit: **one item** across In progress and Review.
- Select work by user value, data or standards risk, evidence, and effort.
- Every implementation item needs acceptance criteria, appropriate tests, a release note when user-visible, and a short entry in [`WORK_LOG.md`](./WORK_LOG.md).
- Keep private usage evidence in the git-ignored `usage_log/` directory.

## Work in Progress

No item is active. The WIP limit is available for the next Ready item.

## Ready

Items are ordered. Start only the first item unless new evidence changes priority.

| Order | ID             | Outcome                                                                                                          | Why now                                                                   | Detailed source                                                                      |
| ----: | -------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
|     1 | `UX-001`       | Refresh label history immediately after saving and explain history recovery when an automatic PDF download fails | Small reliability improvement that prevents unnecessary new SSCC creation | [Work Plan §4](./WORK_PLAN.md#4-improvements)                                        |
|     2 | `DATA-001`     | Prevent SSCC reallocation for at least one year after shipment, with clear retention behavior                    | GS1 identifier integrity and real-world data safety                       | [GS1 requirements](./GS1_REQUIREMENTS.md#allocating-serial-shipping-container-codes) |
|     3 | `FEEDBACK-001` | Add a categorized request path that separates suggestions from concrete tailored-project requirements            | Converts user interest into actionable product and business evidence      | [Work Plan §4](./WORK_PLAN.md#4-improvements)                                        |

## Backlog

| ID             | Theme                | Desired outcome                                                                                                | Notes or dependency                                                                        |
| -------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `SEARCH-001`   | Existing labels      | Filter SSCC, GTIN, and lot search by creation date                                                             | Small user-facing improvement                                                              |
| `INSIGHT-001`  | Product evidence     | Review Search Console and accumulated product events, then adjust priorities                                   | Requires enough usage data; do not infer adoption from clicks alone                        |
| `FEEDBACK-002` | User research        | Interview or survey repeat creators, one-time creators, configured non-creators, and signup-only users         | Record task, printer, output, and obstacle without placing identities in Git               |
| `PRODUCT-001`  | Saved products       | Validate the need and smallest useful product list before building it                                          | Define product fields separately from shipment values                                      |
| `LABEL-001`    | Identifier lifecycle | Make reprint of an existing logistic unit distinct from allocating a new SSCC                                  | Depends on lifecycle rules from `DATA-001`                                                 |
| `LABEL-002`    | Compatibility        | Preserve saved label data and renderer versions as settings and layouts evolve                                 | Existing `v1`–`v4` compatibility is the baseline                                           |
| `ARCH-001`     | Extensibility        | Separate shared label data/validation from PDF and future export renderers                                     | Start only when a concrete new format needs it                                             |
| `EXPORT-001`   | Excel                | Define audience, source dataset, columns, filters, and identifier handling before implementing `.xlsx`         | Scope remains an analysis decision                                                         |
| `WORKFLOW-001` | New labels           | Select the next scenario from repeated requests or a tailored engagement                                       | Candidates include AI (01), mixed units, perishables, and retailer-specific routing guides |
| `DELIVERY-001` | Migrations/releases  | Complete fresh and incremental migration verification, release gates, smoke checks, and recovery documentation | Detailed delivery backlog remains in the professional plan                                 |
| `OPS-001`      | Operations           | Add privacy-safe error monitoring, structured logs, readiness/uptime checks, and alerts                        | Keep operational telemetry separate from product analytics                                 |
| `SEC-001`      | Security             | Add `SECURITY.md`, scanning, secret rotation, access review, and auth/header/database review                   | Prioritize before commercial expansion                                                     |
| `RECOVERY-001` | Continuity           | Document provider recovery limits and run a non-production restore drill; add incident and outage runbooks     | Do not copy production personal data into the drill                                        |

## Blocked or Deferred

| ID              | Item                                                                         | Reason to wait                                                       | Resume condition                                              |
| --------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| `VERIFY-001`    | Print representative labels and verify them with a physical scanner/verifier | Required hardware is unavailable                                     | Printer and suitable scanner/verifier available               |
| `PRINT-001`     | ZPL and LAN-printer delivery through a local print bridge                    | Separate virtual-printer project and real printer testing are needed | Print-bridge research produces a bounded integration contract |
| `ANALYTICS-001` | Compare update viewers, feature-link users, and later successful use         | Current cohort is small and coverage began recently                  | Enough external usage accumulates for a meaningful comparison |
| `AUTH-001`      | Apple OAuth and email verification                                           | No demonstrated user need yet                                        | Repeated user/customer need or contractual requirement        |

## Accomplished

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

| Document                                                                     | Role                                                                    |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`../AGENTS.md`](../AGENTS.md)                                               | Stable AI collaboration rules and read order                            |
| [`KANBAN.md`](./KANBAN.md)                                                   | Current priority and status; authoritative board                        |
| [`WORK_LOG.md`](./WORK_LOG.md)                                               | Concise dated handoffs and decision evidence                            |
| [`WORK_PLAN.md`](./WORK_PLAN.md)                                             | Detailed product analysis and candidate requirements                    |
| [`PROFESSIONAL_DELIVERY_PLAN.md`](./PROFESSIONAL_DELIVERY_PLAN.md)           | Detailed delivery, security, operations, and recovery backlog           |
| [`../README.md`](../README.md)                                               | Setup, stack, environment contract, and repository entry point          |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md)                                   | Branch, quality, PR, dependency, and release workflow                   |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)                                       | Current system structure and durable technical constraints              |
| [`GS1_REQUIREMENTS.md`](./GS1_REQUIREMENTS.md)                               | SSCC allocation and aggregation rules                                   |
| [`GS1_LOGISTIC_LABEL_GUIDE.md`](./GS1_LOGISTIC_LABEL_GUIDE.md)               | App-specific analysis of the source GS1 guideline                       |
| [`labels/GUIDED_LABEL_WORKFLOWS.md`](./labels/GUIDED_LABEL_WORKFLOWS.md)     | Current workflow inputs, AIs, layouts, and compatibility                |
| [`PRIVACY.md`](./PRIVACY.md)                                                 | Canonical repository privacy statement                                  |
| `analytics/*.md`, `auth/*.md`, `professional-delivery/*.md`                  | Focused measurement, authentication, environment, and baseline runbooks |
| [`PACKAGE_ANALYSIS_SEP_24.md`](./PACKAGE_ANALYSIS_SEP_24.md)                 | Historical package snapshot; not a current status source                |
| [`../.github/pull_request_template.md`](../.github/pull_request_template.md) | Pull-request review checklist                                           |

Ignored `.aider*` files are generated local AI-tool history and are not project documentation.
