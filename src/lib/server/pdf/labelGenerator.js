import { buildGs1Elements, getBarcodeModules, humanReadable } from './gs1Barcode.js';
import {
  DEFAULT_PRINT_LAYOUT,
  getHomogeneousDateOption,
  getPackagingLevelName,
  getTransportCountTypeName,
  LABEL_TYPES,
  PRINT_LAYOUTS,
  TEMPLATE_VERSIONS
} from '$lib/labels/workflows.js';

const PAGE_WIDTH = 288;
const PAGE_HEIGHT = 432;
const LARGE_PAGE_WIDTH = 432;
const LARGE_PAGE_HEIGHT = 576;
const COMPACT_PAGE_HEIGHT = 216;
const MARGIN = 18;
const POINTS_PER_INCH = 72;
const MILLIMETERS_PER_INCH = 25.4;
const TARGET_X_DIMENSION_MM = 0.495;
const MINIMUM_BAR_HEIGHT_MM = 31.75;
const QUIET_ZONE_MODULES = 10;
const TARGET_X_DIMENSION_POINTS = (TARGET_X_DIMENSION_MM / MILLIMETERS_PER_INCH) * POINTS_PER_INCH;
const MINIMUM_BAR_HEIGHT_POINTS = (MINIMUM_BAR_HEIGHT_MM / MILLIMETERS_PER_INCH) * POINTS_PER_INCH;

export async function generateLogisticLabelPDF(labelData, options = {}) {
  if (
    labelData.template_version === TEMPLATE_VERSIONS.STRUCTURED_CONTENT &&
    labelData.label_type === LABEL_TYPES.HOMOGENEOUS_UNIT
  ) {
    return generateStructuredHomogeneousLabelPDF(labelData);
  }

  if (
    labelData.template_version === TEMPLATE_VERSIONS.TRANSPORT &&
    labelData.label_type === LABEL_TYPES.SSCC_ONLY
  ) {
    return generateTransportLabelPDF(labelData);
  }

  if (
    labelData.template_version === TEMPLATE_VERSIONS.GUIDED_CONTENT &&
    (labelData.label_type === LABEL_TYPES.SSCC_ONLY ||
      labelData.label_type === LABEL_TYPES.HOMOGENEOUS_UNIT)
  ) {
    return generateGuidedLabelPDF(labelData, options);
  }

  return generateLegacyLabelPDF(labelData, options);
}

function generateTransportLabelPDF(labelData) {
  const elements = buildGs1Elements(labelData);
  const printLayout = labelData.print_layout || DEFAULT_PRINT_LAYOUT;
  const content = [];

  // The 4 × 6 layout uses GS1's transport/customer/supplier reading order:
  // routing fields first, logistic measures second, and the SSCC barcode last.
  if (printLayout === PRINT_LAYOUTS.FOUR_BY_SIX_SINGLE) {
    drawTransportLabel(content, labelData, elements, 0, false);
    return createPdf(content.join('\n'), PAGE_WIDTH, PAGE_HEIGHT);
  }

  if (printLayout === PRINT_LAYOUTS.FOUR_BY_THREE_SINGLE) {
    drawTransportLabel(content, labelData, elements, 0, true);
    return createPdf(content.join('\n'), PAGE_WIDTH, COMPACT_PAGE_HEIGHT);
  }

  if (printLayout === PRINT_LAYOUTS.FOUR_BY_SIX_TWO_UP) {
    drawTransportLabel(content, labelData, elements, COMPACT_PAGE_HEIGHT, true);
    drawTransportLabel(content, labelData, elements, 0, true);
    drawCutGuide(content, COMPACT_PAGE_HEIGHT, PAGE_WIDTH);
    return createPdf(content.join('\n'), PAGE_WIDTH, PAGE_HEIGHT);
  }

  throw new Error('Unsupported transport-label print layout');
}

