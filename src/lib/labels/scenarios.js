import { LABEL_TYPES } from './workflows.js';

export const LABEL_SCENARIO_STATUSES = Object.freeze({
  AVAILABLE: 'available',
  TAILORED: 'tailored'
});

export const LABEL_SCENARIOS = Object.freeze([
  {
    id: 'track-logistic-unit',
    labelType: LABEL_TYPES.SSCC_ONLY,
    category: 'Standard transport identification',
    categoryEs: 'Identificación estándar de transporte',
    title: 'Track a pallet, carton, or parcel',
    titleEs: 'Seguir un pallet, caja o paquete',
    status: LABEL_SCENARIO_STATUSES.AVAILABLE,
    statusLabel: 'Available',
    statusLabelEs: 'Disponible',
    targetUser: 'Warehouses, 3PL operators, cross-docking teams, and freight forwarders.',
    targetUserEs: 'Almacenes, operadores 3PL, equipos de cross-docking y transitarios.',
    description:
      'Identify one physical shipping unit with an SSCC. Use this when the pallet itself is the important identifier and its contents do not need to be shown: the unit can contain one product or mixed products. No GTIN, content, batch/lot, or item count is required. Ship From, Ship To, PO, carrier, gross weight, and transport count can still be printed for handling, but gross weight does not require content data.',
    descriptionEs:
      'Identifica una unidad de envío física con un SSCC. Úsalo cuando el pallet mismo sea el identificador importante y su contenido no sea necesario mostrarse: la unidad puede contener un producto o productos mixtos. No se requiere GTIN, contenido, lote/partida ni cantidad de artículos. Origen, Destino, orden de compra, transportista, peso bruto y cantidad de transporte aún se pueden adjuntar, pero el peso bruto no requiere datos de contenido.',
    outputs: [
      'Ship From, Ship To, PO, carrier, weight, and count',
      'One GS1-128 barcode: (00) SSCC-18',
      '4 × 6 and compact print layouts'
    ],
    outputsEs: [
      'Origen, Destino, orden de compra, transportista, peso y cantidad',
      'Un código de barras GS1-128: (00) SSCC-18',
      'Diseños de impresión de 4 × 6 y compactos'
    ],
    actionLabel: 'Create a transport label',
    actionLabelEs: 'Crear una etiqueta de transporte'
  },
  {
    id: 'ship-identical-items',
    labelType: LABEL_TYPES.HOMOGENEOUS_UNIT,
    category: 'One-product pallet or shipping unit',
    categoryEs: 'Palet o unidad de envío de un producto',
    title: 'Ship multiple identical cases or items',
    titleEs: 'Enviar varios casos o artículos idénticos',
    status: LABEL_SCENARIO_STATUSES.AVAILABLE,
    statusLabel: 'Available',
    statusLabelEs: 'Disponible',
    targetUser: 'Manufacturers and distributors shipping one type of case, carton, pack, or item.',
    targetUserEs: 'Fabricantes y distribuidores que envían una unidad de distribucion, paquete o artículo.',
    description:
      'Use this when every contained trade item has the same GTIN. The quantity is the number of items identified by that exact GTIN.',
    descriptionEs:
      'Úsalo cuando todos los artículos comerciales contenidos tengan el mismo GTIN. La cantidad es el número de artículos identificados por ese GTIN exacto.',
    outputs: [
      'Ship From, Ship To, PO, carrier, and Gross Weight',
      'Contents: (02) GTIN plus (37) count',
      'Optional lot and one applicable date',
      'Logistic unit: (00) SSCC-18',
      '4 × 6 basic or 6 × 8 detailed layout'
    ],
    outputsEs: [
      'Origen, Destino, orden de compra, transportista y peso bruto',
      'Contenidos: (02) GTIN más (37) cantidad',
      'Lote opcional y una fecha aplicable',
      'Unidad logística: (00) SSCC-18',
      'Diseño básico de 4 × 6 o detallado de 6 × 8'
    ],
    actionLabel: 'Create a one-product label',
    actionLabelEs: 'Crear una etiqueta de un producto'
  },
  {
    id: 'basic-sscc-label',
    labelType: LABEL_TYPES.SSCC_BASIC,
    category: 'Minimal SSCC identification',
    categoryEs: 'Identificación SSCC mínima',
    title: 'Create a basic SSCC label',
    titleEs: 'Crear una etiqueta SSCC básica',
    status: LABEL_SCENARIO_STATUSES.AVAILABLE,
    statusLabel: 'Available',
    statusLabelEs: 'Disponible',
    targetUser: 'Users who need only a scannable SSCC on a small label.',
    targetUserEs: 'Usuarios que solo necesitan un SSCC escaneable en una etiqueta pequeña.',
    description:
      'Identify one physical shipping unit with an SSCC only. The label prints the SSCC number and its GS1-128 barcode, without transport fields.',
    descriptionEs:
      'Identifica una unidad de envío física solo con un SSCC. La etiqueta imprime el número SSCC y su código de barras GS1-128, sin campos de transporte adicionales.',
    outputs: [
      'One GS1-128 barcode: (00) SSCC-18',
      '4 × 3 and two-copy 4 × 6 layouts'
    ],
    outputsEs: [
      'Un código de barras GS1-128: (00) SSCC-18',
      'Diseños de 4 × 3 y de dos copias de 4 × 6'
    ],
    actionLabel: 'Create a basic SSCC label',
    actionLabelEs: 'Crear una etiqueta SSCC básica'
  },
  {
    id: 'customer-routing-guide',
    labelType: null,
    category: 'Customer-specific implementation',
    categoryEs: 'Implementación específica del cliente',
    title: 'Follow a retailer or customer routing guide',
    titleEs: 'Seguir una guía de enrutamiento de minorista o cliente',
    status: LABEL_SCENARIO_STATUSES.TAILORED,
    statusLabel: 'Tailored solution',
    statusLabelEs: 'Solución personalizada',
    targetUser:
      'Suppliers serving retailers, distribution centres, and other enterprise customers.',
    targetUserEs:
      'Proveedores que sirven a minoristas, centros de distribución y otros clientes empresariales.',
    description:
      'Build against the customer’s current routing guide, required shipment fields, printer workflow, and electronic data exchange.',
    descriptionEs:
      'Desarrolla según la guía de enrutamiento actual del cliente, los campos de envío requeridos, el flujo de trabajo de impresión y el intercambio electrónico de datos.',
    outputs: [
      'Versioned customer-specific layout',
      'Optional ASN, order, routing, and printer integration'
    ],
    outputsEs: [
      'Diseño versionado específico del cliente',
      'Integración opcional de ASN, pedido, enrutamiento e impresora'
    ]
  }
]);

/** @param {unknown} labelType */
export function getAvailableScenarioForLabelType(labelType) {
  return (
    LABEL_SCENARIOS.find(
      (scenario) =>
        scenario.status === LABEL_SCENARIO_STATUSES.AVAILABLE && scenario.labelType === labelType
    ) || null
  );
}

/** @param {any} scenario @param {string} [locale] */
export function localizeScenario(scenario, locale = 'en') {
  const isSpanish = String(locale).startsWith('es');
  if (!isSpanish) return scenario;
  return {
    ...scenario,
    category: scenario.categoryEs ?? scenario.category,
    title: scenario.titleEs ?? scenario.title,
    statusLabel: scenario.statusLabelEs ?? scenario.statusLabel,
    targetUser: scenario.targetUserEs ?? scenario.targetUser,
    description: scenario.descriptionEs ?? scenario.description,
    outputs: scenario.outputsEs ?? scenario.outputs,
    actionLabel: scenario.actionLabelEs ?? scenario.actionLabel
  };
}