# Product Measurement Plan

## Purpose

Measure whether people reach a useful logistic-label outcome, where workflows fail, which released capabilities are seen, and whether the free tool creates interest in tailored implementations. This contract applies to GA4 browser events and persisted operational events.

## Reporting Definitions

- Use `America/Managua` as the reporting time zone.
- Default views use rolling 7-day and 30-day windows. Query boundaries are inclusive at the start and exclusive at the end.
- A signup belongs to a first-label cohort only after the account has had 24 hours to complete its first label.
- Report distinct users and raw attempts together. Percentages for small cohorts always include their counts.
- Exclude rows marked `is_internal`, including configured owner/test user IDs. E2E accounts and their events are deleted through the existing cascade cleanup.
- A repeat creator has saved labels on at least two different calendar dates. This does not represent every returning website visitor.
- A saved label, successful PDF response, and browser download action are different milestones. None proves that a file was saved or physically printed.

## Recording Rules

- Server events are authoritative for authentication, persisted settings, saved labels, successful PDF responses, and operational failures.
- Browser events cover SvelteKit page views, sanitized GA4 funnel events, download actions, contact clicks, and release visibility or CTA interactions.
- Each browser operation sends an opaque operation ID. The database uniqueness constraint prevents the same event and operation from being stored twice.
- Record success only after the responsible operation succeeds. Record one controlled failure category when it fails.
- Analytics errors never change the application response or block the user workflow.
- GA4 is enabled only when the deployment environment is `production`. Preview, local, and E2E environments do not send GA4 events.

## Event Contract

| Event                     | Authoritative recording point                                               | Allowed context                              |
| ------------------------- | --------------------------------------------------------------------------- | -------------------------------------------- |
| `sign_up`                 | Better Auth user creation hook                                              | Authentication method                        |
| `login`                   | Better Auth session creation hook                                           | Authentication method                        |
| `company_settings_saved`  | Successful settings persistence                                             | First setup or update                        |
| `label_preview_succeeded` | Successful preview PDF response                                             | Label type, size, template version, duration |
| `label_saved`             | Successful label insert                                                     | Label type, size, template version, duration |
| `pdf_response_succeeded`  | Successful saved-label PDF response                                         | PDF format, new/history source, duration     |
| `pdf_download_started`    | Browser triggers the file download                                          | PDF format and new/history source            |
| `workflow_failed`         | Controlled server or browser failure boundary                               | Step, controlled category, duration          |
| `custom_contact_clicked`  | Dashboard contact action                                                    | Placement                                    |
| `release_update_viewed`   | Published update reaches the viewport, once per release per browser session | Release ID, change category, feature key     |
| `release_cta_clicked`     | Published update link is selected                                           | Release ID and feature key                   |

## Privacy Boundary

Do not send or store emails, names, company names, IP addresses, user-agent strings, SSCCs, GTINs, lot numbers, label contents, free text, URLs containing user input, or raw exception messages as product-event attributes. GA4 receives only allowlisted names and controlled values. Persisted events use an internal user ID so records can be excluded, aggregated, and removed with the account.

## Validation

- Unit tests verify event allowlists, controlled values, failure categories, and authentication-method resolution.
- Playwright verifies the real signup-to-download workflow against an isolated Neon branch. Account cleanup also removes the run's operational events.
- Before production release, inspect GA4 DebugView for one successful journey and one deliberately failed operation.
- Reconcile saved-label and signup milestones against their source database tables before using conversion rates for decisions.
