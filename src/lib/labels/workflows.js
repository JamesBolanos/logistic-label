export const LABEL_TYPES = Object.freeze({
  SSCC_ONLY: 'sscc_only',
  HOMOGENEOUS_UNIT: 'homogeneous_unit',
  LEGACY_DEMO: 'legacy_demo'
});

export const TEMPLATE_VERSIONS = Object.freeze({
  LEGACY: 'v1',
  GUIDED_CONTENT: 'v2',
  TRANSPORT: 'v3',
  STRUCTURED_CONTENT: 'v4'
});

export const PRINT_LAYOUTS = Object.freeze({
  FOUR_BY_SIX_SINGLE: '4x6_single',
  FOUR_BY_SIX_TWO_UP: '4x6_two_up',
  FOUR_BY_THREE_SINGLE: '4x3_single',
  SIX_BY_EIGHT_SINGLE: '6x8_single',
  THREE_BY_THREE_SINGLE: '3x3_single'
});

export const DEFAULT_PRINT_LAYOUT = PRINT_LAYOUTS.FOUR_BY_SIX_SINGLE;

export const HOMOGENEOUS_DATE_OPTIONS = Object.freeze([
  { value: '11', label: 'Production date', dataTitle: 'PROD DATE' },
  { value: '13', label: 'Packaging date', dataTitle: 'PACK DATE' },
  { value: '15', label: 'Best before date', dataTitle: 'BEST BEFORE' },
  { value: '16', label: 'Sell by date', dataTitle: 'SELL BY' },
  { value: '17', label: 'Expiry date', dataTitle: 'EXPIRY' }
]);

export const SSCC_PRINT_LAYOUT_OPTIONS = Object.freeze([
  {
    value: PRINT_LAYOUTS.FOUR_BY_SIX_SINGLE,
    label: '4 × 6 — one label',
    description: 'One SSCC label on a 4 × 6 inch page.',
    available: true
  },
  {
    value: PRINT_LAYOUTS.FOUR_BY_SIX_TWO_UP,
    label: '4 × 6 — two copies',
    description: 'Two identical 4 × 3 labels with the same SSCC and a cut guide.',
    available: true
  },
  {
    value: PRINT_LAYOUTS.FOUR_BY_THREE_SINGLE,
    label: '4 × 3 — one label',
    description: 'One compact SSCC label on a 4 × 3 inch page.',
    available: true
  },
  {
    value: PRINT_LAYOUTS.THREE_BY_THREE_SINGLE,
    label: '3 × 3 — unavailable',
    description: 'The compliant SSCC barcode and quiet zones require more than 3 inches of width.',
    available: false
  }
]);

export const HOMOGENEOUS_PRINT_LAYOUT_OPTIONS = Object.freeze([
  {
    value: PRINT_LAYOUTS.FOUR_BY_SIX_SINGLE,
    label: '4 × 6 — basic contents',
    description:
      'A compact transport label with content, count, and SSCC. Lot and date are not available at this size.',
    available: true
  },
  {
    value: PRINT_LAYOUTS.SIX_BY_EIGHT_SINGLE,
    label: '6 × 8 — detailed contents',
    description:
      'Recommended when lot or date traceability adds a third full-height GS1-128 barcode.',
    available: true
  }
]);

export const PACKAGING_LEVELS = Object.freeze([
  { value: 'case', label: 'Cases' },
  { value: 'carton', label: 'Cartons' },
  { value: 'pack', label: 'Packs' },
  { value: 'tray', label: 'Trays' },
  { value: 'bag', label: 'Bags' },
  { value: 'drum', label: 'Drums' },
  { value: 'each', label: 'Individual trade items' },
  { value: 'other', label: 'Other trade items' }
]);

export const TRANSPORT_WEIGHT_UNITS = Object.freeze([
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' }
]);

export const TRANSPORT_COUNT_TYPES = Object.freeze([
  { value: 'cartons', label: 'Cartons' },
  { value: 'cases', label: 'Cases' },
  { value: 'pallets', label: 'Pallets' },
  { value: 'parcels', label: 'Parcels' },
  { value: 'packages', label: 'Packages' },
  { value: 'pieces', label: 'Pieces' }
]);

/** @type {Set<string>} */
const supportedLabelTypes = new Set([LABEL_TYPES.SSCC_ONLY, LABEL_TYPES.HOMOGENEOUS_UNIT]);
const packagingLevelValues = new Set(PACKAGING_LEVELS.map((level) => level.value));
const homogeneousDateAis = new Set(HOMOGENEOUS_DATE_OPTIONS.map((option) => option.value));
const transportWeightUnits = new Set(TRANSPORT_WEIGHT_UNITS.map((unit) => unit.value));
const transportCountTypes = new Set(TRANSPORT_COUNT_TYPES.map((type) => type.value));
/** @type {Set<string>} */
const supportedPrintLayouts = new Set(
  [...SSCC_PRINT_LAYOUT_OPTIONS, ...HOMOGENEOUS_PRINT_LAYOUT_OPTIONS]
    .filter((layout) => layout.available)
    .map((layout) => layout.value)
);