function drawTransportLabel(content, labelData, elements, originY, compact) {
  const rightColumn = 150;
  const columnWidth = 120;
  const grossWeight = formatGrossWeight(labelData);
  const count = formatTransportCount(labelData);

  if (!compact) {
    const left = 12;
    const right = PAGE_WIDTH - 12;
    const middle = PAGE_WIDTH / 2;

    // A boxed zone layout lets warehouse staff scan the label visually in the
    // same order every time while keeping the SSCC symbol isolated at the bottom.
    drawOutlineRect(content, left, 18, right - left, 402, 1.2);
    drawLine(content, left, 332, right, 332, 2.2);
    drawLine(content, middle, 332, middle, 420, 0.8);
    drawAddressBlock(content, 'SHIP FROM', labelData.ship_from, 18, 120, 408);
    drawAddressBlock(content, 'SHIP TO', labelData.ship_to, 150, 120, 408);

    drawLine(content, left, 282, right, 282, 2.2);
    drawLargeInfoField(
      content,
      'PO NUMBER',
      labelData.purchase_order || '-',
      18,
      252,
      318,
      292,
      20
    );

    drawLine(content, left, 220, right, 220, 2.2);
    drawLargeInfoField(content, 'CARRIER', labelData.carrier || '-', 18, 252, 268, 234, 27);

    drawLine(content, left, 168, right, 168, 2.2);
    drawLine(content, middle, 168, middle, 220, 0.8);
    drawLargeInfoField(content, 'GROSS WEIGHT', grossWeight, 18, 120, 206, 181, 15);
    drawLargeInfoField(content, 'COUNT', count, 150, 120, 206, 181, 15);

    drawCenteredText(content, 'SSCC', PAGE_WIDTH / 2, 154, 8, true);
    drawCenteredText(content, labelData.sscc, PAGE_WIDTH / 2, 138, 13, true);
    drawCompliantBarcode(content, elements, 40, PAGE_WIDTH);
    drawCenteredText(content, humanReadable(elements), PAGE_WIDTH / 2, 25, 9);
    return;
  }

  // Compact copies retain the same transport meaning at smaller type while
  // preserving the full-size compliant SSCC barcode and quiet zones.
  drawInfoFieldFitted(
    content,
    'SHIP FROM',
    labelData.ship_from,
    MARGIN,
    columnWidth,
    originY + 205
  );
  drawInfoFieldFitted(
    content,
    'SHIP TO',
    labelData.ship_to,
    rightColumn,
    columnWidth,
    originY + 205
  );
  drawInfoFieldFitted(
    content,
    'PO NUMBER',
    labelData.purchase_order || '-',
    MARGIN,
    columnWidth,
    originY + 177
  );
  drawInfoFieldFitted(
    content,
    'CARRIER',
    labelData.carrier || '-',
    rightColumn,
    columnWidth,
    originY + 177
  );
  drawInfoFieldFitted(content, 'GROSS WEIGHT', grossWeight, MARGIN, columnWidth, originY + 149);
  drawInfoFieldFitted(content, 'COUNT', count, rightColumn, columnWidth, originY + 149);
  drawCompliantBarcode(content, elements, originY + 22, PAGE_WIDTH);
  drawCenteredText(content, humanReadable(elements), PAGE_WIDTH / 2, originY + 8, 8);
}

function formatGrossWeight(labelData) {
  if (labelData.gross_weight == null || !labelData.gross_weight_unit) return '-';
  return `${Number(labelData.gross_weight).toLocaleString('en-US')} ${labelData.gross_weight_unit}`;
}

function formatTransportCount(labelData) {
  if (labelData.transport_count == null || !labelData.transport_count_type) return '-';
  return `${Number(labelData.transport_count).toLocaleString('en-US')} ${getTransportCountTypeName(
    labelData.transport_count_type,
    labelData.transport_count
  )}`;
}

function generateStructuredHomogeneousLabelPDF(labelData) {
  const elements = buildGs1Elements(labelData);
  const printLayout = labelData.print_layout || DEFAULT_PRINT_LAYOUT;
  validateGuidedLabelBarcodeFit(labelData, elements);

  const content = [];
  if (printLayout === PRINT_LAYOUTS.FOUR_BY_SIX_SINGLE) {
    drawStructuredHomogeneousFourBySix(content, labelData, elements);
    return createPdf(content.join('\n'), PAGE_WIDTH, PAGE_HEIGHT);
  }

  if (printLayout === PRINT_LAYOUTS.SIX_BY_EIGHT_SINGLE) {
    drawStructuredHomogeneousSixByEight(content, labelData, elements);
    return createPdf(content.join('\n'), LARGE_PAGE_WIDTH, LARGE_PAGE_HEIGHT);
  }

  throw new Error('Unsupported identical-contents print layout');
}

