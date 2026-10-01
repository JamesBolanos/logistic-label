import { describe, expect, it } from 'vitest';
import {
  generateLogisticLabelPDF,
  validateGuidedLabelBarcodeFit
} from '../../src/lib/server/pdf/labelGenerator.js';

describe('guided label PDF rendering', () => {
  it('renders human-readable transport fields above one SSCC barcode', async () => {
    const pdf = await generateLogisticLabelPDF({
      label_type: 'sscc_only',
      template_version: 'v3',
      print_layout: '4x6_single',
      sscc: '012345670000000015',
      ship_from: 'Test Shipper\n10 Origin Road',
      ship_to: 'Customer DC\n20 Destination Road',
      purchase_order: 'PO-100',
      carrier: 'Example Freight',
      gross_weight: 540.5,
      gross_weight_unit: 'kg',
      transport_count: 12,
      transport_count_type: 'cartons'
    });

    const content = pdf.toString('utf8');
    expect(content).toContain('SHIP FROM');
    expect(content).toContain('SHIP TO');
    expect(content).toContain('Test Shipper');
    expect(content).toContain('10 Origin Road');
    expect(content).toContain('PO-100');
    expect(content).toContain('Example Freight');
    expect(content).toContain('540.5 kg');
    expect(content).toContain('12 Cartons');
    expect(content).toContain('1.2 w 12 18 264 402 re S');
    expect(content).toContain('2.2 w 12 332 m 276 332 l S');
    expect(content.split('\\(00\\)')).toHaveLength(2);
    expect(content).not.toContain('\\(02\\)');
  });

  it('keeps previously saved v2 SSCC labels on the simple renderer', async () => {
    const pdf = await generateLogisticLabelPDF(
      {
        label_type: 'sscc_only',
        template_version: 'v2',
        print_layout: '4x6_single',
        sscc: '012345670000000015'
      },
      { company_name: 'PDF Test Company' }
    );

    const content = pdf.toString('utf8');
    expect(content).toContain('PDF Test Company');
    expect(content).toContain('SSCC');
    expect(content).not.toContain('SHIP TO');
  });

  it('keeps previously saved v2 homogeneous labels on their original renderer', async () => {
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

  it('renders a structured basic identical-contents label on 4 by 6', async () => {
    const pdf = await generateLogisticLabelPDF({
      label_type: 'homogeneous_unit',
      template_version: 'v4',
      print_layout: '4x6_single',
      sscc: '012345670000000015',
      gtin: '00012345600012',
      packaging_level: 'case',
      quantity: 12,
      ship_from: 'Test Shipper\n10 Origin Road',
      ship_to: 'Customer DC\n20 Destination Road',
      purchase_order: 'PO-200',
      carrier: 'Example Freight',
      gross_weight: 500.5,
      gross_weight_unit: 'kg'
    });

    const content = pdf.toString('utf8');
    expect(content).toContain('/MediaBox [0 0 288 432]');
    expect(content).toContain('SHIP FROM');
    expect(content).toContain('SHIP TO');
    expect(content).toContain('PO-200');
    expect(content).toContain('Example Freight');
    expect(content).toContain('500.5 kg');
    expect(content).toContain('12 Cases');
    expect(content).toContain('\\(02\\)00012345600012\\(37\\)12');
    expect(content).toContain('\\(00\\)012345670000000015');
    expect(content).not.toContain('BATCH/LOT');
  });

  it('uses 6 by 8 for structured lot and date traceability', async () => {
    const pdf = await generateLogisticLabelPDF({
      label_type: 'homogeneous_unit',
      template_version: 'v4',
      print_layout: '6x8_single',
      sscc: '012345670000000015',
      gtin: '00012345600012',
      packaging_level: 'case',
      quantity: 12,
      ship_from: 'Test Shipper\n10 Origin Road',
      ship_to: 'Customer DC\n20 Destination Road',
      purchase_order: 'PO-200',
      carrier: 'Example Freight',
      gross_weight: 500.5,
      gross_weight_unit: 'kg',
      lot_number: 'LOT-26/09',
      date_ai: '13',
      date_value: '2026-09-28'
    });

    const content = pdf.toString('utf8');
    expect(content).toContain('/MediaBox [0 0 432 576]');
    expect(content).toContain('CONTENT AND COUNT');
    expect(content).toContain('LOT AND DATE TRACEABILITY');
    expect(content).toContain('PACK DATE');
    expect(content).toContain('LOT-26/09');
    expect(content).toContain('\\(13\\)260928\\(10\\)LOT-26/09');
    expect(content.indexOf('\\(00\\)012345670000000015')).toBeGreaterThan(
      content.indexOf('\\(13\\)260928\\(10\\)LOT-26/09')
    );
  });

  it.each(['4x6_single', '6x8_single'])(
    'prints an individual-item count without truncation on %s',
    async (printLayout) => {
      const pdf = await generateLogisticLabelPDF({
        label_type: 'homogeneous_unit',
        template_version: 'v4',
        print_layout: printLayout,
        sscc: '012345670000000015',
        gtin: '07433200838006',
        packaging_level: 'each',
        quantity: 120,
        ship_from: 'Test Shipper',
        ship_to: 'Customer DC'
      });

      const content = pdf.toString('utf8');
      expect(content).toContain('(120 Each)');
      expect(content).not.toContain('Individu...');
    }
  );
});
