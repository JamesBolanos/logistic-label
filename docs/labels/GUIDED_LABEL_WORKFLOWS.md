# Guided Label Workflows

The generator supports two explicit workflows. The selected workflow controls the form, validation, stored data, GS1 Application Identifiers (AIs), and PDF layout. Existing labels retain the `legacy_demo` type and `v1` template so their original meaning is not rewritten.

The detailed GS1 rules and source references are summarized in [`GS1_LOGISTIC_LABEL_GUIDE.md`](../GS1_LOGISTIC_LABEL_GUIDE.md). The repository also contains the source [`GS1 Logistic Label Guideline`](../GS1_Logistic_Label_Guideline.pdf).

## SSCC-only logistic label

Use this workflow when the label only needs to identify a physical logistic unit. Its contents are associated with the SSCC in another system, shipment message, spreadsheet, or operational process.

- Required user data: configured company name, GS1 Company Prefix, extension digit, and next serial reference.
- Encoded barcode data: `AI (00)` SSCC only.
- Not encoded: GTIN, count, lot, date, weight, destination, and routing.
- Print layouts: one 4 × 6 label, two identical 4 × 3 copies on one 4 × 6 sheet with a cut guide, or one 4 × 3 label.
- The two-copy layout repeats the same SSCC; it does not allocate a second logistic-unit identifier.
- A 3 × 3 option is shown as unavailable because the barcode plus required quiet zones needs approximately 3.64 inches of width at the supported X-dimension.
- Stored label type and template: `sscc_only`, `v2`.

## Homogeneous logistic unit

Use this workflow when every counted trade item on the logistic unit is identified by the same GTIN. The user selects what that GTIN identifies and confirms the homogeneous-content condition.

- Required user data: a valid GTIN-8, GTIN-12, GTIN-13, or GTIN-14; packaging level; whole-number count from 1 to 9,999; and explicit homogeneous-content confirmation.
- Optional traceability data: one batch/lot number with `AI (10)` and one selected date type. Supported dates are production `AI (11)`, packaging `AI (13)`, best before `AI (15)`, sell by `AI (16)`, and expiry `AI (17)`.
- The lot and date may be omitted, used separately, or used together. A selected date type and its value must be supplied together.
- Normalization: shorter valid GTINs are left-padded to the 14-digit form used with `AI (02)`.
- Encoded content barcode: `AI (02)` CONTENT followed by `AI (37)` COUNT.
- When present, the selected date is encoded before the variable-length `AI (10)` lot in a separate traceability barcode.
- Encoded logistic-unit barcode: `AI (00)` SSCC in its own, lowest barcode.
- Not encoded in this version: weight.
- Stored label type and template: `homogeneous_unit`, `v2`.

The count is the number of trade items identified by the exact GTIN entered. For example, if the GTIN identifies a case, the count is cases; it is not the number of individual units inside those cases.

## Rendering and compatibility

- Homogeneous labels use a 4 × 6 inch page. SSCC-only labels use the selected 4 × 6 or 4 × 3 output.
- Guided barcodes target a 0.495 mm X-dimension, a 31.75 mm minimum bar height, and quiet zones of at least 10 X-dimensions.
- Optional traceability is rejected when its combined GS1-128 symbol would exceed the 4-inch page at the supported barcode dimensions; the user must shorten the lot value.
- Human-readable interpretation appears below each barcode with AIs in parentheses.
- Saved `v1` labels continue through the legacy renderer. New guided labels use the `v2` renderer.
- The database migrations add workflow, print-layout, and selected-date metadata and make product-content fields optional without changing existing records.

Automated checks cover form rules, GTIN normalization, workflow metadata, maximum supported count, PDF AI content, saved history, and simultaneous SSCC allocation. Representative printed labels still require physical scanner or verifier testing before that verification item is complete.