function drawStructuredHomogeneousFourBySix(content, labelData, elements) {
  const left = 12;
  const right = PAGE_WIDTH - 12;
  const middle = PAGE_WIDTH / 2;
  const contentElements = getHomogeneousContentElements(elements);
  const ssccElements = getSSCCElements(elements);

  // The compact label contains routing data plus two complete barcode blocks.
  // Optional traceability is reserved for 6 × 8 rather than shrinking symbols.
  drawOutlineRect(content, left, 4, right - left, 416, 1.2);
  drawLine(content, left, 354, right, 354, 2.2);
  drawLine(content, middle, 354, middle, 420, 0.8);
  drawAddressBlock(content, 'SHIP FROM', labelData.ship_from, 18, 120, 408);
  drawAddressBlock(content, 'SHIP TO', labelData.ship_to, 150, 120, 408);

  drawLine(content, left, 322, right, 322, 1.2);
  drawLargeInfoField(content, 'PO NUMBER', labelData.purchase_order || '-', 18, 252, 347, 331, 13);

  drawLine(content, left, 286, right, 286, 1.2);
  drawLine(content, 196, 286, 196, 322, 0.8);
  drawLargeInfoField(content, 'CARRIER', labelData.carrier || '-', 18, 166, 314, 298, 13);
  drawLargeInfoField(content, 'GROSS WEIGHT', formatGrossWeight(labelData), 202, 68, 314, 298, 11);

  drawLine(content, left, 246, right, 246, 2.2);
  drawLine(content, 190, 246, 190, 286, 0.8);
  drawLargeInfoField(content, 'CONTENT GTIN', labelData.gtin, 18, 160, 278, 260, 13);
  drawLargeInfoField(content, 'COUNT', formatHomogeneousCount(labelData), 196, 74, 278, 260, 11);

  drawCenteredText(content, 'CONTENT AND COUNT', PAGE_WIDTH / 2, 239, 7, true);
  drawCompliantBarcode(content, contentElements, 145, PAGE_WIDTH);
  drawCenteredText(content, humanReadable(contentElements), PAGE_WIDTH / 2, 129, 9);

  drawCenteredText(content, 'SSCC', PAGE_WIDTH / 2, 118, 7, true);
  drawCompliantBarcode(content, ssccElements, 25, PAGE_WIDTH);
  drawCenteredText(content, humanReadable(ssccElements), PAGE_WIDTH / 2, 10, 9);
}

function drawStructuredHomogeneousSixByEight(content, labelData, elements) {
  const left = 12;
  const right = LARGE_PAGE_WIDTH - 12;
  const middle = LARGE_PAGE_WIDTH / 2;
  const contentElements = getHomogeneousContentElements(elements);
  const traceabilityElements = getHomogeneousTraceabilityElements(elements);
  const ssccElements = getSSCCElements(elements);
  const dateOption = getHomogeneousDateOption(labelData.date_ai);

  // GS1 identifies 6 × 8 (or A5) as a useful larger label when trade-item
  // information must accompany the SSCC. The added height protects all three
  // 31.75 mm barcode heights instead of compressing the symbols.
  drawOutlineRect(content, left, 4, right - left, 564, 1.2);
  drawLine(content, left, 494, right, 494, 2.2);
  drawLine(content, middle, 494, middle, 568, 0.8);
  drawAddressBlock(content, 'SHIP FROM', labelData.ship_from, 18, 186, 556);
  drawAddressBlock(content, 'SHIP TO', labelData.ship_to, 222, 186, 556);

  drawLine(content, left, 452, right, 452, 1.2);
  drawLine(content, middle, 452, middle, 494, 0.8);
  drawLargeInfoField(content, 'PO NUMBER', labelData.purchase_order || '-', 18, 186, 486, 468, 15);
  drawLargeInfoField(content, 'CARRIER', labelData.carrier || '-', 222, 186, 486, 468, 15);

  drawLine(content, left, 410, right, 410, 1.2);
  drawLine(content, 232, 410, 232, 452, 0.8);
  drawLine(content, 334, 410, 334, 452, 0.8);
  drawLargeInfoField(content, 'CONTENT GTIN', labelData.gtin, 18, 202, 444, 426, 15);
  drawLargeInfoField(content, 'COUNT', formatHomogeneousCount(labelData), 240, 84, 444, 426, 12);
  drawLargeInfoField(content, 'GROSS WEIGHT', formatGrossWeight(labelData), 342, 72, 444, 426, 11);

  drawLine(content, left, 376, right, 376, 2.2);
  drawLine(content, middle, 376, middle, 410, 0.8);
  drawInfoFieldFitted(content, 'BATCH/LOT', labelData.lot_number || '-', 18, 186, 402);
  drawInfoFieldFitted(
    content,
    dateOption?.dataTitle || 'DATE',
    labelData.date_value || '-',
    222,
    186,
    402
  );

  if (traceabilityElements.length) {
    drawBarcodeBlock(
      content,
      'CONTENT AND COUNT',
      contentElements,
      366,
      268,
      252,
      LARGE_PAGE_WIDTH
    );
    drawBarcodeBlock(
      content,
      'LOT AND DATE TRACEABILITY',
      traceabilityElements,
      244,
      146,
      130,
      LARGE_PAGE_WIDTH
    );
    drawBarcodeBlock(content, 'SSCC', ssccElements, 122, 24, 9, LARGE_PAGE_WIDTH);
    return;
  }

  drawBarcodeBlock(content, 'CONTENT AND COUNT', contentElements, 366, 268, 252, LARGE_PAGE_WIDTH);
  drawBarcodeBlock(content, 'SSCC', ssccElements, 194, 96, 80, LARGE_PAGE_WIDTH);
}

