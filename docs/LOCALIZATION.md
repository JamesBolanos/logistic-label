# English and Spanish localization

## Need

The application is currently English-only. Spanish-speaking users need a clear,
consistent experience throughout the site and must be able to create logistic
labels with Spanish human-readable text.

## Product decisions

- English (`en`) remains the default language.
- Spanish (`es`) is the additional supported language.
- A visible **EN / ES** language switch belongs in the top-right navigation.
- Spanish pages use an `/es/` URL prefix for sharing and SEO. English keeps the
  unprefixed URL.
- Use the browser's `Accept-Language` header to select the initial language.
- Remember a visitor's explicit EN / ES choice in a small first-party cookie
  with a long expiration.
- Redirect unprefixed requests to the matching `/es/` URL when the remembered
  choice or initial `Accept-Language` selection is Spanish, keeping language
  explicit in SEO-visible URLs.
- Save preference only when the user changes language with the EN / ES switch.
  An explicit `/es/` URL temporarily selects Spanish without changing the saved
  preference. English remains unprefixed; the EN / ES switch saves English
  before navigating to the unprefixed route.
- Treat any Spanish browser language tag, including `es-MX` and other `es-*`
  variants, as Spanish and use the single neutral Latin American Spanish
  catalog.
- Use neutral Latin American Spanish for the initial `es` message catalog.
- The product owner will review Spanish translations before release.
- Translate all app-generated emails in the language of the page or form where
  the action began.
- Generate each label in the selected application language and preserve that
  language, visible wording/layout, user-provided values, and encoded barcode
  data when it is later reprinted or reproduced. The PDF/ZPL file bytes do not
  need to be byte-for-byte identical.
- Store reviewed translations in the application. Do not translate dynamically
  at runtime or send page content to a translation service.
- Treat GS1 identifiers and encoded values as standards data, not translatable
  text. Preserve user-entered company names, addresses, product names, and
  shipment values as entered.

## Outcome

Users can browse and operate the application in English or Spanish, choose
their language at any time, and generate readable PDF and ZPL labels in that
language without changing the meaning or encoding of label data.

## Planned implementation

### Localization foundation and navigation

- Use **Paraglide.js** with its SvelteKit integration and configure `en` and
  `es` message catalogs. The Svelte CLI integration is:
  `npx sv add paraglide="languageTags:en,es"`.
- Use SvelteKit routing/hooks to recognize the `/es/` prefix, resolve locale
  messages during server rendering, and keep language selection correct during
  client-side navigation. Integrate with the existing authentication,
  security, and routing hooks rather than replacing them.
- Add an accessible EN / ES control to the top-right site navigation. Switching
  language should keep the user on the equivalent page when that page exists in
  the other language, including after authentication redirects. If an
  equivalent Spanish route is unavailable, navigate to the Spanish home page.
- Set the document `lang` attribute to the active locale. Localize page titles
  and descriptions and provide canonical and `hreflang` metadata for public
  pages.
- Treat `/es/` as the only explicit locale URL. On unprefixed requests, use a
  remembered explicit language choice before `Accept-Language`; redirect to the
  corresponding `/es/` URL when the resolved language is Spanish. Treat all
  `es-*` browser tags as Spanish. Unsupported or missing preferences fall back
  to English. Only a deliberate switch through the language control updates
  the preference cookie.

### Translation coverage

- Translate product-authored text in public pages, authentication, the
  authenticated workspace, forms, validation and error feedback, accessibility
  labels, help content, and navigation.
- Keep message catalogs in the repository and have translations reviewed for
  meaning and consistent terminology, especially GS1/logistics terms.
- Use locale-aware formatting for display dates and numbers where appropriate.
  Do not alter values stored in the database, barcode data, or standards-defined
  date encodings.
- Translate all app-generated emails, including authentication and
  request-related messages, in the language of the page or form where the
  action began. Carry that locale through the server-side email workflow.

### Label generation and output

- Make a separate, focused pass over the shared label layout and both output
  adapters: PDF and ZPL. Ensure their human-readable headings and captions
  follow the language selected when the label is created.
- Persist the label's creation language with its saved record so later PDF or
  ZPL downloads reproduce the same visible label in its original language,
  regardless of the user's current interface language. Preserve the saved
  label's data and rendering/template version as well as locale. Treat
  previously saved labels with no language value as English; do not silently
  change their visible wording, layout, user-entered content, or GS1 data.
- Add the smallest necessary database migration and update label creation,
  retrieval, and export paths to carry the locale. Existing rows without the
  new value must remain valid and default to English.
- Keep localized wording and rendering behavior versioned with the label
  template so future translation or layout changes do not silently alter the
  visible output of already-saved labels. Introduce a new template version for
  intentional output changes while retaining the prior version for old labels.
- Preserve all GS1 AIs, identifiers, barcode contents, stored label data, and
  user-entered text. Language selection changes presentation, not label
  semantics or encoded data.
