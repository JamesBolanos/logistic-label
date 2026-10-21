import { getBarcodeModules } from './gs1Barcode.js';
import { generateLogisticLabelLayout } from '../labels/layout.js';
export { calculateBarcodeGeometry, validateGuidedLabelBarcodeFit } from '../labels/layout.js';

export async function generateLogisticLabelPDF(labelData, options = {}) {
  const layout = generateLogisticLabelLayout(labelData, options);
  const content = [];
  for (const item of layout.content) {
    switch (item.type) {
      case 'text':
        drawText(content, item.text, item.x, item.y, item.size, item.bold);
        break;
      case 'barcode': {
        const modules = getBarcodeModules(item.elements);
        const total = modules.reduce((sum, module) => sum + module.width, 0);
        const moduleWidth = item.compliant ? (0.495 / 25.4) * 72 : item.width / total;
        let cursor = item.x;
        for (const module of modules) {
          const width = module.width * moduleWidth;
          if (module.black)
            drawRect(
              content,
              cursor,
              item.y,
              item.compliant ? width : Math.max(width, 0.45),
              item.height
            );
          cursor += width;
        }
        break;
      }
      case 'line':
        drawLine(content, item.x1, item.y1, item.x2, item.y2, item.lineWidth);
        break;
      case 'outline':
        drawOutlineRect(content, item.x, item.y, item.width, item.height, item.lineWidth);
        break;
      case 'cutGuide':
        content.push(`[4 4] 0 d 32 ${item.y} m ${item.pageWidth - 18} ${item.y} l S [] 0 d`);
        break;
      case 'circle':
        drawCircleOutline(content, item.centerX, item.centerY, item.radius);
        break;
    }
  }
  return createPdf(content.join('\n'), layout.width, layout.height);
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

function drawText(content, text, x, y, size = 10, bold = false) {
  content.push(
    `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${escapePdf(String(text ?? ''))}) Tj ET`
  );
}

function drawLine(content, x1, y1, x2, y2, lineWidth = 0.8) {
  content.push(`${lineWidth} w ${x1} ${y1} m ${x2} ${y2} l S`);
}

function drawOutlineRect(content, x, y, width, height, lineWidth = 0.8) {
  content.push(`${lineWidth} w ${x} ${y} ${width} ${height} re S`);
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

function createPdf(pageContent, pageWidth, pageHeight) {
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

export default {
  generateLogisticLabelPDF,
  generateMultipleLogisticLabels
};