function drawBarcodeBlock(content, title, elements, titleY, barcodeY, hriY, pageWidth) {
  drawCenteredText(content, title, pageWidth / 2, titleY, 7, true);
  drawCompliantBarcode(content, elements, barcodeY, pageWidth);
  drawCenteredText(content, humanReadable(elements), pageWidth / 2, hriY, 9);
}

function getHomogeneousContentElements(elements) {
  return elements.filter((item) => item.ai === '02' || item.ai === '37');
}

function getSSCCElements(elements) {
  return elements.filter((item) => item.ai === '00');
}

function formatHomogeneousCount(labelData) {
  return `${Number(labelData.quantity).toLocaleString('en-US')} ${getPackagingLevelName(
    labelData.packaging_level,
    labelData.quantity
  )}`;
}

function generateGuidedLabelPDF(labelData, options) {
  const elements = buildGs1Elements(labelData);
  validateGuidedLabelBarcodeFit(labelData, elements);

  if (labelData.label_type === LABEL_TYPES.SSCC_ONLY) {
    return generateSSCCOnlyPDF(labelData, options, elements);
  }

  const content = [];

  drawCenteredText(
    content,
    options.company_name || labelData.company_name || 'COMPANY NAME',
    PAGE_WIDTH / 2,
    410,
    15,
    true
  );
  if (!getHomogeneousTraceabilityElements(elements).length) {
    drawLine(content, MARGIN, 392, PAGE_WIDTH - MARGIN, 392);
  }

  drawHomogeneousLabel(content, labelData, elements);

  return createPdf(content.join('\n'));
}

function generateSSCCOnlyPDF(labelData, options, elements) {
  const printLayout = labelData.print_layout || DEFAULT_PRINT_LAYOUT;
  const companyName = options.company_name || labelData.company_name || 'COMPANY NAME';
  const content = [];

  if (printLayout === PRINT_LAYOUTS.FOUR_BY_SIX_SINGLE) {
    drawSSCCSingleLabel(content, labelData, elements, companyName);
    return createPdf(content.join('\n'), PAGE_WIDTH, PAGE_HEIGHT);
  }

  if (printLayout === PRINT_LAYOUTS.FOUR_BY_THREE_SINGLE) {
    drawCompactSSCCLabel(content, labelData, elements, companyName, 0);
    return createPdf(content.join('\n'), PAGE_WIDTH, COMPACT_PAGE_HEIGHT);
  }

  if (printLayout === PRINT_LAYOUTS.FOUR_BY_SIX_TWO_UP) {
    drawCompactSSCCLabel(content, labelData, elements, companyName, COMPACT_PAGE_HEIGHT);
    drawCompactSSCCLabel(content, labelData, elements, companyName, 0);
    drawCutGuide(content, COMPACT_PAGE_HEIGHT, PAGE_WIDTH);
    return createPdf(content.join('\n'), PAGE_WIDTH, PAGE_HEIGHT);
  }

  throw new Error('Unsupported SSCC print layout');
}

