# Product Analytics Validation Runbook

Use this runbook after changing navigation, authentication, label workflows, release updates, or analytics code. It separates automated contract checks, persisted operational-event checks, and GA4 delivery checks so a failure in analytics never becomes a failure in the user workflow.

## What Each System Proves

| Evidence                | What it proves                                                                                                 | What it does not prove                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Unit tests              | Only approved event names, parameters, and values can be sent; analytics can be disabled for an excluded owner | Google received an event                                 |
| Isolated Playwright E2E | Successful and failed server operations persist controlled, deduplicated events with synthetic data            | Production GA4 configuration is correct                  |
| Owner statistics        | Aggregate production milestones and failures can be queried without exposing user or label contents            | Browser-only actions or physical printing occurred       |
| GA4 DebugView           | The production Google tag receives the intended browser events and parameters                                  | A contact email was sent or a PDF was physically printed |

## One-Time GA4 Property Check

The application sets `send_page_view: false` and sends one manual `page_view` after every SvelteKit navigation. In the GA4 web data stream:

1. Open **Admin → Data streams → Web → Enhanced measurement**.
2. Open the advanced settings for **Page views**.
3. Disable **Page changes based on browser history events**.
4. Keep a record of this choice with the property configuration.

Google documents that enhanced measurement can send history-change page views independently of `send_page_view: false`. Leaving both enabled can duplicate page views. See [Measure pageviews](https://developers.google.com/analytics/devguides/collection/ga4/views) and [Measure single-page applications](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications).

## Automated Acceptance

1. Run `npm run quality` locally.
2. Open a pull request and require the GitHub **Quality** and **E2E** jobs to pass.
3. In the E2E result, confirm the test reaches the operational-event assertions and deletes its temporary Neon branch and test account.

The E2E journey checks signup, login, first settings save, successful previews, saved labels, successful PDF responses, and controlled failures. Every persisted test event must have an operation ID, remain external to the configured owner list, and have a unique event-name/operation-ID pair.

## GA4 DebugView Acceptance

GA4 is intentionally disabled outside production, so perform this check on `sscc-labels.com` using a private browser window. Google recommends enabling debug mode for one device through [Tag Assistant](https://tagassistant.google.com/) and inspecting **Admin → DebugView**. See [Monitor events in DebugView](https://support.google.com/analytics/answer/7201382).

1. Start a Tag Assistant session for `https://sscc-labels.com`.
2. Open the public home page and navigate to the update history, signup, and login pages.
3. Confirm exactly one `page_view` appears for each visited path. Check `page_location`; do not accept duplicate page views for one navigation.
4. Return to the home page and scroll until each visible update has crossed the panel threshold. Confirm one `release_update_viewed` per visible release during the browser session.
5. Select one release link. Confirm one `release_cta_clicked` with the expected `release_id` and `feature_key`.
6. Select each public **Contact Me** placement and cancel the email draft. Confirm `custom_contact_clicked` uses `home_hero` or `home_cta`; no email address, subject text, page content, or other free text may appear in the event.
7. Sign in with the configured owner account. The pre-authentication login action may already have been collected. After authenticated navigation, confirm no new application events or page views are sent to the GA property. In browser developer tools, requests to `google-analytics.com/g/collect` or `analytics.google.com/g/collect` should stop.

Use GA4 Realtime for a broader delivery check after DebugView. Debug traffic may be excluded from ordinary reporting when a developer-traffic filter is configured.

## Persisted Event and Dashboard Acceptance

1. Confirm the owner account is configured independently in production and staging through `ANALYTICS_OWNER_USER_IDS`.
2. Open `/admin/statistics` as the owner and confirm both reporting windows load.
3. Confirm the displayed owner-exclusion count matches the configured distinct IDs.
4. Confirm the coverage date is present once a non-owner operational event exists.
5. Compare new-user and first-label counts with aggregate database counts for the same inclusive-start, exclusive-end UTC boundaries.
6. Compare each funnel milestone with its authoritative source:
   - signups from `user.created_at`;
   - settings from `label_settings`;
   - successful previews and PDF responses from `operational_event`;
   - saved labels from `logistic_label`.
7. Confirm failure totals contain controlled categories only and do not expose emails, company names, identifiers, label contents, or raw exception messages.
8. Save the dated aggregate result and limitations in the git-ignored `usage_log/` directory. Never copy account IDs or row-level user data into that report.

## Acceptance Record

Record the following without including secrets or personal data:

- commit and deployment environment;
- validation date and reporting time zone;
- Quality and E2E results;
- GA4 page-view duplication result;
- browser events observed with their controlled parameters;
- owner exclusion and operational-event coverage status;
- aggregate reconciliation result and known limitations;
- follow-up defect, if any.
