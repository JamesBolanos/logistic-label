import { LABEL_TYPES } from './workflows.js';

/**
 * Public guidance for the two workflows the free generator currently supports.
 * Keeping these facts in data lets the guide and its tests share one contract.
 */
export const SUPPORTED_LABEL_GUIDES = Object.freeze([
  {
    id: 'transport-identification',
    labelType: LABEL_TYPES.SSCC_ONLY,
    category: 'Standard transport identification',
    title: 'Track one pallet, carton, or parcel',
    summary:
      'Give one physical shipping unit a unique SSCC while keeping its contents in an ASN, WMS, spreadsheet, or another business record.',
    useWhen: [
      'You need to identify and route one logistic unit.',
      'The contents are already recorded somewhere else.',
      'A customer-specific routing guide does not require another barcode.'
    ],
    avoidWhen: [
      'The label must encode a GTIN, item count, lot, or date.',
      'The receiving customer provides a mandatory label specification.'
    ],
    requiredData: ['Ship From', 'Ship To', 'Configured GS1 Company Prefix'],
    optionalData: ['PO Number', 'Carrier', 'Gross Weight', 'Count and count type'],
    barcodeSummary: ['(00) SSCC-18'],
    sizes: ['4 × 6 — one label', '4 × 6 — two identical 4 × 3 copies', '4 × 3 — one label'],
    generatorHref: '/labels?type=sscc_only'
  },
  {
    id: 'identical-contents',
    labelType: LABEL_TYPES.HOMOGENEOUS_UNIT,
    category: 'One-product pallet or shipping unit',
    title: 'Ship multiple identical cases or items',
    summary:
      'Describe a logistic unit whose contained trade items all use the same GTIN, with the count referring to that exact GTIN.',
    useWhen: [
      'Every contained case, carton, pack, or item has the same GTIN.',
      'You know the number of trade items identified by that GTIN.',
      'Optional lot or date traceability applies to the identical contents.'
    ],
    avoidWhen: [
      'The complete case or pallet is itself the orderable trade item using AI (01).',
      'The logistic unit contains different products or different GTINs.'
    ],
    requiredData: ['Ship From', 'Ship To', 'Content GTIN', 'Packaging level', 'Exact count'],
    optionalData: ['PO Number', 'Carrier', 'Gross Weight', 'Lot', 'One applicable date'],
    barcodeSummary: [
      '(02) CONTENT + (37) COUNT',
      'Optional date + (10) lot',
      '(00) SSCC-18 at the bottom'
    ],
    sizes: ['4 × 6 — basic contents', '6 × 8 — detailed contents with lot or date'],
    generatorHref: '/labels?type=homogeneous_unit'
  }
]);

/** @param {unknown} labelType */
export function getSupportedLabelGuide(labelType) {
  return SUPPORTED_LABEL_GUIDES.find((guide) => guide.labelType === labelType) || null;
}