- Verify that PDF fonts and text encoding render Spanish characters, including
  accented vowels, `ñ`, and `ü`, correctly. The current PDF renderer uses
  standard Helvetica fonts and directly emits PDF text, so font coverage and
  encoding must be demonstrated rather than assumed. Embed or select a suitable
  font if needed and check its effect on output size and layout.
- Verify ZPL character encoding and printer-font behavior with accented text.
  Test representative label sizes and longer Spanish headings/values for
  clipping, wrapping, barcode fit, and physical-layout changes.
- Preserve saved-label template compatibility and current English output for
  existing labels with no recorded language unless a deliberate migration or
  product change is approved.

## Tools

- **Paraglide.js** for typed, app-bundled message catalogs and SvelteKit
  localization integration.
- **SvelteKit routing and hooks** for locale-aware URLs, server rendering, and
  request language detection, integrated with existing hooks.
- **`Accept-Language`** as the initial browser-language signal; all `es-*`
  tags select Spanish. No IP-based country lookup or geolocation service. An
  explicit saved choice takes precedence on unprefixed routes, and `/es/`
  explicitly selects Spanish.
- **`Intl`** for locale-sensitive display formatting where appropriate.
- Existing **Vitest** and **Playwright** suites for message, routing, language
  switch, accessibility metadata, and regression coverage.
- Existing PDF/ZPL generators plus focused output tests and representative
  render/print checks for fonts, accents, and layout. Physical printer checks
  are needed to verify actual ZPL rendering on supported devices.
- Existing Drizzle schema and migration tooling for persisting the language
  needed to reproduce saved labels consistently.
- A human Spanish reviewer for product and GS1/logistics terminology. No
  runtime translation API is planned.

## Acceptance criteria

1. English is available at unprefixed URLs and Spanish at `/es/` URLs.
   Unprefixed requests resolve the saved choice before `Accept-Language` and
   redirect to the matching `/es/` URL when Spanish is selected.
2. The EN / ES switch is visible in the top-right navigation, keyboard and
   screen-reader accessible, and navigates to the equivalent page when
   available; when no Spanish equivalent exists, it navigates to the Spanish
   home page.
3. Public, authentication, and authenticated application flows have reviewed
   English and neutral Latin American Spanish messages, with no untranslated
   product-authored strings in scope.
4. HTML language metadata, localized public-page SEO metadata, and all
   app-generated emails correspond to the appropriate language. Emails use
   the language of the page or form where the action began. SEO metadata avoids
   duplicate or misleading canonical URLs.
5. PDF and ZPL labels use the selected app language at creation. Reprints
   preserve the same visible wording, layout/template version, user-entered
   values, and barcode/GS1 content regardless of the current app language;
   output file bytes need not be identical. Previously saved labels without a
   recorded language continue to render in English.
6. User-entered content, SSCC/GTIN values, GS1 AIs, barcode payloads, and
   standards-defined encodings are unchanged by localization.
7. Tests cover language detection (including regional `es-*` values) and
   fallback, `/es/` URL selection, remembered preference, switching and
   route fallback, both message catalogs, localized email templates,
   representative PDF/ZPL text, Spanish characters, stable visible label
   output and barcode data on reprint after switching app language, and
   unchanged GS1 data. Existing English workflows and saved-label
   compatibility pass regression checks.
8. The implementation uses in-app translations only and introduces no runtime
   translation service or geolocation dependency.

## Confirmed decisions

- **Coverage:** translate the entire application: public pages, authentication,
  signed-in workspace, and all app-generated emails.
- **Language preference:** use `Accept-Language` for initial selection and
  remember an explicit EN / ES switch in a small first-party cookie with a
  long expiration. Only the switch updates the cookie; visiting `/es/` does
  not. The exact expiration and standard cookie attributes are implementation
  details.
- **URL negotiation:** `/es/` is the only explicit locale prefix. On
  unprefixed requests, resolve the saved choice before `Accept-Language`;
  redirect to the matching `/es/` route when Spanish is selected. All `es-*`
  browser tags select the single neutral Latin American Spanish catalog.
- **Route switching:** stay on the equivalent route when available; if there
  is no equivalent Spanish route, go to the Spanish home page.
- **Spanish variant:** use neutral Latin American Spanish for the `es` locale.
- **Translation review:** the product owner will review Spanish translations
  before release.
- **Generated labels:** create PDF and ZPL output in the app language selected
  at label creation and retain that language, visible wording/layout, label
  data, and barcode content for reprinting. File bytes do not need to be
  identical. Version localized rendering with the label template so future
  changes do not silently alter saved labels. Previously saved labels without
  a language field render in English.
- **Emails:** localize all app-generated emails, including authentication and
  request-related messages, using the language of the page or form where the
  action began.

## Out of scope unless separately approved

- Additional languages or country-specific translations.
- Automatic translation at runtime or external translation APIs.
- Country-based geolocation or inferring language from a user's country.
- Translating user-entered names, addresses, product details, or GS1 data.
- Changing GS1 identifier allocation, validation, barcode payloads, or
  standards-defined date formats.
