# GS1 Logistic Label Guide for This App

Source document: `docs/GS1_Logistic_Label_Guideline.pdf`

Document metadata extracted from the PDF:

- Title: GS1 Logistic Label Guideline
- Release: 1.3
- Status: Ratified
- Date: July 2019
- Length: 58 pages
- Purpose: Overview of normative rules and best-practice recommendations for GS1 Logistic Label implementations.

This summary translates the guideline into product and engineering requirements for this web app. The PDF remains the source reference for exact GS1 wording, diagrams, and examples.

## Core Label Model

- A GS1 Logistic Label identifies a logistic unit, meaning an item or grouping created for transport or storage and managed through the supply chain.
- Every GS1 Logistic Label must identify the logistic unit with an SSCC.
- A label without an SSCC may still identify a trade item, carton, or outer case, but it is not a GS1 Logistic Label.
- The app should treat the SSCC as the primary label identity and the durable key used for tracking, tracing, storage, shipping, receiving, and related electronic messages.

## Layout Model

The guideline describes three label building blocks:

- Top building block: optional free text or graphics, such as shipper/receiver names, addresses, or logos.
- Middle building block: non-HRI text for barcode data, using data titles instead of AIs, plus optional extra text. If a GS1 2D symbol is used, it should sit to the right of this text.
- Bottom building block: barcode symbols and human-readable interpretation. This block is mandatory.

Implementation implications:

- Keep the generated PDF organized around top, middle, and bottom zones.
- Ensure every encoded data element is also visible as text with a clear data title.
- Keep the SSCC barcode in the bottom building block.
- If label segments are added later, the segment containing the SSCC must remain present and should sit below other segments.

## Label Segments

The guideline allows up to three logical segments:

- Supplier segment: known during packaging; includes SSCC and may include GTIN, dates, lot/batch, serial, and other product-related information.
- Customer segment: known during order processing; may include ship-to location, purchase order, routing, handling, or shipment data.
- Carrier segment: known during transport; may include postal code, consignment, routing, and carrier handling data.

Implementation implications:

- Future UI should support a base supplier/SSCC segment first.
- Customer and carrier fields should be treated as optional additions, not replacements for the SSCC segment.
- When carrier/customer segments are added or replaced, the original SSCC must not be changed.
- Additional labels or segments should not duplicate data already present because duplicate data creates scan and interpretation risk.

## SSCC Requirements

- AI `00` identifies the SSCC.
- SSCC format is 18 digits after AI `00`: extension digit, GS1 Company Prefix, serial reference, and check digit.
- The SSCC should be assigned by the company creating the logistic unit, using its own GS1 Company Prefix.
- If no SSCC exists when a logistic unit is received, a later party such as a logistics service provider or customer may allocate one.
- Created SSCCs should be archived for traceability.

Implementation implications:

- Add first-class SSCC storage rather than deriving SSCC only at PDF render time.
- Validate SSCC length and check digit.
- Store the assigning party and shipment/date context needed for reuse prevention.
- Prevent SSCC reallocation for at least one year after shipment date, as captured in `docs/GS1_REQUIREMENTS.md`.
- Cloud/service-generated SSCCs should be configurable by the customer’s GS1 Company Prefix rather than silently using an application-owned prefix.

## Trade Item Information

Trade item information belongs on the logistic label only in specific cases:

- Homogeneous logistic units may use AI `02` CONTENT for the contained GTIN.
- Logistic units that are themselves trade items may use AI `01` GTIN.
- Heterogeneous logistic units should not include GTIN-related trade item data on the label; electronic messaging linked to the SSCC is preferred.

Key AI combination rules:

- AI `01` GTIN and AI `02` CONTENT must not be used together on a logistic label.
- AI `02` CONTENT may only be used with AI `00` SSCC and AI `37` COUNT.
- AI `37` COUNT is required when AI `02` CONTENT is used.
- AI `37` COUNT is not allowed with AI `01` GTIN.
- Dates, batch/lot, and serial values must relate to the GTIN or content identifier on the label.
- Only one date value of each relevant date type and one batch/lot number can be placed on a logistic label.
- If a logistic unit contains mixed dates, lots, or batches, those values should not be printed as a single label value.

Implementation implications:

- Add label type choices such as SSCC-only, homogeneous unit, trade-item logistic unit, mixed pallet, parcel, and transport label.
- Drive allowed fields from label type to prevent invalid AI combinations.
- For mixed pallets, suppress GTIN, date, lot, and count fields that cannot represent the whole unit safely.
- Dates encoded in barcodes must use YYMMDD format.

## Transport and Customer Information

