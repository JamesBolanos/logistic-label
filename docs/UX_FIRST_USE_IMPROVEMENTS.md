# First-use experience improvements (`UX-004`)

## Product brief

- **Need:** People considering the tool should understand what it produces and what is required before they start. New users should know that real SSCC allocation requires a GS1 Company Prefix licensed to their organization, and how to get from account creation to a first label without guessing.
- **Users:** First-time visitors evaluating supported logistic-label workflows; new account holders configuring a GS1 Company Prefix; people choosing between email and Google signup.
- **Outcome:** Make the product's value, prerequisites, and boundaries clear before signup, then make the first authenticated label workflow feel guided and recoverable.
- **Evidence:** The public home page explains the product at a high level, and `/guide` documents three available workflows (transport SSCC, homogeneous contents, and basic SSCC) with simplified diagrams. Those diagrams currently include plausible numeric GTIN/SSCC examples, so they need clear demo treatment as part of this work. Real label creation is authenticated and blocked until required company settings are configured. Those settings include the organization's licensed GS1 Company Prefix, which is essential to allocating an SSCC. The dashboard checklist already guides users through settings, preview, and saving. Signup offers Google and email, but the email path includes password confirmation and CAPTCHA.
- **Delivery grouping:** Implement the related UX changes on one feature branch, proposed as `feature/general-improvements`. Keep the work separable into small changes and tests within that branch.

## Scope and decisions

### 1. Explain the end-to-end journey before signup

Improve the public path from the home page to the existing supported-label guide. Add a visual, step-by-step explanation of the real workflow, in the order users encounter it, alongside one static sample for each available workflow:

1. Create an account to use the private workspace.
2. Configure the company profile before generating a real label: company name, GS1 Company Prefix licensed to the organization, extension digit, and next serial reference. Call out the licensed prefix as a hard prerequisite for allocating a valid SSCC; users must not invent one. Distinguish company setup from the shipment's Ship From/Ship To details entered later.
3. Choose the supported shipping situation and enter its required shipment/product details.
4. Review the label preview and automated checks.
5. Save the label, which reserves its SSCC, then download the PDF or supported ZPL output.

The three samples must exactly match the app's single-label PDF output: transport identification is 4 × 6, detailed identical contents is 6 × 8, and basic SSCC is 4 × 3. Render the sample PDFs through the same production PDF label renderer used for generated labels, with the same template versions, field placement, type, barcode geometry, and print dimensions; do not recreate those layouts with separate HTML or SVG approximations. The licensed prefix is configured in company settings and contributes to SSCC allocation, but is not printed as a separate field on these labels. Keep each sample fixed and disconnected from allocation, saving, or user-generated label APIs. Use the published sample data from Figure 4-1 of the GS1 Logistic Label Guideline, including scannable GS1-128 barcodes, without an in-label demo banner. They are not personalized previews.

Use the existing public guide and `LabelDiagram` as the starting point rather than exposing the authenticated generator or building a second label-generation flow. Preserve each label's correct 4 × 6 or 4 × 3 proportions while scaling it for display. Do not call authenticated preview, save, SSCC allocation, or download APIs from the public guide.

### 2. Make the homepage promise concrete

Revise the hero to state, in plain language:

- Who the free tool is for and that the guide covers its three available workflows, without implying that the two SSCC-only choices are separate GS1 data scenarios.
- That the public guide explains the steps and company information needed before creating a real label.
- That real SSCC creation requires an account and the organization's licensed GS1 Company Prefix.
- That the generator provides PDF and ZPL output, with any relevant compatibility limits linked to the guide.

Keep starting a real label as the primary action and the step-by-step guide/demo label as the obvious secondary action. Describe it as a static demo, not an interactive or personalized "preview." Keep the tailored-solution contact route available without competing with the free workflow.

### 3. Clarify first-time setup

Keep the existing dashboard checklist and direct next-action links. Improve the first-time settings guidance so a user can tell:

