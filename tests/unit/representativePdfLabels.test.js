import { describe, expect, it } from 'vitest';
import samples from '../../representative_pdf_labels.json';
import {
  generateLogisticLabelPDF,
  generateMultipleLogisticLabels
} from '../../src/lib/server/pdf/labelGenerator.js';

describe('representative PDF label rendering', () => {
  for (const sample of samples) {
    it(`renders label ${sample.id} (${sample.label_type}, ${sample.template_version}, ${sample.print_layout})`, async () => {
      const pdf = await generateLogisticLabelPDF(sample, {
        company_name: sample.company_name
      });
      const content = pdf.toString('utf8');

      expect(pdf instanceof Uint8Array).toBe(true);
      expect(pdf.length).toBeGreaterThan(100);
      expect(content.startsWith('%PDF')).toBe(true);
      expect(content).toContain(sample.sscc);

      if (sample.gtin) {
        expect(content).toContain(sample.gtin);
      }

      if (sample.print_layout === '4x6_single') {
        expect(content).toContain('/MediaBox [0 0 288 432]');
      } else if (sample.print_layout === '6x8_single') {
        expect(content).toContain('/MediaBox [0 0 432 576]');
      } else if (sample.print_layout === '4x3_single') {
        expect(content).toContain('/MediaBox [0 0 288 216]');
      }
    });
  }

  it('renders every representative label in one combined PDF buffer', async () => {
    const pdf = await generateMultipleLogisticLabels(samples, {
      company_name: 'Representative Labels'
    });

    expect(pdf instanceof Uint8Array).toBe(true);
    expect(pdf.length).toBeGreaterThan(samples.length * 100);

    const content = pdf.toString('utf8');
    for (const sample of samples) {
      expect(content).toContain(sample.sscc);
    }
  });
});
