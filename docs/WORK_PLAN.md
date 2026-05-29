# Work Plan

Goal: build a usable, basic product for creating GS1-standard logistics labels, starting from the current SvelteKit app and the GS1 Logistic Label Guideline.

## Current State

The app already has useful foundations:

- Authentication.
- Saved label history.
- Preview and download flow.
- PDF generation.
- GS1-128 encoding.
- GTIN validation.
- SSCC storage.
- A 4x6 PDF target.

The main gap is that the current workflow is too fixed. It assumes every label has GTIN, lot, production date, quantity, and weight. GS1 says the only mandatory element for a GS1 Logistic Label is the SSCC. Other data depends on the logistic unit type and valid AI combinations.

## First MVP

The first real MVP should be a standards-guided 4x6 GS1 Logistic Label generator, not a broad label designer.

Build MVP around two label types:

- SSCC-only logistic label: the cleanest baseline and valid for many workflows. It proves SSCC allocation, GS1-128 barcode correctness, PDF layout, preview, history, and download.
- Homogeneous logistic unit label: for a pallet/case group containing one trade item type. This should use the correct GS1 model, usually `AI (00)` SSCC, `AI (02)` CONTENT, and `AI (37)` COUNT, with optional lot/date when valid.

For MVP, include:

- Company/settings screen for GS1 Company Prefix, company name, and label issuer info.
- Proper SSCC generation from configured GS1 Company Prefix.
- SSCC check digit validation.
- SSCC archive/history so generated SSCCs are not reused.
- One-year minimum SSCC reuse prevention logic.
- Label type selector: `SSCC-only` or `Homogeneous unit`.
- AI-aware validation shared by UI/API/PDF.
- 4x6 PDF layout aligned to GS1 building blocks.
- SSCC barcode as the lowest barcode.
- HRI below each barcode.
- Data titles in the middle text area.
- Basic verification report before download: label type, AIs used, check digits, required associations, warnings.
- Label history/search by SSCC, GTIN/content, lot, created date.

## Important Fixes In MVP

- Replace timestamp-based SSCC generation with GS1 Company Prefix and serial-reference based allocation.
- Move the SSCC barcode to the lowest barcode position in the PDF.
- Stop requiring GTIN, lot, date, quantity, and weight for every label so SSCC-only labels are possible.
- Clarify weight. If it means logistic gross weight, use logistic weight AIs such as `340n`, not trade item net weight `320n`.

## Later

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
- Carrier-specific templates.

## Best First Milestone

Generate a valid 4x6 SSCC-only GS1 Logistic Label from a configured company prefix, save it, preview it, download it, and verify it.

That gives us a usable product, respects the standard, and creates the foundation for every more complex label type after it.