- Why company profile and GS1 allocation settings are needed before creating a real label.
- That the licensed GS1 Company Prefix is required to form the SSCC, where to find the organization's licensed prefix, and that they must not invent one.
- What the extension digit and next serial reference do, without implying either can replace the licensed prefix.
- That Ship From/Ship To and other shipment details are entered later for the selected label workflow.
- Which steps can be completed before a real label is saved.

Use the existing settings form and checklist; do not introduce a new onboarding wizard or persist another copy of setup state. Preserve the current gate that prevents real label preview/generation until the required settings are valid.

### 4. Make authentication errors and CAPTCHA states understandable

Retain existing Google/email authentication and password-reset flows, and preserve authentication, CAPTCHA, rate-limit, and password requirements. Improve only user-facing clarity and recovery: report when the CAPTCHA script fails to load or display, provide a retry path, and distinguish that failure from a challenge the user has not completed on sign-in, signup, and password-reset request forms. Keep the user's form values available when a recoverable error occurs.

Do not remove CAPTCHA, weaken password requirements, or change account-security policy as part of this UX work. Treat any future change to those controls as a separate decision requiring security review and evidence.

## Out of scope

- Analytics, instrumentation, reporting, conversion measurement, or changes to the admin statistics.
- A new What's New entry, release-history item, or public roadmap announcement.
- Changes to GS1 validation, SSCC allocation, account policy, or production label behavior.
- A public user-controlled label generator, public SSCC allocation, or persistence of user-submitted demo labels.
- New database tables, migrations, dependencies, or third-party services.
- New label types or changes to the supported format/printer matrix.

## Implementation sequence

1. **Public workflow guide and sample labels:** Add an ordered visual workflow to the public guide, including account creation, required company setup, shipment entry, preview/checks, and save/download. Show one fixed sample PDF for each available workflow, matching the app's output layouts: transport identification 4 × 6, detailed identical contents 6 × 8, and basic SSCC 4 × 3. Use the published sample values from Figure 4-1 of the GS1 Logistic Label Guideline and render the PDFs through the production label renderer, including its valid GS1-128 barcodes. Do not add an in-label demo banner; explain in the guide that these are static illustrations using published example data, not personalized previews. Make the licensed-prefix prerequisite prominent and distinguish company settings from shipment data. Update the home hero to route visitors to this guide. Keep the sample inputs fixed and disconnected from SSCC allocation and persistence.
2. **Guided setup:** Refine copy and contextual help on Settings and the dashboard checklist to reinforce why valid company allocation settings must be completed before real SSCC label generation. Reuse the current settings API and onboarding progress model.
3. **Authentication recovery:** Add explicit CAPTCHA script-load failure/retry feedback and distinguish unavailable CAPTCHA from incomplete verification on sign-in, signup, and password-reset request forms without changing security policy.
4. **Regression verification:** Test public access without an account, authenticated setup and label entry, signup errors/retry, responsive layouts, keyboard operation, and existing successful flows.

This order puts accurate expectations and the required SSCC prerequisite first, then improves the transition into account setup, and leaves signup behavior changes until the public and onboarding copy are settled.

## Acceptance criteria

- A visitor can reach a step-by-step visual guide and three static sample labels from the home page without signing in; the guide covers account creation, company setup, workflow selection, shipment entry, preview/checks, and save/download.
- The guide explicitly states that a real SSCC cannot be allocated without the organization's licensed GS1 Company Prefix, and does not imply a personalized or valid SSCC label can be generated before required settings are complete.
- The guide distinguishes company allocation settings (company name, licensed prefix, extension digit, and next serial reference) from shipment details such as Ship From and Ship To.
- The static samples use the published Figure 4-1 example values and valid GS1-128 barcode symbols without an in-label demo banner; the surrounding guide identifies them as static illustrations rather than personalized labels.
- The samples are PDFs rendered by the production label renderer, matching its template versions, field placement, typography, barcode geometry, and physical page dimensions: transport identification 4 × 6, detailed identical contents 6 × 8, and basic SSCC 4 × 3.
- The fixed sample PDFs are publicly viewable and may be printed or saved by the visitor's PDF viewer. They do not accept user-provided label data, allocate an SSCC, or save user-submitted labels.
- The home page makes the free-label workflow the primary action and the step-by-step guide/demo the clear secondary action without calling the static demo an interactive or personalized preview.
- New users can understand where to obtain their licensed GS1 Company Prefix, why it is required, and what to do if they do not have one; the UI never suggests inventing a prefix or substituting other settings for it.
- The existing checklist continues to point to the correct next step and does not create duplicate or stale setup state.
- Sign-in, signup, and password-reset requests retain their current authentication and security requirements, while CAPTCHA load failure and retry are understandable and recoverable.
- Existing successful signup, login, settings, preview, save, and download flows remain unchanged.
- The changes require no database migration or new dependency.
- No analytics/reporting changes or What's New/release-history announcement are included.

