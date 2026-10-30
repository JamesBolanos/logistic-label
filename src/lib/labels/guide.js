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
      'Identify one physical shipping unit with an SSCC. Use this when the pallet itself is the important identifier and its contents do not need to be shown; one product or mixed products are both fine. No GTIN, content, batch/lot, or item count is required.',
    useWhen: [
      'You need to identify and route one logistic unit.',
      'The pallet itself is the important identifier.',
      'Contents are one product or mixed and do not need to be encoded.',
      'You only need an SSCC plus printed transport details.'
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
    avoidWhen: ['The logistic unit contains different products or different GTINs.'],
    requiredData: ['Ship From', 'Ship To', 'Content GTIN', 'Packaging level', 'Exact count'],
    optionalData: ['PO Number', 'Carrier', 'Gross Weight', 'Lot', 'One applicable date'],
    barcodeSummary: [
      '(02) CONTENT + (37) COUNT',
      'Optional date + (10) lot',
      '(00) SSCC-18 at the bottom'
    ],
    sizes: ['4 × 6 — basic contents', '6 × 8 — detailed contents with lot or date'],
    generatorHref: '/labels?type=homogeneous_unit'
  },
  {
    id: 'basic-sscc',
    labelType: LABEL_TYPES.SSCC_BASIC,
    category: 'Minimal SSCC identification',
    title: 'Create a basic SSCC label',
    summary:
      'Identify one physical shipping unit with an SSCC only. The label prints the SSCC number and its GS1-128 barcode, without transport fields.',
    useWhen: [
      'You need only a scannable SSCC on a small label.',
      'Contents and transport details are tracked elsewhere.'
    ],
    avoidWhen: ['The label must show Ship From, Ship To, PO, carrier, weight, or count.'],
    requiredData: ['Configured GS1 Company Prefix'],
    optionalData: [],
    barcodeSummary: ['(00) SSCC-18'],
    sizes: ['4 × 3 — one label', '4 × 6 — two identical 4 × 3 copies'],
    generatorHref: '/labels?type=sscc_basic'
  }
]);

/** @param {unknown} labelType */
export function getSupportedLabelGuide(labelType) {
  return SUPPORTED_LABEL_GUIDES.find((guide) => guide.labelType === labelType) || null;
}
