import { buildGs1Elements, getBarcodeModules, humanReadable } from './gs1Barcode.js';

const PAGE_WIDTH = 288;
const PAGE_HEIGHT = 432;
const MARGIN = 18;

export async function generateLogisticLabelPDF(labelData, options = {}) {
  const elements = buildGs1Elements(labelData);
  const content = [];

  drawCenteredText(content, options.company_name || labelData.company_name || 'COMPANY NAME', PAGE_WIDTH / 2, 405, 15, true);
  drawLine(content, MARGIN, 382, PAGE_WIDTH - MARGIN, 382);

  drawInfoField(content, 'SSCC', labelData.sscc, MARGIN, 360, 13);
  drawInfoField(content, 'WEIGHT', `${labelData.weight_pounds} lb`, 210, 360, 11);
  drawInfoField(content, 'GTIN', labelData.gtin, MARGIN, 324, 11);
  drawInfoField(content, 'QTY', String(labelData.quantity), 160, 324, 11);
  drawInfoField(content, 'PROD DATE', formatDisplayDate(labelData.production_date), MARGIN, 288, 11);
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

  const pages = await Promise.all(labelDataArray.map((label) => generateLogisticLabelPDF(label, options)));
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

function orderedElements(elements, aiOrder) {
  return aiOrder.map((ai) => elements.find((item) => item.ai === ai)).filter(Boolean);
}

function drawText(content, text, x, y, size = 10, bold = false) {
  content.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${escapePdf(String(text ?? ''))}) Tj ET`);
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
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}

function escapePdf(value) {
  return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

function round(value) {
  return Number(value).toFixed(3).replace(/\.?0+$/, '');
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
