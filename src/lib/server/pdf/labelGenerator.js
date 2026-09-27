import { buildGs1Elements, getBarcodeModules, humanReadable } from './gs1Barcode.js';
import { getPackagingLevelName, LABEL_TYPES } from '$lib/labels/workflows.js';

const PAGE_WIDTH = 288;
const PAGE_HEIGHT = 432;
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

  if (labelData.label_type === LABEL_TYPES.SSCC_ONLY) {
    drawSSCCOnlyLabel(content, labelData, elements);
  } else {
    drawHomogeneousLabel(content, labelData, elements);
  }

  return createPdf(content.join('\n'));
}

function drawSSCCOnlyLabel(content, labelData, elements) {
  drawCenteredText(content, 'SSCC-ONLY LOGISTIC LABEL', PAGE_WIDTH / 2, 366, 10, true);
  drawCenteredText(
    content,
    'Identifies this logistic unit; contents are not encoded',
    PAGE_WIDTH / 2,
    344,
    9
  );
  drawInfoField(content, 'SSCC', labelData.sscc, MARGIN, 304, 20);

  drawCompliantBarcode(content, elements, 86);
  drawCenteredText(content, humanReadable(elements), PAGE_WIDTH / 2, 68, 10);
}

function drawHomogeneousLabel(content, labelData, elements) {
  const contentElements = elements.filter((item) => item.ai !== '00');
  const ssccElements = elements.filter((item) => item.ai === '00');
  const packagingLevel = getPackagingLevelName(labelData.packaging_level, labelData.quantity);

  drawCenteredText(content, 'HOMOGENEOUS LOGISTIC UNIT', PAGE_WIDTH / 2, 374, 10, true);
  drawText(content, `Contained trade item level: ${packagingLevel}`, MARGIN, 354, 9);
  drawInfoField(content, 'CONTENT', labelData.gtin, MARGIN, 334, 17);
  drawInfoField(content, 'COUNT', String(labelData.quantity), 222, 334, 17);
  drawInfoField(content, 'SSCC', labelData.sscc, MARGIN, 287, 17);

  drawCompliantBarcode(content, contentElements, 160);
  drawCenteredText(content, humanReadable(contentElements), PAGE_WIDTH / 2, 143, 10);

  drawCompliantBarcode(content, ssccElements, 35);
  drawCenteredText(content, humanReadable(ssccElements), PAGE_WIDTH / 2, 18, 10);
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

function drawCompliantBarcode(content, elements, y) {
  if (!elements.length) return;

  const geometry = calculateBarcodeGeometry(elements);
  if (geometry.requiredWidth > PAGE_WIDTH) {
    throw new Error('Barcode content is too wide for the supported 4x6 label');
  }

  let cursor = (PAGE_WIDTH - geometry.symbolWidth) / 2;
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

function drawRect(content, x, y, width, height) {
  content.push(`${round(x)} ${round(y)} ${round(width)} ${round(height)} re f`);
}

function createPdf(pageContent) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
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
