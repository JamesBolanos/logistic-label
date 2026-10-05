# Work Plan

Goal: provide a dependable free logistics label tool and attract requests for tailored implementations, using the current SvelteKit app and the GS1 Logistic Label Guideline.

## Foundation Fast-Track

The operational delivery foundation is established: reproducible local checks, GitHub CI, isolated E2E data, stable staging, production/non-production database separation, and dependency maintenance are working. Remaining monitoring, recovery, migration, and security hardening stays visible in [`docs/PROFESSIONAL_DELIVERY_PLAN.md`](./PROFESSIONAL_DELIVERY_PLAN.md) and no longer blocks incremental product work.

## Delivery Board

This is the planning checklist. Unchecked items are outstanding work, not implemented features. Detailed private usage snapshots belong in the git-ignored `usage_log/` folder.

| Order | Workstream | Status | Outcome to verify |
|---|---|---|---|
| 1 | What's new panel | Delivered; analytics follows in priority 2 | Users can discover every released fix, improvement, and new feature |
| 2 | Event checklist and statistics | Delivered; collect a usage baseline and review outcomes | See where users stop, which operations fail, and which released features they use |
| 3 | Fixes | Needs completion and verification | Correct labels, reliable authentication/downloads, and isolated tests with cleanup |
| 4 | Improvements | Planned; refine with feedback | Make existing workflows easier and prepare evidence for future decisions |
| 5 | New features, including Excel export | Backlog; scope through analysis | Add capabilities that address a defined user or business need |

Follow this priority order. Business analysis and short feedback cycles apply throughout the work. The first panel release can ship before event tracking; instrument it in priority 2.

## Current State

The app already has useful foundations:

- Authentication.
- Saved label history.
- Preview and download flow.
- PDF generation.
- GS1-128 encoding.
- GTIN validation.
- SSCC storage.
- 4×6 and compact 4×3 PDF output for the supported scenarios.
- Company settings and prefix-based SSCC generation.
- Production-only GA4 navigation and allowlisted product events, plus persisted operational events and an owner-only aggregate dashboard.
- A Playwright workflow that creates and cleans up an isolated Neon branch for eligible E2E runs.

The label selector now describes real-world shipping situations while preserving the technical workflow types underneath. It separates a transport identification label with human-readable routing information from a label for multiple identical cases or items. Legacy records retain their original data and template version. The remaining correctness work includes physical print/scanner verification, SSCC reuse controls, and carefully scoped support for additional scenarios and data elements.

## Business Analysis and Agile Working Approach

Use IIBA's Business Analysis Core Concept Model to frame substantial backlog items: need, stakeholders, context, expected value, proposed change, and solution options. Keep the analysis proportional to the item. [IIBA BACCM guidance](https://www.iiba.org/knowledgehub/the-business-analysis-standard/2-understanding-business-analysis/2-2-a-model-for-effective-analysis-baccm/)

Connect decisions across IIBA's three agile analysis horizons:

| Horizon | Application to this repo |
|---|---|
| Strategy | Maintain a useful free tool that creates value for users and attracts tailored implementation work |
| Initiative | Define the outcome and scope of each of the five priorities, using usage evidence and stakeholder feedback |
| Delivery | Break the selected work into small stories, specify acceptance criteria, verify results, and learn from each release |