function drawSSCCSingleLabel(content, labelData, elements, companyName) {
  drawCenteredText(content, companyName, PAGE_WIDTH / 2, 410, 15, true);
  drawLine(content, MARGIN, 392, PAGE_WIDTH - MARGIN, 392);
  drawCenteredInfoField(content, 'SSCC', labelData.sscc, PAGE_WIDTH / 2, 363, 340, 20);

  drawCompliantBarcode(content, elements, 220, PAGE_WIDTH);
  drawCenteredText(content, humanReadable(elements), PAGE_WIDTH / 2, 202, 10);
}

function drawCompactSSCCLabel(content, labelData, elements, companyName, originY) {
  drawCenteredText(content, companyName, PAGE_WIDTH / 2, originY + 198, 15, true);
  drawLine(content, MARGIN, originY + 181, PAGE_WIDTH - MARGIN, originY + 181);
  drawCenteredInfoField(
    content,
    'SSCC',
    labelData.sscc,
    PAGE_WIDTH / 2,
    originY + 166,
    originY + 145,
    19
  );

  drawCompliantBarcode(content, elements, originY + 42, PAGE_WIDTH);
  drawCenteredText(content, humanReadable(elements), PAGE_WIDTH / 2, originY + 24, 10);
}

function drawHomogeneousLabel(content, labelData, elements) {
  const contentElements = elements.filter((item) => item.ai === '02' || item.ai === '37');
  const traceabilityElements = getHomogeneousTraceabilityElements(elements);
  const ssccElements = elements.filter((item) => item.ai === '00');

  if (!traceabilityElements.length) {
    drawInfoField(content, 'CONTENT', labelData.gtin, MARGIN, 374, 16);
    drawInfoField(content, 'COUNT', String(labelData.quantity), 222, 374, 16);
    drawInfoField(content, 'SSCC', labelData.sscc, MARGIN, 333, 16);

    drawCompliantBarcode(content, contentElements, 190);
    drawCenteredText(content, humanReadable(contentElements), PAGE_WIDTH / 2, 174, 9);

    drawCompliantBarcode(content, ssccElements, 55);
    drawCenteredText(content, humanReadable(ssccElements), PAGE_WIDTH / 2, 39, 9);
    return;
  }

  drawInfoFieldFitted(content, 'CONTENT', labelData.gtin, MARGIN, 190, 386);
  drawInfoFieldFitted(content, 'COUNT', String(labelData.quantity), 222, 48, 386);
  drawHomogeneousTraceabilityFields(content, labelData);

  drawCompliantBarcode(content, contentElements, 246);
  drawCenteredText(content, humanReadable(contentElements), PAGE_WIDTH / 2, 231, 9);

  drawCompliantBarcode(content, traceabilityElements, 134);
  drawCenteredText(content, humanReadable(traceabilityElements), PAGE_WIDTH / 2, 119, 9);

  drawCompliantBarcode(content, ssccElements, 22);
  drawCenteredText(content, humanReadable(ssccElements), PAGE_WIDTH / 2, 7, 9);
}

function getHomogeneousTraceabilityElements(elements) {
  return elements.filter((item) => item.ai === '10' || getHomogeneousDateOption(item.ai));
}

function drawHomogeneousTraceabilityFields(content, labelData) {
  const dateOption = getHomogeneousDateOption(labelData.date_ai);
  const hasDate = Boolean(dateOption && labelData.date_value);
  const hasLot = Boolean(labelData.lot_number);

  if (hasDate && hasLot) {
    drawInfoFieldFitted(content, dateOption.dataTitle, labelData.date_value, MARGIN, 88, 356);
    drawInfoFieldFitted(content, 'BATCH/LOT', labelData.lot_number, 106, 78, 356);
    drawInfoFieldFitted(content, 'SSCC', labelData.sscc, 190, 80, 356);
    return;
  }

  if (hasDate) {
    drawInfoFieldFitted(content, dateOption.dataTitle, labelData.date_value, MARGIN, 126, 356);
  } else {
    drawInfoFieldFitted(content, 'BATCH/LOT', labelData.lot_number, MARGIN, 126, 356);
  }

  drawInfoFieldFitted(content, 'SSCC', labelData.sscc, 154, 116, 356);
}

