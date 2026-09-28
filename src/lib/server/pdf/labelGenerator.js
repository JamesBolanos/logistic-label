import { buildGs1Elements, getBarcodeModules, humanReadable } from './gs1Barcode.js';
import {
  DEFAULT_PRINT_LAYOUT,
  getHomogeneousDateOption,
  LABEL_TYPES,
  PRINT_LAYOUTS
} from '$lib/labels/workflows.js';

const PAGE_WIDTH = 288;
const PAGE_HEIGHT = 432;
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
    labelData.template_version === 'v2' &&
    (labelData.label_type === LABEL_TYPES.SSCC_ONLY ||
      labelData.label_type === LABEL_TYPES.HOMOGENEOUS_UNIT)
  ) {
    return generateGuidedLabelPDF(labelData, options);
  }

  return generateLegacyLabelPDF(labelData, options);
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
  drawLine(content, MARGIN, 392, PAGE_WIDTH - MARGIN, 392);

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
  const traceabilityElements = elements.filter(
    (item) => item.ai === '10' || getHomogeneousDateOption(item.ai)
  );
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

  drawInfoField(content, 'CONTENT', labelData.gtin, MARGIN, 386, 14);
  drawInfoField(content, 'COUNT', String(labelData.quantity), 222, 386, 14);
  drawHomogeneousTraceabilityFields(content, labelData);

  drawCompliantBarcode(content, contentElements, 246);
  drawCenteredText(content, humanReadable(contentElements), PAGE_WIDTH / 2, 231, 9);

  drawCompliantBarcode(content, traceabilityElements, 134);
  drawCenteredText(content, humanReadable(traceabilityElements), PAGE_WIDTH / 2, 119, 9);

  drawCompliantBarcode(content, ssccElements, 22);
  drawCenteredText(content, humanReadable(ssccElements), PAGE_WIDTH / 2, 7, 9);
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
    if (calculateBarcodeGeometry(group.elements).requiredWidth <= PAGE_WIDTH) continue;

    const suggestion =
      group.name === 'optional lot and date'
        ? 'Use a shorter lot number or remove one optional traceability field.'
        : 'Review the GTIN and quantity values.';

    throw Object.assign(
      new Error(`The ${group.name} barcode is too wide for a compliant 4 × 6 label. ${suggestion}`),
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
  drawText(content, label, x, labelY, fitTextSize(label, width, 7, 5));
  drawText(content, value, x, labelY - 14, fitTextSize(String(value ?? ''), width, 10, 6), true);
}

function fitTextSize(text, width, preferredSize, minimumSize) {
  let size = preferredSize;
  while (size > minimumSize && estimateTextWidth(String(text ?? ''), size, true) > width) {
    size -= 0.5;
  }
  return size;
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

function drawLine(content, x1, y1, x2, y2) {
  content.push(`0.8 w ${x1} ${y1} m ${x2} ${y2} l S`);
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
