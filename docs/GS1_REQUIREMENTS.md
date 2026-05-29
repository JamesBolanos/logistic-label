# GS1 Requirements

This document captures GS1 rules that should guide label generation, validation, and future data-model changes.

Additional source: `docs/GS1_Logistic_Label_Guideline.pdf`.

For a web-app-focused analysis of the GS1 Logistic Label Guideline, see `docs/GS1_LOGISTIC_LABEL_GUIDE.md`.

## SSCC Rules

Source: GS1 General Specifications, Release 25.0, section 4.3, page 233.

### Allocating Serial Shipping Container Codes

#### General rule

An individual Serial Shipping Container Code (SSCC) is a unique number, which remains the same for the life of the logistic unit to which it is assigned. When assigning an SSCC, the rule is that an individual SSCC number must not be reallocated within one year of the shipment date from the SSCC assignor to a trading partner. However, prevailing regulatory or industry organisation specific requirements may extend this period.

#### Responsibility

The Serial Shipping Container Code (SSCC) provides functionality to support the management (tracking, tracing, storage, etc.) of logistic units through the supply chain. To ensure global uniqueness and traceability, the physical builder of the logistic unit or the brand owner of the logistic unit is responsible for the allocation of the SSCC.

### Aggregated/nested logistic units

Logistic units may be aggregated or nested into other logistic units for part of the journey to the final destination. For example, parcels may be combined onto pallets. In that case the SSCC of the higher logistic unit may be used to track and trace the contained logistic units. GS1 EDI and EPCIS support the electronic communication of such aggregations or nestings by enabling to specify links between the child SSCCs and parent SSCC.

When dealing with aggregated/nested logistic units in AIDC applications, the following rules apply to ensure correct identification of the higher logistic unit:

- Only the barcode of the higher logistic unit SHOULD be readable. The barcodes of the lower level logistic units should be obscured or otherwise prevented from being read, for example by instructing those scanning through a standard operating procedure.
- When using EPC/RFID tags, the filter value used for the higher logistic unit SHALL be different from the filter value used for the lower logistic units.

Informative note: See the GS1 Logistics Label Guideline for examples of the way to deal with nested/aggregated logistic units.

## Implementation Notes

- SSCC values should be treated as persistent identifiers for a logistic unit, not as disposable label numbers.
- The system should prevent reallocation of an SSCC for at least one year after shipment date, with configuration room for longer regulatory or industry-specific retention periods.
- SSCC allocation responsibility should be explicit in product/workflow design: the physical builder or brand owner of the logistic unit allocates the SSCC.
- Future aggregation support should model parent SSCC and child SSCC relationships.
- For nested logistic units, printed labels and scanning procedures should make only the higher-level logistic unit barcode readable when that higher-level SSCC is the intended identifier.