export function validateGuidedLabelBarcodeFit(labelData, elements = buildGs1Elements(labelData)) {
  if (labelData.label_type !== LABEL_TYPES.HOMOGENEOUS_UNIT) return;

  const isLargeLayout = labelData.print_layout === PRINT_LAYOUTS.SIX_BY_EIGHT_SINGLE;
  const pageWidth = isLargeLayout ? LARGE_PAGE_WIDTH : PAGE_WIDTH;
  const labelSize = isLargeLayout ? '6 × 8' : '4 × 6';

  const groups = [
    {
      name: 'content and count',
      elements: elements.filter((item) => item.ai === '02' || item.ai === '37')
    },
    {
      name: 'optional lot and date',
      elements: elements.filter((item) => item.ai === '10' || getHomogeneousDateOption(item.ai))
    }
  ];

  for (const group of groups) {
    if (!group.elements.length) continue;
    if (calculateBarcodeGeometry(group.elements).requiredWidth <= pageWidth) continue;

    const suggestion =
      group.name === 'optional lot and date'
        ? 'Use a shorter lot number or remove one optional traceability field.'
        : 'Review the GTIN and quantity values.';

    throw Object.assign(
      new Error(
        `The ${group.name} barcode is too wide for a compliant ${labelSize} label. ${suggestion}`
      ),
      { code: 'BARCODE_TOO_WIDE' }
    );
  }
}

function generateLegacyLabelPDF(labelData, options = {}) {
  const elements = buildGs1Elements(labelData);
  const content = [];

  drawCenteredText(
    content,
    options.company_name || labelData.company_name || 'COMPANY NAME',
    PAGE_WIDTH / 2,
    405,
    15,
    true
  );
  drawLine(content, MARGIN, 382, PAGE_WIDTH - MARGIN, 382);

  drawInfoField(content, 'SSCC', labelData.sscc, MARGIN, 360, 13);
  drawInfoField(content, 'WEIGHT', `${labelData.weight_pounds} lb`, 210, 360, 11);
  drawInfoField(content, 'GTIN', labelData.gtin, MARGIN, 324, 11);
  drawInfoField(content, 'QTY', String(labelData.quantity), 160, 324, 11);
  drawInfoField(
    content,
    'PROD DATE',
    formatDisplayDate(labelData.production_date),
    MARGIN,
    288,
    11
  );
  drawInfoField(content, 'LOT', labelData.lot_number, 160, 288, 11);

  drawLine(content, MARGIN, 250, PAGE_WIDTH - MARGIN, 250);

  const itemElements = orderedElements(elements, ['01', '11', '10', '30']);
  const ssccElements = elements.filter((item) => item.ai === '00');

  drawBarcode(content, itemElements, 22, 168, 244, 42);
  drawCenteredTextInWidth(content, humanReadable(itemElements), 22, 244, 150, 7);

  drawBarcode(content, ssccElements, 42, 70, 204, 42);
  drawCenteredTextInWidth(content, humanReadable(ssccElements), 42, 204, 52, 8);

  return createPdf(content.join('\n'));
}

export async function generateMultipleLogisticLabels(labelDataArray, options = {}) {
  if (!Array.isArray(labelDataArray) || labelDataArray.length === 0) {
    throw new Error('No label data provided');
  }

  const pages = await Promise.all(
    labelDataArray.map((label) => generateLogisticLabelPDF(label, options))
  );
  return Buffer.concat(pages);
}

function drawBarcode(content, elements, x, y, width, height) {
  if (!elements.length) return;

  const modules = getBarcodeModules(elements);
  const totalModules = modules.reduce((sum, module) => sum + module.width, 0);
  const moduleWidth = width / totalModules;
  let cursor = x;

  for (const module of modules) {
    const barWidth = module.width * moduleWidth;
    if (module.black) {
      drawRect(content, cursor, y, Math.max(barWidth, 0.45), height);
    }
    cursor += barWidth;
  }
}

