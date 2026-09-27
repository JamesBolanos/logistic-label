export const LABEL_TYPES = Object.freeze({
  SSCC_ONLY: 'sscc_only',
  HOMOGENEOUS_UNIT: 'homogeneous_unit',
  LEGACY_DEMO: 'legacy_demo'
});

export const CURRENT_TEMPLATE_VERSION = 'v2';

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

/** @type {Set<string>} */
const supportedLabelTypes = new Set([LABEL_TYPES.SSCC_ONLY, LABEL_TYPES.HOMOGENEOUS_UNIT]);
const packagingLevelValues = new Set(PACKAGING_LEVELS.map((level) => level.value));

/** @param {unknown} value */
export function isSupportedLabelType(value) {
  return typeof value === 'string' && supportedLabelTypes.has(value);
}

/** @param {unknown} value */
export function isPackagingLevel(value) {
  return typeof value === 'string' && packagingLevelValues.has(value);
}

/** @param {unknown} value */
export function getLabelTypeName(value) {
  if (value === LABEL_TYPES.SSCC_ONLY) return 'SSCC-only';
  if (value === LABEL_TYPES.HOMOGENEOUS_UNIT) return 'Homogeneous unit';
  return 'Legacy demo';
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