Optional transport/customer AIs include:

- AI `400` ORDER NUMBER
- AI `401` GINC
- AI `402` GSIN
- AI `403` ROUTE
- AI `410` SHIP TO LOC
- AI `413` SHIP FOR LOC
- AI `420` SHIP TO POST
- AI `421` SHIP TO POST with ISO 3166 numeric country code

Rules and recommendations:

- AI `420` and AI `421` must not be used together.
- Ship-to data should represent the physical delivery destination.
- If delivery goes through a cross-dock, the ship-to data should identify the terminal and the final destination should be specified separately.
- Postal code is strongly recommended in visible address text.
- Supplier/shipper address may be useful and can be free text.
- Routing codes may be encoded with AI `403` or shown as free text.

Implementation implications:

- Model addresses separately from encoded GS1 AIs.
- Support free text for human logistics handling while keeping encoded fields structured.
- Add validation to prevent AI `420` and `421` from being selected together.

## Barcode and 4x6 Requirements

The app currently targets 4x6 labels, which the guideline treats as a compact label size suitable for SSCC-only or limited additional data.

Barcode/layout requirements to encode in the renderer and tests:

- GS1-128 must include FNC1 after the start character.
- Fixed-length element strings should be encoded before variable-length element strings.
- AI `00` SSCC must appear in the lowest barcode on the label.
- On 4x6 labels, SSCC should not be concatenated with other data.
- GS1-128 X-dimension range is 0.495 mm to 0.94 mm, with 0.495 mm recommended as the target.
- GS1-128 bar height must be at least 31.75 mm / 1.250 inches, excluding HRI.
- Quiet zones must be at least 10 times the X-dimension on each side.
- Barcode orientation should be horizontal/picket-fence on logistic units.
- HRI should appear below each barcode, with AIs shown in parentheses in text but not encoded in the barcode.
- HRI characters must be at least 3 mm high and clearly legible.
- Each AI should occur only once on a logistic label.

Implementation implications:

- Add PDF layout tests that assert physical dimensions for barcode height and quiet zones.
- Add generated-barcode tests for FNC1 and AI encoding.
- Keep AI `00` as the lowest barcode, especially when optional transport or product barcodes are added.
- For 4x6 output, render SSCC in its own barcode instead of concatenating it with other AIs.

## Label Placement Guidance

These placement rules are mostly operational, but they should be shown in user guidance and possibly printable instructions:

- Pallet barcodes should be positioned between 400 mm and 800 mm from the base.
- For pallets, the symbol including quiet zones should be at least 50 mm from a vertical edge.
- Pallets should generally have two labels with the same data on two sides so one remains visible.
- Cartons and outer cases target the bottom of the barcode at 32 mm from the natural base.
- Carton/case symbols should be at least 19 mm from a vertical edge.
- Each logistic unit should have at least one label.
- For stacked pallets shipped as one joined unit, assign an additional SSCC to the stacked pallet group and hide the original child labels while the group is shipped as a single unit.

Implementation implications:

- Add a help panel or generated instruction footer for placement rules.
- Future aggregation support should distinguish independent pallets from a wrapped stacked-pallet group.
- When a group-level SSCC is used, the app should make the group/master label explicit.

## Verification and Quality

The guideline recommends verification during implementation and repeated operational checks.

Verification should cover:

- Label dimensions.
- Placement of segments and building blocks.
- Correct language and content of data titles.
- Barcode visual quality, including lines, speckles, height, and quiet zones.
- GS1 Company Prefixes and GS1 identification keys.
- Check digits for GTIN and SSCC.
- Applied AIs and their structure.
- Valid AI combinations and mandatory associations.

Implementation implications:

- Add a label validation report before PDF generation.
- Add automated checks for SSCC/GTIN check digits and AI compatibility.
- Keep a generated-label sample set for manual scanner verification.
- Treat physical scanner testing and GS1 verification as required before production use.

## Suggested Product Roadmap

- Create an SSCC generator/allocator with GS1 Company Prefix configuration, serial reference management, check digit calculation, archive history, and one-year reuse prevention.
- Add label templates for SSCC-only, homogeneous unit, trade-item logistic unit, mixed pallet, parcel, and transport/customer segmented labels.
- Replace generic form fields with label-type-aware controls that only show valid AIs and combinations.
- Add a structured AI validation layer shared by the UI, API, and PDF generator.
- Add PDF layout checks for 4x6 dimensions, barcode height, quiet zones, HRI placement, and SSCC-lowest-barcode rules.
- Add optional placement instructions for pallets, cartons, parcels, and stacked pallet groups.