export function calculateBarcodeGeometry(elements) {
  const modules = getBarcodeModules(elements);
  const totalModules = modules.reduce((sum, module) => sum + module.width, 0);
  const symbolWidth = totalModules * TARGET_X_DIMENSION_POINTS;
  const quietZoneWidth = QUIET_ZONE_MODULES * TARGET_X_DIMENSION_POINTS;

  return {
    modules,
    totalModules,
    moduleWidthPoints: TARGET_X_DIMENSION_POINTS,
    moduleWidthMillimeters: TARGET_X_DIMENSION_MM,
    barHeightPoints: MINIMUM_BAR_HEIGHT_POINTS,
    barHeightMillimeters: MINIMUM_BAR_HEIGHT_MM,
    quietZoneModules: QUIET_ZONE_MODULES,
    quietZoneWidth,
    symbolWidth,
    requiredWidth: symbolWidth + quietZoneWidth * 2
  };
}

function drawCompliantBarcode(content, elements, y, pageWidth = PAGE_WIDTH) {
  if (!elements.length) return;

  const geometry = calculateBarcodeGeometry(elements);
  if (geometry.requiredWidth > pageWidth) {
    throw new Error('Barcode content is too wide for the selected label');
  }

  let cursor = (pageWidth - geometry.symbolWidth) / 2;
  for (const module of geometry.modules) {
    const width = module.width * geometry.moduleWidthPoints;
    if (module.black) {
      drawRect(content, cursor, y, width, geometry.barHeightPoints);
    }
    cursor += width;
  }
}

function orderedElements(elements, aiOrder) {
  return aiOrder.map((ai) => elements.find((item) => item.ai === ai)).filter(Boolean);
}

function drawText(content, text, x, y, size = 10, bold = false) {
  content.push(
    `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${escapePdf(String(text ?? ''))}) Tj ET`
  );
}

function drawInfoField(content, label, value, x, labelY, valueSize = 11) {
  drawText(content, label, x, labelY, 8);
  drawText(content, value, x, labelY - 16, valueSize, true);
}

function drawInfoFieldFitted(content, label, value, x, width, labelY) {
  const labelSize = fitTextSize(label, width, 7, 5);
  const valueText = String(value ?? '');
  const valueSize = fitTextSize(valueText, width, 10, 6);
  drawText(content, truncateTextToWidth(label, width, labelSize), x, labelY, labelSize);
  drawText(
    content,
    truncateTextToWidth(valueText, width, valueSize, true),
    x,
    labelY - 14,
    valueSize,
    true
  );
}

function drawLargeInfoField(content, label, value, x, width, labelY, valueY, preferredSize) {
  drawText(content, label, x, labelY, 8, true);
  const valueText = String(value ?? '');
  const valueSize = fitTextSize(valueText, width, preferredSize, 8);
  drawText(
    content,
    truncateTextToWidth(valueText, width, valueSize, true),
    x,
    valueY,
    valueSize,
    true
  );
}

function drawAddressBlock(content, label, value, x, width, labelY) {
  drawText(content, label, x, labelY, 8, true);
  const addressLines = getAddressLines(value, width, 4);
  addressLines.forEach((line, index) => {
    const isCompanyLine = index === 0;
    const size = isCompanyLine ? 10 : 8;
    drawText(content, line, x, labelY - 16 - index * 11, size, isCompanyLine);
  });
}

