import { LABEL_TYPES, PRINT_LAYOUTS } from './workflows.js';

/**
 * Public guidance for the workflows the free generator currently supports.
 * Keeping these facts in data lets the guide and its tests share one contract.
 * Each guide may carry Spanish (neutral Latin American) fields (*Es); English
 * is the fallback when a Spanish field is missing.
 */
export const SUPPORTED_LABEL_GUIDES = Object.freeze([
  {
    id: 'transport-identification',
    labelType: LABEL_TYPES.SSCC_ONLY,
    sampleLayout: PRINT_LAYOUTS.FOUR_BY_SIX_SINGLE,
    category: 'Standard transport identification',
    categoryEs: 'Identificación estándar de transporte',
    title: 'Track one pallet, carton, or parcel',
    titleEs: 'Seguir un pallet, caja o paquete',
    summary:
      'Identify one physical shipping unit with an SSCC. Use this when the pallet itself is the important identifier and its contents do not need to be shown; one product or mixed products are both fine. No GTIN, content, batch/lot, or item count is required.',
    summaryEs:
      'Identifica una unidad de envío física con un SSCC. Úsalo cuando el pallet mismo sea el identificador importante y su contenido no deba mostrarse; un producto o productos mixtos son igualmente válidos. No se requiere GTIN, contenido, lote/partida ni cantidad de artículos.',
    useWhen: [
      'You need to identify and route one logistic unit.',
      'The pallet itself is the important identifier.',
      'Contents are one product or mixed and do not need to be encoded.',
      'You only need an SSCC plus printed transport details.'
    ],
    useWhenEs: [
      'Necesitas identificar y enrutar una unidad logística.',
      'El pallet mismo es el identificador importante.',
      'El contenido es un producto o mixto y no necesita codificarse.',
      'Solo necesitas un SSCC más los detalles de transporte impresos.'
    ],
    avoidWhen: [
      'The label must encode a GTIN, item count, lot, or date.',
      'The receiving customer provides a mandatory label specification.'
    ],
    avoidWhenEs: [
      'La etiqueta debe codificar un GTIN, cantidad de artículos, lote o fecha.',
      'El cliente receptor proporciona una especificación de etiqueta obligatoria.'
    ],
    requiredData: ['Ship From', 'Ship To', 'Configured GS1 Company Prefix'],
    requiredDataEs: ['Origen', 'Destino', 'Prefijo de empresa GS1 configurado'],
    optionalData: ['PO Number', 'Carrier', 'Gross Weight', 'Count and count type'],
    optionalDataEs: ['Número de orden de compra', 'Transportista', 'Peso bruto', 'Cantidad y tipo de cantidad'],
    barcodeSummary: ['(00) SSCC-18'],
    barcodeSummaryEs: ['(00) SSCC-18'],
    sizes: ['4 × 6 — one label', '4 × 6 — two identical 4 × 3 copies', '4 × 3 — one label'],
    sizesEs: ['4 × 6 — una etiqueta', '4 × 6 — dos copias idénticas de 4 × 3', '4 × 3 — una etiqueta'],
    generatorHref: '/labels?type=sscc_only'
  },
  {
    id: 'identical-contents',
    labelType: LABEL_TYPES.HOMOGENEOUS_UNIT,
    sampleLayout: PRINT_LAYOUTS.SIX_BY_EIGHT_SINGLE,
    category: 'One-product pallet or shipping unit',
    categoryEs: 'Palé o unidad de envío de un producto',
    title: 'Ship multiple identical cases or items',
    titleEs: 'Enviar varios casos o artículos idénticos',
    summary:
      'Describe a logistic unit whose contained trade items all use the same GTIN, with the count referring to that exact GTIN.',
    summaryEs:
      'Describe una unidad logística cuyos artículos comerciales contenidos usan el mismo GTIN, con la cantidad referida a ese GTIN exacto.',
    useWhen: [
      'Every contained case, carton, pack, or item has the same GTIN.',
      'You know the number of trade items identified by that GTIN.',
      'Optional lot or date traceability applies to the identical contents.'
    ],
    useWhenEs: [
      'Cada caso, caja, paquete o artículo contenido tiene el mismo GTIN.',
      'Conoces el número de artículos comerciales identificados por ese GTIN.',
      'La trazabilidad opcional de lote o fecha se aplica a los contenidos idénticos.'
    ],
    avoidWhen: ['The logistic unit contains different products or different GTINs.'],
    avoidWhenEs: ['La unidad logística contiene productos diferentes o GTIN diferentes.'],
    requiredData: ['Ship From', 'Ship To', 'Content GTIN', 'Packaging level', 'Exact count'],
    requiredDataEs: ['Origen', 'Destino', 'GTIN del contenido', 'Nivel de embalaje', 'Cantidad exacta'],
    optionalData: ['PO Number', 'Carrier', 'Gross Weight', 'Lot', 'One applicable date'],
    optionalDataEs: ['Número de orden de compra', 'Transportista', 'Peso bruto', 'Lote', 'Una fecha aplicable'],
    barcodeSummary: [
      '(02) CONTENT + (37) COUNT',
      'Optional date + (10) lot',
      '(00) SSCC-18 at the bottom'
    ],
    barcodeSummaryEs: [
      '(02) CONTENIDO + (37) CANTIDAD',
      'Fecha opcional + (10) lote',
      '(00) SSCC-18 en la parte inferior'
    ],
    sizes: ['4 × 6 — basic contents', '6 × 8 — detailed contents with lot or date'],
    sizesEs: ['4 × 6 — contenidos básicos', '6 × 8 — contenidos detallados con lote o fecha'],
    generatorHref: '/labels?type=homogeneous_unit'
  },
  {
    id: 'basic-sscc',
    labelType: LABEL_TYPES.SSCC_BASIC,
    sampleLayout: PRINT_LAYOUTS.FOUR_BY_THREE_SINGLE,
    category: 'Minimal SSCC identification',
    categoryEs: 'Identificación SSCC mínima',
    title: 'Create a basic SSCC label',
    titleEs: 'Crear una etiqueta SSCC básica',
    summary:
      'Identify one physical shipping unit with an SSCC only. The label prints the SSCC number and its GS1-128 barcode, without transport fields.',
    summaryEs:
      'Identifica una unidad de envío física solo con un SSCC. La etiqueta imprime el número SSCC y su código de barras GS1-128, sin campos de transporte.',
    useWhen: [
      'You need only a scannable SSCC on a small label.',
      'Contents and transport details are tracked elsewhere.'
    ],
    useWhenEs: [
      'Solo necesitas un SSCC escaneable en una etiqueta pequeña.',
      'El contenido y los detalles de transporte se rastrean en otro lugar.'
    ],
    avoidWhen: ['The label must show Ship From, Ship To, PO, carrier, weight, or count.'],
    avoidWhenEs: ['La etiqueta debe mostrar Origen, Destino, orden de compra, transportista, peso o cantidad.'],
    requiredData: ['Configured GS1 Company Prefix'],
    requiredDataEs: ['Prefijo de empresa GS1 configurado'],
    optionalData: [],
    optionalDataEs: [],
    barcodeSummary: ['(00) SSCC-18'],
    barcodeSummaryEs: ['(00) SSCC-18'],
    sizes: ['4 × 3 — one label', '4 × 6 — two identical 4 × 3 copies'],
    sizesEs: ['4 × 3 — una etiqueta', '4 × 6 — dos copias idénticas de 4 × 3'],
    generatorHref: '/labels?type=sscc_basic'
  }
]);

/** @param {unknown} labelType */
export function getSupportedLabelGuide(labelType) {
  return SUPPORTED_LABEL_GUIDES.find((guide) => guide.labelType === labelType) || null;
}

/** @param {any} guide @param {string} [locale] */
export function localizeGuide(guide, locale = 'en') {
  const isSpanish = String(locale).startsWith('es');
  if (!isSpanish) return guide;
  return {
    ...guide,
    category: guide.categoryEs ?? guide.category,
    title: guide.titleEs ?? guide.title,
    summary: guide.summaryEs ?? guide.summary,
    useWhen: guide.useWhenEs ?? guide.useWhen,
    avoidWhen: guide.avoidWhenEs ?? guide.avoidWhen,
    requiredData: guide.requiredDataEs ?? guide.requiredData,
    optionalData: guide.optionalDataEs ?? guide.optionalData,
    barcodeSummary: guide.barcodeSummaryEs ?? guide.barcodeSummary,
    sizes: guide.sizesEs ?? guide.sizes
  };
}