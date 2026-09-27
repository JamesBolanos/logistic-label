import { describe, expect, it } from 'vitest';
import {
  buildGs1Elements,
  encodeGs1Data,
  getBarcodeModules,
  humanReadable
} from '../../src/lib/server/pdf/gs1Barcode.js';

describe('guided GS1-128 barcode data', () => {
  it('encodes only AI (00) for an SSCC-only label', () => {
    const elements = buildGs1Elements({
      label_type: 'sscc_only',
      sscc: '012345670000000015'
    });

    expect(elements).toEqual([{ ai: '00', value: '012345670000000015' }]);
    expect(humanReadable(elements)).toBe('(00)012345670000000015');
  });

  it('uses the required AI (02) and AI (37) pair for homogeneous contents', () => {
    const elements = buildGs1Elements({
      label_type: 'homogeneous_unit',
      sscc: '012345670000000015',
      gtin: '00012345600012',
      quantity: 12
    });

    expect(elements).toEqual([
      { ai: '00', value: '012345670000000015' },
      { ai: '02', value: '00012345600012' },
      { ai: '37', value: '12' }
    ]);
    expect(encodeGs1Data(elements.slice(1))).toEqual([
      { type: 'data', value: '0200012345600012' },
      { type: 'data', value: '3712' }
    ]);
    expect(getBarcodeModules(elements.slice(1))).not.toHaveLength(0);
  });
});
