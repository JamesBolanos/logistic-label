import { describe, expect, it } from 'vitest';
import { generateLogisticLabelPDF } from '../../src/lib/server/pdf/labelGenerator.js';

describe('guided label PDF rendering', () => {
  it('renders homogeneous traceability fields and their GS1 human-readable data', async () => {
    const pdf = await generateLogisticLabelPDF(
      {
        label_type: 'homogeneous_unit',
        template_version: 'v2',
        print_layout: '4x6_single',
        sscc: '012345670000000015',
        gtin: '00012345600012',
        packaging_level: 'case',
        quantity: 12,
        lot_number: '123456',
        date_ai: '13',
        date_value: '2026-09-28'
      },
      { company_name: 'PDF Test Company' }
    );

    const content = pdf.toString('utf8');
    expect(content).toContain('PDF Test Company');
    expect(content).toContain('PACK DATE');
    expect(content).toContain('BATCH/LOT');
    expect(content).toContain('\\(13\\)260928\\(10\\)123456');
    expect(content).toContain('\\(02\\)00012345600012\\(37\\)12');
    expect(content).toContain('\\(00\\)012345670000000015');
    expect(content).not.toContain('HOMOGENEOUS LOGISTIC UNIT');
    expect(content).not.toContain('Contained trade item level');
  });
});
