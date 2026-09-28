import { describe, expect, it } from 'vitest';
import { sanitizeLabelForm, validateLabelForm } from '../../src/lib/validation/formValidation.js';

describe('guided label workflows', () => {
  it('accepts an SSCC-only label without product-content fields', () => {
    const input = {
      label_type: 'sscc_only',
      gtin: 'invalid content that must be ignored',
      quantity: -1
    };

    expect(validateLabelForm(input)).toEqual({ isValid: true, errors: {} });
    expect(sanitizeLabelForm(input)).toMatchObject({
      label_type: 'sscc_only',
      template_version: 'v2',
      gtin: null,
      date_ai: null,
      date_value: null,
      quantity: null,
      packaging_level: null,
      print_layout: '4x6_single'
    });
  });

  it('preserves a supported two-copy SSCC print layout', () => {
    const input = {
      label_type: 'sscc_only',
      print_layout: '4x6_two_up'
    };

    expect(validateLabelForm(input)).toEqual({ isValid: true, errors: {} });
    expect(sanitizeLabelForm(input)).toMatchObject({ print_layout: '4x6_two_up' });
  });

  it('rejects a 3 by 3 layout that cannot fit the compliant SSCC barcode', () => {
    const result = validateLabelForm({
      label_type: 'sscc_only',
      print_layout: '3x3_single'
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveProperty('print_layout');
  });

  it('requires explicit homogeneous-content semantics', () => {
    const result = validateLabelForm({
      label_type: 'homogeneous_unit',
      gtin: '9501101530003',
      packaging_level: 'case',
      quantity: 12,
      contents_are_homogeneous: false
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveProperty('contents_are_homogeneous');
  });

  it('normalizes a valid homogeneous label for AI encoding', () => {
    const input = {
      label_type: 'homogeneous_unit',
      gtin: '9501101530003',
      packaging_level: 'case',
      quantity: 12,
      contents_are_homogeneous: true
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
      print_layout: '4x6_single'
    });
  });

  it('accepts optional lot and packaging date traceability', () => {
    const input = {
      label_type: 'homogeneous_unit',
      gtin: '9501101530003',
      packaging_level: 'case',
      quantity: 12,
      lot_number: 'LOT-26/09',
      date_ai: '13',
      date_value: '2026-09-28',
      contents_are_homogeneous: true
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
      quantity: 12,
      contents_are_homogeneous: true
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