## Verification plan

- Add or update focused component/unit coverage for public example boundaries, CAPTCHA load failure/retry states, and any revised onboarding copy/state logic.
- Run the existing auth and label-workflow browser coverage, adding focused browser assertions for the public-to-signup-to-first-label path where practical.
- Check the affected pages at mobile and desktop widths and verify keyboard/focus behavior.
- Run `npm run quality` once after the branch work is complete.

## Implementation plan and difficulty

Implement all slices on the agreed `feature/general-improvements` branch, but keep the work independently reviewable:

1. **Resolve content and diagram boundaries (low, 1–2 hours):** Confirm the three available workflow records and use the homogeneous 6 × 8 label as the illustrative example because it demonstrates the richest supported information layout. Use the published Figure 4-1 values, including the requested AI (37) count of 20, and keep the public explanation consistent with the guide's existing workflow data and GS1 references.
2. **Build the public manual/demo (medium, 4–8 hours):** Add an ordered visual walkthrough to `/guide`; make the company-setup step prominent before shipment data; embed static PDFs generated by the exact production renderer from Figure 4-1 data, without an in-label demo banner. Keep the samples disconnected from allocation and saving flows; make them accessible and responsive.
3. **Improve home and settings copy (low, 2–4 hours):** Add a clear home-page link/action to the manual and explain the company settings prerequisite in `/settings` and, where useful, the existing onboarding checklist. Do not change validation or the settings gate.
4. **Improve CAPTCHA failure recovery (medium, 3–6 hours):** Handle external script `onerror`/timeout and a retry path in `Captcha.svelte`; avoid duplicate script/widget initialization and preserve the current verification requirement. Add focused tests for loading, failure, retry, and successful verification.
5. **Regression and polish (medium, 4–8 hours):** Extend `tests/label-guide.spec.js` for the step order, sample values, barcode rendering, and static/read-only boundary; add focused CAPTCHA browser/component coverage; verify the public pages at mobile and desktop sizes and keyboard navigation; run `npm run quality`.

**Overall difficulty: medium.** Most changes are localized to public Svelte components and copy, with no schema/API change. The main risks are (a) confusing published static sample values with a user's allocated label, so keep the guide's sample-data context clear; (b) accidentally presenting company settings as shipment details; and (c) CAPTCHA script retry causing duplicate widgets or stale verification state. The public guide/demo and copy changes are low-to-medium risk; CAPTCHA lifecycle handling is the most technically delicate slice.

**Rough effort:** about **2–4 focused engineering days** for implementation, focused tests, responsive/accessibility polish, and the repository quality gate, assuming the demo stays static and existing auth/CAPTCHA policy is unchanged. This is a planning estimate, not a calendar commitment; external CAPTCHA behavior or a requirement for a production-rendered sample could increase it. No database migration or dependency is expected.

## Open implementation check

Keep the sample static and disconnected from SSCC allocation, saving, and download APIs. The published sample identifiers are encoded only for explanatory illustration; they are not allocated to the visitor or personalized. Users without a licensed prefix can still inspect the example and learn the steps, but must be told they cannot create a real SSCC label until they configure the organization's licensed prefix.
