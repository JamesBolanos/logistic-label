import { describe, expect, it } from 'vitest';
import {
  calculateCheckDigit,
  generateSSCC,
  validateGS1CompanyPrefix,
  validateSSCC
} from '../../src/lib/utils/gs1Utils.js';

describe('GS1 identifiers', () => {
  it('calculates the published GS1 check-digit example', () => {
    expect(calculateCheckDigit('950110153000')).toBe(3);
  });

  it('generates an 18-digit SSCC with a valid check digit', () => {
    const sscc = generateSSCC({
      gs1CompanyPrefix: '1234567',
      serialReference: 42,
      extensionDigit: '3'
    });

    expect(sscc).toHaveLength(18);
    expect(sscc.startsWith('31234567')).toBe(true);
    expect(validateSSCC(sscc)).toBe(true);
  });

  it('rejects company prefixes outside the supported GS1 length', () => {
    expect(validateGS1CompanyPrefix('123')).toBe(false);
    expect(validateGS1CompanyPrefix('1234567890123')).toBe(false);
  });

  it('rejects an SSCC whose check digit was changed', () => {
    const valid = generateSSCC({ gs1CompanyPrefix: '1234567', serialReference: 42 });
    const invalidCheckDigit = valid.endsWith('9') ? '8' : '9';

    expect(validateSSCC(`${valid.slice(0, -1)}${invalidCheckDigit}`)).toBe(false);
  });
});
