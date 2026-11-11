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

The three samples must match the app's single-label output layouts: transport identification is 4 × 6, identical contents is 4 × 6, and basic SSCC is 4 × 3. Match each output's field order and placement; the licensed prefix is configured in company settings and contributes to SSCC allocation, but is not printed as a separate field on these labels. Keep each sample static, explanatory, and not connected to the authenticated generator; use explicit SSCC/GTIN placeholders and visibly non-scannable barcode areas, with “DEMO — NOT VALID FOR SHIPPING” clearly shown. They are not personalized previews and cannot create, allocate, save, or download a label.

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

### 4. Make signup errors and CAPTCHA states understandable

Retain both Google and email signup and preserve existing authentication, CAPTCHA, rate-limit, and password requirements. Improve only user-facing clarity and recovery, especially the CAPTCHA's current loading state if its script never loads and the retry path after a verification failure. Keep the user's form values available when a recoverable error occurs.

Do not remove CAPTCHA, weaken password requirements, or change account-security policy as part of this UX work. Treat any future change to those controls as a separate decision requiring security review and evidence.

## Out of scope

- Analytics, instrumentation, reporting, conversion measurement, or changes to the admin statistics.
- A new What's New entry, release-history item, or public roadmap announcement.
- Changes to GS1 validation, SSCC allocation, account policy, or production label behavior.
- A public label generator, public SSCC allocation, or persistence/download of demo labels.
- New database tables, migrations, dependencies, or third-party services.
- New label types or changes to the supported format/printer matrix.

## Implementation sequence

1. **Public workflow guide and sample labels:** Add an ordered visual workflow to the public guide, including account creation, required company setup, shipment entry, preview/checks, and save/download. Show one static sample for each available workflow, matching the app's output layouts: transport identification 4 × 6, identical contents 4 × 6, and basic SSCC 4 × 3. Use explicit placeholders and non-scannable barcode areas, with a prominent “DEMO — NOT VALID FOR SHIPPING” mark. Replace plausible numeric identifiers in existing guide diagrams with unmistakable placeholders. Make the licensed-prefix prerequisite prominent and distinguish company settings from shipment data. Update the home hero to route visitors to this guide. Keep public visuals explanatory and read-only.
2. **Guided setup:** Refine copy and contextual help on Settings and the dashboard checklist to reinforce why valid company allocation settings must be completed before real SSCC label generation. Reuse the current settings API and onboarding progress model.
3. **Signup recovery:** Add explicit CAPTCHA script-load failure/retry feedback and refine signup error messaging without changing security policy.
4. **Regression verification:** Test public access without an account, authenticated setup and label entry, signup errors/retry, responsive layouts, keyboard operation, and existing successful flows.

This order puts accurate expectations and the required SSCC prerequisite first, then improves the transition into account setup, and leaves signup behavior changes until the public and onboarding copy are settled.

## Acceptance criteria

- A visitor can reach a step-by-step visual guide and three static sample labels from the home page without signing in; the guide covers account creation, company setup, workflow selection, shipment entry, preview/checks, and save/download.
- The guide explicitly states that a real SSCC cannot be allocated without the organization's licensed GS1 Company Prefix, and does not imply a personalized or valid SSCC label can be generated before required settings are complete.
- The guide distinguishes company allocation settings (company name, licensed prefix, extension digit, and next serial reference) from shipment details such as Ship From and Ship To.
- The static samples are clearly marked “DEMO — NOT VALID FOR SHIPPING,” use explicit GTIN/SSCC placeholders and non-scannable barcode placeholders, and cannot be mistaken for usable labels.
- The samples match the app's single-label layouts and proportions: transport identification 4 × 6, identical contents 4 × 6, and basic SSCC 4 × 3.
- Public diagrams and the demo are explanatory and read-only; they cannot allocate an SSCC, save or download a label, or call authenticated generation endpoints.
- The home page makes the free-label workflow the primary action and the step-by-step guide/demo the clear secondary action without calling the static demo an interactive or personalized preview.
- New users can understand where to obtain their licensed GS1 Company Prefix, why it is required, and what to do if they do not have one; the UI never suggests inventing a prefix or substituting other settings for it.
- The existing checklist continues to point to the correct next step and does not create duplicate or stale setup state.
- Signup retains its current authentication and security requirements, while CAPTCHA load failure and retry are understandable and recoverable.
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

1. **Resolve content and diagram boundaries (low, 1–2 hours):** Confirm the three available workflow records and choose the homogeneous 6 × 8 label as the illustrative example because it demonstrates the richest supported information layout. Keep the public explanation consistent with the guide's existing workflow data and GS1 references.
2. **Build the public manual/demo (medium, 4–8 hours):** Add an ordered visual walkthrough to `/guide`; make the company-setup step prominent before shipment data; show the full static demo layout with placeholders and a non-scannable barcode; replace plausible SSCC/GTIN values in the existing `LabelDiagram` examples. Reuse styling/layout ideas, not the production barcode or PDF-generation path. Keep the demo accessible and responsive.
3. **Improve home and settings copy (low, 2–4 hours):** Add a clear home-page link/action to the manual and explain the company settings prerequisite in `/settings` and, where useful, the existing onboarding checklist. Do not change validation or the settings gate.
4. **Improve CAPTCHA failure recovery (medium, 3–6 hours):** Handle external script `onerror`/timeout and a retry path in `Captcha.svelte`; avoid duplicate script/widget initialization and preserve the current verification requirement. Add focused tests for loading, failure, retry, and successful verification.
5. **Regression and polish (medium, 4–8 hours):** Extend `tests/label-guide.spec.js` for the step order, demo warning/placeholders, and absence of plausible IDs; add focused CAPTCHA browser/component coverage; verify the public pages at mobile and desktop sizes and keyboard navigation; run `npm run quality`.

**Overall difficulty: medium.** Most changes are localized to public Svelte components and copy, with no schema/API change. The main risks are (a) demo visuals accidentally resembling a valid shipping label, especially because existing diagrams include plausible identifiers; (b) accidentally presenting company settings as shipment details; and (c) CAPTCHA script retry causing duplicate widgets or stale verification state. The public guide/demo and copy changes are low-to-medium risk; CAPTCHA lifecycle handling is the most technically delicate slice.

**Rough effort:** about **2–4 focused engineering days** for implementation, focused tests, responsive/accessibility polish, and the repository quality gate, assuming the demo stays static and existing auth/CAPTCHA policy is unchanged. This is a planning estimate, not a calendar commitment; external CAPTCHA behavior or a requirement for a production-rendered sample could increase it. No database migration or dependency is expected.

## Open implementation check

Before implementation, confirm the exact save/allocation boundary and the settings validation behavior in the current workflow. Keep the demo static: do not add a public generation endpoint or show a real-looking allocated identifier or scannable barcode. Users without a licensed prefix can still inspect the example and learn the steps, but must be told they cannot create a valid real SSCC label until they obtain one. Existing guide diagrams currently contain plausible numeric examples; replace them as well as adding the richer demo so the page does not send mixed signals.
