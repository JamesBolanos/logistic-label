import { describe, expect, it } from 'vitest';
import { labelSettingsSchema } from '../../src/lib/validation/schemas.js';

type ParseResult = ReturnType<typeof labelSettingsSchema.safeParse>;

/** Collect the first error message per field for compact assertions. */
function fieldErrors(result: ParseResult): Record<string, string> {
  const errors: Record<string, string> = {};
  if (result.success) return errors;

  for (const issue of result.error.issues) {
    const field = issue.path.join('.');
    if (!(field in errors)) errors[field] = issue.message;
  }

  return errors;
}

const validSettings = {
  company_name: 'Acme Logistics',
  gs1_company_prefix: '1234567',
  extension_digit: '3',
  next_serial_reference: 1
};

describe('labelSettingsSchema', () => {
  it('accepts valid settings', () => {
    const result = labelSettingsSchema.safeParse(validSettings);

    expect(result.success).toBe(true);
    expect(result.success ? result.data : null).toMatchObject(validSettings);
  });

  it('accepts company prefixes between 4 and 12 digits', () => {
    for (const prefix of ['1234', '123456789012']) {
      expect(
        labelSettingsSchema.safeParse({ ...validSettings, gs1_company_prefix: prefix }).success
      ).toBe(true);
    }
  });

  it('rejects a missing or too-short company prefix', () => {
    expect(
      fieldErrors(labelSettingsSchema.safeParse({ ...validSettings, gs1_company_prefix: '' }))
    ).toEqual({ gs1_company_prefix: 'GS1 Company Prefix is required' });

    expect(
      fieldErrors(labelSettingsSchema.safeParse({ ...validSettings, gs1_company_prefix: '123' }))
    ).toEqual({ gs1_company_prefix: 'GS1 Company Prefix must be 4 to 12 digits' });
  });

  it('rejects a company prefix with non-digit characters', () => {
    const errors = fieldErrors(
      labelSettingsSchema.safeParse({ ...validSettings, gs1_company_prefix: '12345a' })
    );

    expect(errors.gs1_company_prefix).toBe('GS1 Company Prefix must contain only digits');
  });

  it('rejects an extension digit that is not a single digit', () => {
    const errors = fieldErrors(
      labelSettingsSchema.safeParse({ ...validSettings, extension_digit: '12' })
    );

    expect(errors.extension_digit).toBe('Extension digit must be a single digit');
  });

  it('coerces the serial reference from form strings', () => {
    const result = labelSettingsSchema.safeParse({
      ...validSettings,
      next_serial_reference: '42'
    });

    expect(result.success ? result.data.next_serial_reference : null).toBe(42);
  });

  it('rejects a serial reference beyond the prefix capacity', () => {
    const errors = fieldErrors(
      labelSettingsSchema.safeParse({
        ...validSettings,
        gs1_company_prefix: '123456789012',
        next_serial_reference: 10000
      })
    );

    expect(errors.next_serial_reference).toBe(
      'Next serial reference must be 9999 or lower for this prefix length'
    );
  });

  it('allows the largest serial reference the prefix can address', () => {
    const result = labelSettingsSchema.safeParse({
      ...validSettings,
      gs1_company_prefix: '123456789012',
      next_serial_reference: 9999
    });

    expect(result.success).toBe(true);
  });

  it('rejects a non-numeric serial reference', () => {
    const errors = fieldErrors(
      labelSettingsSchema.safeParse({ ...validSettings, next_serial_reference: 'abc' })
    );

    expect(errors.next_serial_reference).toBe('Next serial reference must be a number');
  });
});