function getAddressLines(value, width, maxLines) {
  const segments = String(value ?? '')
    .split(/\r?\n|\s*,\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  const lines = [];

  for (const segment of segments) {
    const isCompanyLine = lines.length === 0;
    const size = isCompanyLine ? 10 : 8;
    const remaining = maxLines - lines.length;
    if (!remaining) break;
    lines.push(...wrapText(segment, width, size, isCompanyLine, remaining));
  }

  return lines.length ? lines.slice(0, maxLines) : ['-'];
}

function wrapText(text, width, size, bold, maxLines) {
  const normalized = text.trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  const lines = [];
  let truncated = false;

  for (const word of words) {
    const current = lines.at(-1) || '';
    const candidate = current ? `${current} ${word}` : word;
    if (estimateTextWidth(candidate, size, bold) <= width) {
      if (lines.length) lines[lines.length - 1] = candidate;
      else lines.push(candidate);
      continue;
    }

    if (lines.length < maxLines) {
      let fittedWord = word;
      while (fittedWord.length > 1 && estimateTextWidth(fittedWord, size, bold) > width) {
        fittedWord = fittedWord.slice(0, -1);
        truncated = true;
      }
      lines.push(fittedWord);
    } else {
      truncated = true;
      break;
    }
  }

  if (!lines.length) return ['-'];
  if (truncated || lines.join(' ').length < normalized.length) {
    const lastIndex = lines.length - 1;
    while (
      lines[lastIndex].length > 1 &&
      estimateTextWidth(`${lines[lastIndex]}...`, size, bold) > width
    ) {
      lines[lastIndex] = lines[lastIndex].slice(0, -1);
    }
    lines[lastIndex] = `${lines[lastIndex]}...`;
  }
  return lines;
}

function fitTextSize(text, width, preferredSize, minimumSize) {
  let size = preferredSize;
  while (size > minimumSize && estimateTextWidth(String(text ?? ''), size, true) > width) {
    size -= 0.5;
  }
  return size;
}

function truncateTextToWidth(text, width, size, bold = false) {
  let fitted = String(text ?? '');
  if (estimateTextWidth(fitted, size, bold) <= width) return fitted;

  while (fitted.length > 1 && estimateTextWidth(`${fitted}...`, size, bold) > width) {
    fitted = fitted.slice(0, -1);
  }
  return `${fitted}...`;
}

function drawCenteredInfoField(content, label, value, centerX, labelY, valueY, valueSize = 11) {
  const text = String(value ?? '');
  const valueX = centerX - estimateTextWidth(text, valueSize, true) / 2;
  drawText(content, label, valueX, labelY, 8);
  drawCenteredText(content, text, centerX, valueY, valueSize, true);
}

function drawCenteredText(content, text, centerX, y, size = 10, bold = false) {
  const value = String(text ?? '');
  const x = centerX - estimateTextWidth(value, size, bold) / 2;
  drawText(content, value, round(x), y, size, bold);
}

function drawCenteredTextInWidth(content, text, x, width, y, size = 10, bold = false) {
  drawCenteredText(content, text, x + width / 2, y, size, bold);
}

function estimateTextWidth(text, size, bold = false) {
  const averageGlyphWidth = bold ? 0.58 : 0.55;
  return text.length * size * averageGlyphWidth;
}

function drawLine(content, x1, y1, x2, y2, lineWidth = 0.8) {
  content.push(`${lineWidth} w ${x1} ${y1} m ${x2} ${y2} l S`);
}

function drawOutlineRect(content, x, y, width, height, lineWidth = 0.8) {
  content.push(`${lineWidth} w ${x} ${y} ${width} ${height} re S`);
}

function drawCutGuide(content, y, pageWidth) {
  content.push(`[4 4] 0 d 32 ${y} m ${pageWidth - MARGIN} ${y} l S [] 0 d`);
  drawCircleOutline(content, 10, y + 4, 3);
  drawCircleOutline(content, 10, y - 4, 3);
  drawLine(content, 13, y + 2, 26, y - 6);
  drawLine(content, 13, y - 2, 26, y + 6);
}

function drawCircleOutline(content, centerX, centerY, radius) {
  const control = radius * 0.5522848;
  content.push(
    `${round(centerX + radius)} ${round(centerY)} m ` +
      `${round(centerX + radius)} ${round(centerY + control)} ${round(centerX + control)} ${round(centerY + radius)} ${round(centerX)} ${round(centerY + radius)} c ` +
      `${round(centerX - control)} ${round(centerY + radius)} ${round(centerX - radius)} ${round(centerY + control)} ${round(centerX - radius)} ${round(centerY)} c ` +
      `${round(centerX - radius)} ${round(centerY - control)} ${round(centerX - control)} ${round(centerY - radius)} ${round(centerX)} ${round(centerY - radius)} c ` +
      `${round(centerX + control)} ${round(centerY - radius)} ${round(centerX + radius)} ${round(centerY - control)} ${round(centerX + radius)} ${round(centerY)} c S`
  );
}

function drawRect(content, x, y, width, height) {
  content.push(`${round(x)} ${round(y)} ${round(width)} ${round(height)} re f`);
}

function createPdf(pageContent, pageWidth = PAGE_WIDTH, pageHeight = PAGE_HEIGHT) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${Buffer.byteLength(pageContent, 'utf8')} >>\nstream\n${pageContent}\nendstream`
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}

function escapePdf(value) {
  return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

function round(value) {
  return Number(value)
    .toFixed(3)
    .replace(/\.?0+$/, '');
}

function formatDisplayDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { timeZone: 'UTC' });
}

export default {
  generateLogisticLabelPDF,
  generateMultipleLogisticLabels
};
