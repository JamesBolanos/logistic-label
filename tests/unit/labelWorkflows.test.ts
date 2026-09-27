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
      quantity: null,
      packaging_level: null
    });
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
      quantity: 12,
      weight_pounds: null,
      packaging_level: 'case'
    });
  });
});
