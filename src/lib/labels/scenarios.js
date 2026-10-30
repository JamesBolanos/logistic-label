import { LABEL_TYPES } from './workflows.js';

export const LABEL_SCENARIO_STATUSES = Object.freeze({
  AVAILABLE: 'available',
  TAILORED: 'tailored'
});

/**
 * These records describe business situations for people who do not need to know
 * GS1 terminology before choosing a label. The `labelType` values remain the
 * stable database and API contract, so changing card copy cannot reinterpret a
 * previously saved label.
 */
export const LABEL_SCENARIOS = Object.freeze([
  {
    id: 'track-logistic-unit',
    labelType: LABEL_TYPES.SSCC_ONLY,
    category: 'Standard transport identification',
    title: 'Track a pallet, carton, or parcel',
    status: LABEL_SCENARIO_STATUSES.AVAILABLE,
    statusLabel: 'Available',
    targetUser: 'Warehouses, 3PL operators, cross-docking teams, and freight forwarders.',
    description:
      'Identify one physical shipping unit with an SSCC. Use this when the pallet itself is the important identifier and its contents do not need to be shown: the unit can contain one product or mixed products. No GTIN, content, batch/lot, or item count is required. Ship From, Ship To, PO, carrier, gross weight, and transport count can still be printed for handling, but gross weight does not require content data.',
    outputs: [
      'Ship From, Ship To, PO, carrier, weight, and count',
      'One GS1-128 barcode: (00) SSCC-18',
      '4 × 6 and compact print layouts'
    ],
    actionLabel: 'Create a transport label'
  },
  {
    id: 'basic-sscc-label',
    labelType: LABEL_TYPES.SSCC_BASIC,
    category: 'Minimal SSCC identification',
    title: 'Create a basic SSCC label',
    status: LABEL_SCENARIO_STATUSES.AVAILABLE,
    statusLabel: 'Available',
    targetUser: 'Users who need only a scannable SSCC on a small label.',
    description:
      'Identify one physical shipping unit with an SSCC only. The label prints the SSCC number and its GS1-128 barcode, without transport fields.',
    outputs: [
      'One GS1-128 barcode: (00) SSCC-18',
      '4 × 3 and two-copy 4 × 6 layouts'
    ],
    actionLabel: 'Create a basic SSCC label'
  },
  {
    id: 'ship-identical-items',
    labelType: LABEL_TYPES.HOMOGENEOUS_UNIT,
    category: 'One-product pallet or shipping unit',
    title: 'Ship multiple identical cases or items',
    status: LABEL_SCENARIO_STATUSES.AVAILABLE,
    statusLabel: 'Available',
    targetUser: 'Manufacturers and distributors shipping one type of case, carton, pack, or item.',
    description:
      'Use this when every contained trade item has the same GTIN. The quantity is the number of items identified by that exact GTIN.',
    outputs: [
      'Ship From, Ship To, PO, carrier, and Gross Weight',
      'Contents: (02) GTIN plus (37) count',
      'Optional lot and one applicable date',
      'Logistic unit: (00) SSCC-18',
      '4 × 6 basic or 6 × 8 detailed layout'
    ],
    actionLabel: 'Create a one-product label'
  },
  {
    id: 'customer-routing-guide',
    labelType: null,
    category: 'Customer-specific implementation',
    title: 'Follow a retailer or customer routing guide',
    status: LABEL_SCENARIO_STATUSES.TAILORED,
    statusLabel: 'Tailored solution',
    targetUser:
      'Suppliers serving retailers, distribution centres, and other enterprise customers.',
    description:
      'Build against the customer’s current routing guide, required shipment fields, printer workflow, and electronic data exchange.',
    outputs: [
      'Versioned customer-specific layout',
      'Optional ASN, order, routing, and printer integration'
    ]
  }
]);

/** @param {string} labelType */
export function getAvailableScenarioForLabelType(labelType) {
  return (
    LABEL_SCENARIOS.find(
      (scenario) =>
        scenario.status === LABEL_SCENARIO_STATUSES.AVAILABLE && scenario.labelType === labelType
    ) || null
  );
}
