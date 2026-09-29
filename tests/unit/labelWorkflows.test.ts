import { describe, expect, it } from 'vitest';
import { sanitizeLabelForm, validateLabelForm } from '../../src/lib/validation/formValidation.js';

describe('guided label workflows', () => {
  it('accepts a transport label and ignores product-content fields', () => {
    const input = {
      label_type: 'sscc_only',
      ship_from: ' Test Shipper   10 Origin Road ',
      ship_to: 'Customer DC 20 Destination Road',
      purchase_order: 'PO-100',
      carrier: 'Example Freight',
      gross_weight: '540.5',
      gross_weight_unit: 'kg',
      transport_count: '12',
      transport_count_type: 'cartons',
      gtin: 'invalid content that must be ignored',
      quantity: -1
    };

    expect(validateLabelForm(input)).toEqual({ isValid: true, errors: {} });
    expect(sanitizeLabelForm(input)).toMatchObject({
      label_type: 'sscc_only',
      template_version: 'v3',
      gtin: null,
      date_ai: null,
      date_value: null,
      quantity: null,
      packaging_level: null,
      print_layout: '4x6_single',
      ship_from: 'Test Shipper 10 Origin Road',
      ship_to: 'Customer DC 20 Destination Road',
      purchase_order: 'PO-100',
      carrier: 'Example Freight',
      gross_weight: 540.5,
      gross_weight_unit: 'kg',
      transport_count: 12,
      transport_count_type: 'cartons'
    });
  });

  it('preserves a supported two-copy SSCC print layout', () => {
    const input = {
      label_type: 'sscc_only',
      print_layout: '4x6_two_up',
      ship_from: 'Test Shipper',
      ship_to: 'Customer DC'
    };

    expect(validateLabelForm(input)).toEqual({ isValid: true, errors: {} });
    expect(sanitizeLabelForm(input)).toMatchObject({ print_layout: '4x6_two_up' });
  });

  it('rejects a 3 by 3 layout that cannot fit the compliant SSCC barcode', () => {
    const result = validateLabelForm({
      label_type: 'sscc_only',
      print_layout: '3x3_single',
      ship_from: 'Test Shipper',
      ship_to: 'Customer DC'
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveProperty('print_layout');
  });

  it('normalizes a valid homogeneous label for AI encoding', () => {
    const input = {
      label_type: 'homogeneous_unit',
      gtin: '9501101530003',
      packaging_level: 'case',
      quantity: 12
    };

    expect(validateLabelForm(input)).toEqual({ isValid: true, errors: {} });
    expect(sanitizeLabelForm(input)).toEqual({
      label_type: 'homogeneous_unit',
      template_version: 'v2',
      gtin: '09501101530003',
      lot_number: null,
      production_date: null,
      date_ai: null,
      date_value: null,
      quantity: 12,
      weight_pounds: null,
      packaging_level: 'case',
      print_layout: '4x6_single',
      ship_from: null,
      ship_to: null,
      purchase_order: null,
      carrier: null,
      gross_weight: null,
      gross_weight_unit: null,
      transport_count: null,
      transport_count_type: null
    });
  });

  it('requires transport endpoints and validates paired measures', () => {
    const base = {
      label_type: 'sscc_only',
      ship_from: 'Test Shipper',
      ship_to: 'Customer DC'
    };

    expect(validateLabelForm({ label_type: 'sscc_only' }).errors).toMatchObject({
      ship_from: expect.any(String),
      ship_to: expect.any(String)
    });
    expect(validateLabelForm({ ...base, gross_weight: 100 }).errors).toHaveProperty(
      'gross_weight_unit'
    );
    expect(
      validateLabelForm({ ...base, transport_count: 12, transport_count_type: 'unknown' }).errors
    ).toHaveProperty('transport_count_type');
  });

  it('accepts optional lot and packaging date traceability', () => {
    const input = {
      label_type: 'homogeneous_unit',
      gtin: '9501101530003',
      packaging_level: 'case',
      quantity: 12,
      lot_number: 'LOT-26/09',
      date_ai: '13',
      date_value: '2026-09-28'
    };

    expect(validateLabelForm(input)).toEqual({ isValid: true, errors: {} });
    expect(sanitizeLabelForm(input)).toMatchObject({
      lot_number: 'LOT-26/09',
      date_ai: '13',
      date_value: '2026-09-28'
    });
  });

  it('requires the optional date type and value to be supplied together', () => {
    const base = {
      label_type: 'homogeneous_unit',
      gtin: '9501101530003',
      packaging_level: 'case',
      quantity: 12
    };

    expect(validateLabelForm({ ...base, date_ai: '17' }).errors).toHaveProperty('date_value');
    expect(validateLabelForm({ ...base, date_value: '2026-09-28' }).errors).toHaveProperty(
      'date_ai'
    );
    expect(
      validateLabelForm({ ...base, date_ai: '17', date_value: '2026-02-30' }).errors
    ).toHaveProperty('date_value');
  });
});