/** @param {unknown} value */
export function isSupportedLabelType(value) {
  return typeof value === 'string' && supportedLabelTypes.has(value);
}

/** @param {unknown} value */
export function isPackagingLevel(value) {
  return typeof value === 'string' && packagingLevelValues.has(value);
}

/** @param {unknown} value */
export function isSupportedPrintLayout(value) {
  return typeof value === 'string' && supportedPrintLayouts.has(value);
}

/** @param {unknown} value */
export function isHomogeneousDateAi(value) {
  return typeof value === 'string' && homogeneousDateAis.has(value);
}

/** @param {unknown} value */
export function isTransportWeightUnit(value) {
  return typeof value === 'string' && transportWeightUnits.has(value);
}

/** @param {unknown} value */
export function isTransportCountType(value) {
  return typeof value === 'string' && transportCountTypes.has(value);
}

/** @param {unknown} value */
export function getHomogeneousDateOption(value) {
  return HOMOGENEOUS_DATE_OPTIONS.find((option) => option.value === value) || null;
}

/** @param {unknown} value @param {unknown} [labelType] @param {unknown} [templateVersion] */
export function getPrintLayoutName(value, labelType, templateVersion) {
  if (
    labelType === LABEL_TYPES.HOMOGENEOUS_UNIT &&
    templateVersion === TEMPLATE_VERSIONS.GUIDED_CONTENT &&
    value === PRINT_LAYOUTS.FOUR_BY_SIX_SINGLE
  ) {
    return '4 × 6 — original layout';
  }

  const options =
    labelType === LABEL_TYPES.HOMOGENEOUS_UNIT
      ? HOMOGENEOUS_PRINT_LAYOUT_OPTIONS
      : SSCC_PRINT_LAYOUT_OPTIONS;
  return (
    options.find((layout) => layout.value === value)?.label ||
    [...SSCC_PRINT_LAYOUT_OPTIONS, ...HOMOGENEOUS_PRINT_LAYOUT_OPTIONS].find(
      (layout) => layout.value === value
    )?.label ||
    '4 × 6'
  );
}

/** @param {unknown} value */
export function getLabelSizeForPrintLayout(value) {
  if (value === PRINT_LAYOUTS.SIX_BY_EIGHT_SINGLE) return '6x8';

  if (value === PRINT_LAYOUTS.FOUR_BY_SIX_TWO_UP || value === PRINT_LAYOUTS.FOUR_BY_THREE_SINGLE) {
    return '4x3';
  }

  return '4x6';
}

/** @param {unknown} value */
export function getLabelTypeName(value) {
  // These compact names appear in history and dashboards. The technical values
  // above remain unchanged because they are stored with every saved label.
  if (value === LABEL_TYPES.SSCC_ONLY) return 'Transport unit tracking';
  if (value === LABEL_TYPES.HOMOGENEOUS_UNIT) return 'Identical contents';
  return 'Legacy label';
}

/** @param {unknown} value */
export function getTemplateVersionForLabelType(value) {
  if (value === LABEL_TYPES.SSCC_ONLY) return TEMPLATE_VERSIONS.TRANSPORT;
  if (value === LABEL_TYPES.HOMOGENEOUS_UNIT) return TEMPLATE_VERSIONS.STRUCTURED_CONTENT;
  return TEMPLATE_VERSIONS.LEGACY;
}

/** @param {unknown} value @param {string | number} [count] */
export function getTransportCountTypeName(value, count = 2) {
  const plural = TRANSPORT_COUNT_TYPES.find((type) => type.value === value)?.label || 'Packages';
  if (Number(count) !== 1) return plural;
  return plural.endsWith('s') ? plural.slice(0, -1) : plural;
}

/** @param {unknown} value @param {string | number} [quantity] */
export function getPackagingLevelName(value, quantity = 2) {
  const match = PACKAGING_LEVELS.find((level) => level.value === value);
  const plural = match?.label || 'Trade items';

  if (Number(quantity) !== 1) return plural;
  if (value === 'each') return 'Individual trade item';
  if (value === 'other') return 'Other trade item';
  return plural.endsWith('s') ? plural.slice(0, -1) : plural;
}

/** @param {unknown} value @param {string | number} [quantity] */
export function getPackagingLevelPrintName(value, quantity = 2) {
  // "Individual trade items" explains the choice well in the form, but it is
  // too long for a compact label data cell. "Each" is the concise operational
  // unit name and keeps the count explicit instead of truncating its meaning.
  if (value === 'each') return 'Each';
  return getPackagingLevelName(value, quantity);
}