These horizons support continuous analysis rather than a separate preliminary project phase. [IIBA agile analysis guidance](https://www.iiba.org/business-analysis-blogs/what-is-agile-business-analysis-and-how-can-it-help-your-organization/)

### Backlog Item Template

| Field | Record |
|---|---|
| ID, category, and status | A stable identifier; panel, tracking, fix, improvement, or new feature; current board state |
| Need and evidence | The problem or opportunity and the observation, usage report, or user request supporting it |
| Stakeholders and context | Who benefits and relevant workflow, printer, data, or operational constraints |
| Expected value | The outcome to improve, baseline if available, and how success will be evaluated |
| Scope and options | The proposed change, alternatives considered, boundaries, dependencies, and open questions |
| Story and acceptance criteria | The user's goal and observable examples of success and failure; use Given/When/Then where helpful |
| Delivery and follow-up | A small implementation slice, appropriate verification, release note, measurement, and feedback review |

Keep private user evidence in `usage_log/` or other private records. Link a backlog ID to its implementation, verification evidence, release entry, and outcome review.

### Delivery Cycle

Use a lightweight visual workflow: **Backlog → Analysis → Ready → In progress → Review → Released → Outcome reviewed**. Record blocked items and their dependency visibly. Choose a specific agile framework and cadence when useful; this plan does not prescribe Scrum roles or fixed sprints.

- [x] Refine the next small item within the agreed priority order, with a clear need, scope, acceptance criteria, and dependencies.
- [x] Deliver and verify a usable increment; keep work in progress small.
- [x] Include a dated What's new entry for every released change, grouping related small changes into one release when appropriate.
- [x] Validate the tracking required for that increment. The initial panel uses content/UI verification; its analytics follow in priority 2.
- [ ] Review stakeholder feedback and available metrics after release, then adjust the backlog and working approach.

The workflow above adapts the agile principles of incremental delivery, collaboration, and regular improvement to this project. [Agile Manifesto principles](https://agilemanifesto.org/principles.html)

## 1. What's New Panel

First deliverable: make every released fix, improvement, and new feature visible to users, with a clear explanation of its benefit.

- [x] Add a compact "What's new" panel on the public home page, with a link to the full release history.
- [x] Give each update a stable release ID, publication date, change category (`fix`, `improvement`, or `new feature`), short title, user-facing benefit, and relevant feature/instruction link.
- [x] Start with a small file-backed release list; distinguish drafts from published updates and publish only capabilities that are available.
- [x] Show recent releases first and preserve older entries in the history. Keep planned roadmap items separate from released features.
- [x] Make updates readable on mobile and accessible by keyboard; keep label creation easy to reach.
- [x] Verify published/draft visibility, release ordering, links, and the empty state. Panel analytics are delivered under priority 2 and do not block this first release.
- [x] Include a dated release note for every shipped change and add the relevant measurement check once event tracking is available.

## 2. Event Checklist and Statistics

### Measurement Definitions

- [x] Define the reporting window, time zone, and eligible signup cohorts. Compare users who have had enough time to complete the measured step.
- [x] Separate owner accounts, confirmed automated tests, suspected tests, and other users. Keep account identities in private records rather than this tracked plan.
- [x] Count distinct users reaching successful milestones as well as attempts and retries. Show counts alongside percentages for small cohorts.
- [x] Keep saved labels, successful PDF responses, browser download attempts, and physical prints distinct. Do not infer printing from a download or the current `printed` flag.
- [x] Define repeat creators as users saving labels on later dates; do not label this as all returning website visitors.

### Event Checklist

Event names below are proposed contracts. Establish one recording point per event and prevent duplicates before using them in reports.

| Proposed event | Record when | Useful attributes |
|---|---|---|
| `sign_up`, `login` | Authentication succeeds | Sign-in method |
| `company_settings_saved` | Company settings are successfully persisted | First setup or update |
| `label_preview_succeeded` | The client receives the preview PDF successfully | Label type, size, template version, elapsed time |
| `label_saved` | A new label is committed to the database | Label type, size, template version |
| `pdf_response_succeeded` | The server generates and returns a successful PDF response | Format, elapsed time; not proof of receipt or printing |
| `pdf_download_started` | The browser receives the PDF and triggers the download action | Format, new label or history re-download; not proof of a file saved to disk |
| `workflow_failed` | A validation or operational step fails | Step, field name, controlled error category, elapsed time |
| `custom_contact_clicked` | The user opens the custom-work contact action | Placement; a click is not a submitted inquiry |
| `generate_lead` | A customization request is successfully saved | Request category, requested format or printer category |
| `release_update_viewed` | A published update becomes visible, once per release per session | Release ID, change category, feature key |
| `release_cta_clicked` | The user follows an update's feature or instruction link | Release ID, feature key |

- [x] Review the existing GA4 property and base tag, including page views during SvelteKit navigation and duplicate-event handling.
- [x] Add success and failure events at the defined recording points. Standardize operation IDs where needed to distinguish retries from separate jobs.
- [x] Use GA4 for acquisition and navigation; use persisted application records and operational events for account/label totals and workflow outcomes.
- [x] Keep emails, company names, raw label contents, free-text inquiries, and raw error messages out of GA event payloads. Use controlled categories and non-identifying attributes.
- [x] Validate events against successful operations and deliberately failed operations; analytics failures must not interrupt label creation.
- [x] Reconcile the measured milestones with database records, verify owner exclusion, and confirm automated test data remains confined to nonproduction databases.
- [x] Instrument the already-released What's new panel and validate its controlled visibility and link events.
- [ ] After enough usage has accumulated, compare distinct update viewers, feature-link users, and subsequent successful feature use. Clicks alone do not establish adoption or causation.

### Owner Dashboard

| Priority | Statistic | Decision supported | Source |
|---|---|---|---|
| First | New users and first-label completion | Is onboarding helping people reach value? | Existing database records; add PDF response tracking |
| First | Signup → settings → preview → saved label → PDF fetched | At which step do users stop? | Database plus new events |
| First | Time to first saved label / PDF fetched | Is the workflow too difficult or slow? | Timestamps plus new events |
| First | Weekly/30-day creators, later-date creators, labels per user, and usage concentration | Is usefulness spreading to more users? | Existing label history |
| First | Failed attempts, affected users, retry recovery, and operation duration | Which fixes remove the most friction? | New operational events |
| Next | Acquisition source / landing page → first label / inquiry | Which channels attract suitable users? | GA4 attribution where available; preserve an unknown category |
| Next | Feature requests by distinct users, size, format, and printer | What belongs in the free tool or a tailored project? | Categorized request records |
| Next | Inquiries → qualified requirements → proposals → accepted projects | Is the free tool generating paid implementation work? | Application or lightweight sales records |

- [x] Build an owner-only statistics page with rolling 7/30-day filters and cohort exclusions; enforce owner access on the server.
- [x] Start with six summary cards: new users, first-label users, weekly label creators, failed attempts, custom inquiries, and accepted projects. Show untracked metrics as unavailable rather than zero.
- [x] Add the completion funnel and the most frequent failure categories below the cards.
- [x] Configure environment-specific owner user IDs, verify the aggregate queries on staging, and reconcile staging/production results before using them for decisions.
- [ ] Review Search Console queries, impressions, and clicks to identify useful content and landing-page improvements.
- [x] Save dated usage reports in `usage_log/`, including definitions, exclusions, and data limitations; preserve earlier snapshots for comparison.

## 3. Fixes

- [x] Make SSCC allocation atomic and verify simultaneous label creation against an isolated database.
- [x] Correct the generated 4×6 and 4×3 barcode dimensions, quiet zones, HRI, and SSCC placement for the two guided workflows.
- [ ] Print and validate representative labels with a scanner/verifier. Postponed until a physical printer and scanner are available; a separate virtual-printer project can verify page dimensions, scaling, and the print path but cannot close this physical-quality check.
- [x] Keep optional Gross Weight explicitly human-readable in the current transport workflows; do not imply a trade-item net-weight AI or encode weight without a defined business scenario.
- [x] Complete password recovery.
- [x] Handle returned Google sign-in errors with safe recovery guidance and a retry path.
- [x] Remove the unsupported history Delete action so saved SSCC records are not presented as disposable.
- [x] Preserve date-only values as calendar dates in label data, history, and PDF display without timezone conversion.
- [x] Give automated tests an explicit isolated database and dedicated server; prevent accidental production use.
- [x] Delete run-owned accounts in test cleanup and dispose the temporary Neon branch after every CI result; expire interrupted-run branches automatically.

## 4. Improvements

- [x] Guide new users through company setup, preview, and first-label creation with a dashboard checklist derived from existing settings, events, and saved labels.
- [ ] After saving a label, refresh history immediately. If the automatic PDF download fails, explain that the saved label can be downloaded from history without creating another SSCC.
- [ ] Gather feedback from repeat creators, one-time creators, configured non-creators, and signup-only users; record the task, printer, required output, and obstacle.
- [ ] Add a categorized feature/customization request path and distinguish general suggestions from concrete project requirements.
- [ ] Validate a small saved-product list: product name, internal reference, and GTIN. Review shipment-specific values on each new label.
- [ ] Distinguish reprinting an existing logistic unit from creating a new one with a fresh SSCC.
- [ ] Preserve saved label data and template versions when products, company settings, or layouts change.
- [ ] Separate shared label validation/data from layout and export rendering to support future sizes and formats.
- [ ] Choose the next size, template, batch workflow, or export format from repeated requests or a scoped customer project.
- [x] Improve the public sample label, walkthrough, supported-format information, and custom-implementation call to action.

## 5. New Features

Refine and deliver these capabilities after priorities 1–4. Record the user need and acceptance criteria before implementation.

### Label Workflows

Build on the existing generator with standards-guided label types.

The guided MVP supports two label types. Their exact inputs and encoded data are documented in [`docs/labels/GUIDED_LABEL_WORKFLOWS.md`](./labels/GUIDED_LABEL_WORKFLOWS.md).

- SSCC-only logistic label: the cleanest baseline and valid for many workflows. It proves SSCC allocation, GS1-128 barcode correctness, PDF layout, preview, history, and download.
- Homogeneous logistic unit label: for a pallet/case group containing one trade item type. It uses `AI (00)` SSCC, `AI (02)` CONTENT, and `AI (37)` COUNT, with optional `AI (10)` batch/lot and one selected GS1 date type.

Label capability checklist (completed foundations are shown for context; correctness fixes are tracked under priority 3):

- [x] Company/settings screen for GS1 Company Prefix and company name.
- [x] Generate SSCCs from the configured company prefix and serial reference; concurrency safeguards remain below.
- [x] SSCC check digit validation.
- [x] Store SSCCs with unique values in label history; review retention and deletion safeguards below.
- [ ] One-year minimum SSCC reuse prevention logic, including retention and deletion behavior.
- [x] Business-situation selector: track one pallet/carton/parcel or ship multiple identical cases/items; show later scenarios as unavailable rather than accepting ambiguous data.
- [x] Allow SSCC-only labels without requiring GTIN, lot, date, quantity, or weight; validate additional fields according to the selected label type.
- [x] AI-aware validation shared by UI/API/PDF for `AI (00)`, the homogeneous `AI (02)` plus `AI (37)` association, optional `AI (10)`, and supported GS1 date AIs.
- [x] PDF layouts aligned to GS1 building blocks and physical barcode dimensions: compact 4×6 for limited data and 6×8 when a homogeneous label adds lot/date traceability.
- [x] SSCC barcode as the lowest barcode.
- [x] HRI below each barcode.
- [x] Review data titles and issuer information for each supported label type.
- [x] Offer SSCC-only 4×6 single, 4×6 two-copy, and 4×3 single layouts; keep 3×3 unavailable because a compliant SSCC barcode does not fit.
- [x] Basic verification report before download: label type, layout, AIs used, check digits, required associations, barcode fit, SSCC placement, and physical-verification warnings.
- [ ] Extend existing SSCC/GTIN/lot search with created-date filtering.

### Excel Export (.xlsx)

- [ ] Define the export's business purpose and dataset: label history, owner statistics, saved products, or another requested view. Dataset and audience are open decisions.
- [ ] Agree columns, filters, date/time conventions, and whether export covers selected rows or all matching records across pages.
- [ ] Generate a real `.xlsx` workbook with readable headers, a dated filename, and a useful empty-result response.
- [ ] Preserve GTINs, SSCCs, and other identifiers as text so leading zeros and long values survive in Excel.
- [ ] Enforce the same user/owner access rules as the source view and export user-entered values as data, not executable formulas.
- [ ] Verify exported records against the selected source data, including leading-zero identifiers, dates, pagination, and empty results.
- [ ] Define export success/failure events and publish a What's new entry when the feature is released.

### Later Feature Candidates

Defer until the MVP is solid:

- Heterogeneous/mixed pallets.
- Trade-item logistic unit using `AI (01)`.
- Parcel labels with routing code `AI (403)`.
- Customer/carrier/supplier segmented labels.
- Ship-to GLN/postal code fields: `410`, `420`, `421`.
- GSIN/GINC: `402`, `401`.
- Parent/child SSCC aggregation for nested logistics units.
- Stacked pallet/master label workflow.
- GS1 2D barcode support.
- EPC/RFID support.
- ASN/despatch advice integration.
- Scanner verification integrations.
- Multi-label batch printing.
- ZPL generation and LAN-printer delivery through a user-installed local print bridge.
- Carrier-specific templates.

### Label Workflow Milestone

Generate a valid 4x6 SSCC-only GS1 Logistic Label from a configured company prefix, save it, preview it, download it, and verify it.

This is a later label-capability milestone, following the five-priority sequence. Record the successful steps and failures in the owner statistics, and announce the released workflow through the What's new panel.

That gives us a usable product, respects the standard, and creates the foundation for every more complex label type after it.
