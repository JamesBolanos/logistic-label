import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateLogisticLabelPDF } from '../src/lib/server/pdf/labelGenerator.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const samples = JSON.parse(
  readFileSync(resolve(root, 'representative_pdf_labels.json'), 'utf8')
);
const outputDir = resolve(root, '.output', 'representative-pdfs');

mkdirSync(outputDir, { recursive: true });

for (const sample of samples) {
  const pdf = await generateLogisticLabelPDF(sample, {
    company_name: sample.company_name
  });
  const fileName = `label-${sample.id}-${sample.label_type}-${sample.template_version}-${sample.print_layout}.pdf`;
  const filePath = resolve(outputDir, fileName);
  writeFileSync(filePath, pdf);
  console.log(`Wrote ${filePath} (${pdf.length} bytes)`);
}

console.log(`Rendered ${samples.length} representative labels to ${outputDir}`);