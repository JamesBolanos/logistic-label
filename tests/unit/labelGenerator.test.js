import { describe, expect, it } from 'vitest';
import {
  generateLogisticLabelPDF,
  validateGuidedLabelBarcodeFit
} from '../../src/lib/server/pdf/labelGenerator.js';

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
    expect(content).toContain('BT /F1 7 Tf 18 386 Td (CONTENT) Tj ET');
    expect(content).toContain('BT /F2 10 Tf 18 372 Td (00012345600012) Tj ET');
    expect(content).toContain('BT /F1 7 Tf 222 386 Td (COUNT) Tj ET');
    expect(content).not.toContain('0.8 w 18 392 m 270 392 l S');
    expect(content).toContain('PACK DATE');
    expect(content).toContain('BATCH/LOT');
    expect(content).toContain('\\(13\\)260928\\(10\\)123456');
    expect(content).toContain('\\(02\\)00012345600012\\(37\\)12');
    expect(content).toContain('\\(00\\)012345670000000015');
    expect(content).not.toContain('HOMOGENEOUS LOGISTIC UNIT');
    expect(content).not.toContain('Contained trade item level');
  });

  it('fits a three-digit homogeneous count on a compliant four-inch label', async () => {
    const label = {
      label_type: 'homogeneous_unit',
      template_version: 'v2',
      print_layout: '4x6_single',
      sscc: '012345670000000015',
      gtin: '07433200838006',
      packaging_level: 'each',
      quantity: 120
    };

    expect(() => validateGuidedLabelBarcodeFit(label)).not.toThrow();

    const pdf = await generateLogisticLabelPDF(label, { company_name: 'PDF Test Company' });
    const content = pdf.toString('utf8');
    expect(content).toContain('\\(02\\)07433200838006\\(37\\)120');
    expect(content).toContain('0.8 w 18 392 m 270 392 l S');
  });
});
