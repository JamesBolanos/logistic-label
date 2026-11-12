# Authenticated tailored-request shortcut (`FEEDBACK-003`)

## Need

The tailored-request form is available from the public label guide, but a signed-in user choosing the customer-specific implementation scenario in the label generator has no direct route to it. The generator card looks unavailable without providing an actionable next step, and visitors must re-enter contact details already associated with their account.

## Outcome

Users can move directly from the tailored scenario in the label generator to the existing tailored-project form. When signed in, the form is prefilled with their account name and email and their saved company name, while leaving every value editable.

## Requirements

1. Keep the three supported free label workflows unchanged and do not make the tailored scenario appear to be a free, currently supported label type.
2. Replace the non-actionable customer-specific scenario presentation with an accessible, clearly labeled action that opens the existing public request form.
3. Open the request form with **Discuss a tailored project** selected. The existing improvement-suggestion path remains available.
4. For an authenticated user, prefill:
   - Name and email from the authenticated account.
   - Company from the user's saved label settings, when a real company name is configured.
5. Keep all prefills editable. Anonymous visitors can continue using the form without signing in.
6. Do not put names, email addresses, company names, or other personal information in URLs, analytics, or client-visible logs. The request-type selection may be represented in the URL because it is a controlled, non-personal value.
7. Preserve typed values when validation or delivery fails. Do not replace visitor edits with server-provided defaults during form submission or recovery.
8. Reuse the existing email delivery, validation, spam protection, privacy notice, and email-only retention behavior from `FEEDBACK-001`; do not add a second form, inbox, database storage, or new provider.
9. Record the generator entry-point action through the existing `custom_contact_clicked` event and its controlled `placement` property. Do not include account or company details.

## Acceptance criteria

- The tailored scenario offers a keyboard-accessible action to reach the existing request form and does not submit or select an unsupported label workflow.
- Following the action opens the guide's request section with `tailored_project` selected.
- A signed-in user sees their account name and email prefilled; a configured company name is prefilled from their own settings only.
- An unset/default company placeholder is not presented as the user's company.
- The three free label workflows and their selection behavior remain unchanged.
- Anonymous form use remains available, and fields remain editable for all visitors.
- No personal information appears in the destination URL or analytics payload.
- Existing validation and delivery-failure recovery preserves edited field values.
- Focused browser coverage verifies the scenario-to-form flow, signed-in prefills, editable values, and unchanged free workflow selection. Tests must use synthetic account details and must not send a live request email.
- `npm run quality` passes.

## Scope and implementation notes

- Reuse the authenticated session available in the server request and retrieve label settings with the existing user-scoped settings helper.
- Supply contact defaults server-side to the public guide. Never serialize them into a link or query string.
- Pass only the controlled request-type selection in the destination URL, then let the form use server-provided defaults when there is no submitted form data. Submitted values take precedence over defaults.
- If saved settings contain only the application's default company placeholder, leave the company field blank.
- Keep the public guide's existing direct-email fallback and all `FEEDBACK-001` behavior.
- No database schema change or migration is expected.

## Out of scope

- Adding customer-specific label generation to the free generator.
- Making the tailored request form available only to signed-in users.
- Adding personal data to analytics, URL parameters, or application persistence.
- Showcase/gallery content, CRM, in-app request history, or email-provider changes.

## Implementation plan

1. Add a public guide server load that provides account-derived defaults only when the request has an authenticated user; read company settings scoped to that user.
2. Initialize the existing form from server defaults and controlled request-type selection without overriding submitted values.
3. Change the generator's tailored scenario from a disabled card to an accessible, clearly worded contact action; preserve the supported workflow cards.
4. Add privacy-safe click tracking for the generator placement and focused unit/browser tests.
5. Add an unpublished release-note draft, run focused checks and `npm run quality`, then move the item to Review.

## Decisions

- The public request form remains available to authenticated and anonymous visitors.
- The form remains email-only and reuses the already-tested `FEEDBACK-001` request pipeline.
- Account-derived prefills are conveniences, not identity verification; users may edit the name, email, and company before sending.
- Only the controlled request type may appear in the link; personal data is loaded server-side.
