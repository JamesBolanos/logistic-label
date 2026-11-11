# Tailored request path (`FEEDBACK-001`)

## Need

The public guide presents requirements outside the free generator in a way that can look unavailable, and its general contact action does not help visitors describe what they need. The free generator supports three workflows; tailored work is a separate option for specific requirements.

## Outcome

Visitors can tell the difference between the free generator and tailored work, identify whether their need might be a fit, and contact the developer without creating an account.

## Requirements

1. Clearly distinguish the three free workflows from customer-specific tailored work.
2. Present tailored work as an available option, not as a disabled label type, and include examples such as customer routing guides, different label sizes or formats, printer workflows, shipment data, and integrations.
3. Offer separate request categories for:
   - Suggesting an improvement to the public tool.
   - Discussing a tailored project for a specific business requirement.
4. Provide a short public form that requires a reply email address and a concise description, with optional name, company, and request topic fields.
5. Validate submissions on the server, limit abuse, and provide clear success, validation, and delivery-failure feedback. Preserve entered values on recoverable failures.
6. Deliver request details by email only to `jbolanosdiaz@gmail.com`, using the existing Resend integration. Do not add a database inbox or store inquiry content in the application.
7. Record successful email submissions separately from contact-action clicks. Analytics may contain only the controlled request category; never include email addresses, names, company names, or free text.
8. Explain in the privacy notice that request details and reply addresses are sent to the transactional email provider, are not stored by the application, and may be retained by the email provider. Explain that source IP is used transiently for abuse prevention.
9. Keep a direct email fallback available if the form cannot be used.

## Acceptance criteria

- Visitors can identify the three free workflows and the separate tailored-project path.
- Visitors can submit either a public-tool suggestion or a tailored-project inquiry without signing in.
- Invalid submissions are rejected with actionable feedback; successful submissions confirm the email provider accepted the message.
- Delivery failures are reported without losing the submitted values, and the page offers a direct email fallback.
- Spam protection includes a honeypot and server-side request throttling.
- Request data is sent only to the selected recipient through the existing email provider and is not written to the application database or logs.
- Analytics records a successful submission with a controlled request category only; contact clicks remain a separate event.
- Privacy copy describes email-provider processing, application retention, and transient abuse-prevention processing accurately.
- Existing free label workflows remain unchanged.

## Out of scope

- Screenshot gallery or showcase page. Examples can be considered after shareable materials and permissions are collected.
- In-app inbox, database persistence, CRM, proposal tracking, or automated qualification.
- New label workflows or changes to the free generator.
- Promises that every request will be accepted or a guaranteed response time.

## Implementation plan

1. Update the public guide and homepage links to make tailored work and product suggestions distinct, affirmative choices.
2. Add a progressively enhanced public form and server action with input validation, honeypot, and request throttling.
3. Send validated requests as plain-text email through the existing Resend configuration; use a fixed subject and validated reply-to address.
4. Add a privacy-safe `custom_request_submitted` analytics event and retain `custom_contact_clicked` for entry-point actions.
5. Update the public and repository privacy notices and product measurement documentation.
6. Add a draft release note, focused unit and browser coverage, then run `npm run quality`.

## Decisions

- Delivery: email only; the app does not maintain a private inbox or save request records.
- Recipient: `jbolanosdiaz@gmail.com`.
- Email service: reuse the existing Resend integration and sender configuration.
- Visual showcase: deferred until the owner gathers materials and confirms sharing permissions.
