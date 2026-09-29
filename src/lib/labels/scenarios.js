import { LABEL_TYPES } from './workflows.js';

export const LABEL_SCENARIO_STATUSES = Object.freeze({
  AVAILABLE: 'available',
  PLANNED: 'planned',
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
      'Show where one pallet, carton, or parcel is moving and give that physical shipping unit a unique identity.',
    outputs: [
      'Ship From, Ship To, PO, carrier, weight, and count',
      'One GS1-128 barcode: (00) SSCC-18',
      '4 × 6 and compact print layouts'
    ],
    actionLabel: 'Create a transport label'
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
    id: 'trade-item-logistic-unit',
    labelType: null,
    category: 'Orderable case or pallet',
    title: 'Ship a case or pallet sold as one item',
    status: LABEL_SCENARIO_STATUSES.PLANNED,
    statusLabel: 'Planned',
    targetUser: 'Suppliers whose complete case or pallet has its own orderable GTIN.',
    description:
      'This is different from a pallet containing many cases. The complete shipping unit is itself the trade item.',
    // GS1 does not allow (01) GTIN to be combined with (02) CONTENT on one logistic label.
    outputs: [
      'Trade item: (01) GTIN',
      'Applicable lot or date attributes',
      'Logistic unit: (00) SSCC-18'
    ]
  },
  {
    id: 'variable-measure',
    labelType: null,
    category: 'Fresh food and variable measure',
    title: 'Ship variable-weight or perishable goods',
    status: LABEL_SCENARIO_STATUSES.PLANNED,
    statusLabel: 'Planned',
    targetUser: 'Meat, seafood, produce, and cold-chain suppliers.',
    description:
      'Capture the product, actual measure, lot, and applicable dates using rules defined for the specific trade-item scenario.',
    outputs: [
      'Product identification and an approved measure AI',
      'Applicable lot and date attributes',
      'Logistic unit: (00) SSCC-18'
    ]
  },
  {
    id: 'mixed-logistic-unit',
    labelType: null,
    category: 'Mixed products',
    title: 'Ship a pallet containing different products',
    status: LABEL_SCENARIO_STATUSES.PLANNED,
    statusLabel: 'Planned',
    targetUser: 'Distribution and fulfilment teams assembling mixed pallets or cartons.',
    description:
      'Identify the physical unit with an SSCC and communicate its different contents through an ASN, WMS, or another shipment record.',
    outputs: ['Logistic unit: (00) SSCC-18', 'Mixed contents remain in the linked business record']
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
