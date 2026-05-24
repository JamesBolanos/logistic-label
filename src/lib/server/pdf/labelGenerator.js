import { buildGs1Elements, getBarcodeModules, humanReadable } from './gs1Barcode.js';

const PAGE_WIDTH = 288;
const PAGE_HEIGHT = 432;
const MARGIN = 18;

export async function generateLogisticLabelPDF(labelData, options = {}) {
  const elements = buildGs1Elements(labelData);
  const content = [];

  drawText(content, options.company_name || labelData.company_name || 'COMPANY NAME', MARGIN, 405, 15, true);
  drawLine(content, MARGIN, 382, PAGE_WIDTH - MARGIN, 382);

  drawText(content, 'GTIN:', MARGIN, 360, 10, true);
  drawText(content, labelData.gtin, 88, 360, 10);
  drawText(content, 'LOT:', MARGIN, 340, 10, true);
  drawText(content, labelData.lot_number, 88, 340, 10);
  drawText(content, 'PROD DATE:', MARGIN, 320, 10, true);
  drawText(content, formatDisplayDate(labelData.production_date), 88, 320, 10);

  drawText(content, 'QTY:', 160, 360, 10, true);
  drawText(content, String(labelData.quantity), 220, 360, 10);
  drawText(content, 'WEIGHT:', 160, 340, 10, true);
  drawText(content, `${labelData.weight_pounds} lb`, 220, 340, 10);
  drawText(content, 'SSCC:', 160, 320, 10, true);
  drawText(content, labelData.sscc, 195, 320, 8);

  drawLine(content, MARGIN, 295, PAGE_WIDTH - MARGIN, 295);

  drawBarcode(content, elements.filter((item) => item.ai === '00'), 42, 238, 204, 34);
  drawText(content, humanReadable(elements.filter((item) => item.ai === '00')), 50, 222, 8);

  drawBarcode(content, elements.filter((item) => ['01', '10', '11'].includes(item.ai)), 28, 155, 232, 36);
  drawText(content, humanReadable(elements.filter((item) => ['01', '10', '11'].includes(item.ai))), 28, 139, 7);

  drawBarcode(content, elements.filter((item) => ['30', '3201'].includes(item.ai)), 50, 72, 188, 36);
  drawText(content, humanReadable(elements.filter((item) => ['30', '3201'].includes(item.ai))), 62, 56, 8);

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

function drawText(content, text, x, y, size = 10, bold = false) {
  content.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${escapePdf(String(text ?? ''))}) Tj ET`);
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
