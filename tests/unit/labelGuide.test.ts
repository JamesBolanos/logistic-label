import { describe, expect, it } from 'vitest';
import { getSupportedLabelGuide, SUPPORTED_LABEL_GUIDES } from '../../src/lib/labels/guide.js';
import { LABEL_TYPES } from '../../src/lib/labels/workflows.js';

describe('public supported-label guide', () => {
  it('documents each available workflow exactly once', () => {
    expect(SUPPORTED_LABEL_GUIDES.map((guide) => guide.labelType)).toEqual([
      LABEL_TYPES.SSCC_ONLY,
      LABEL_TYPES.HOMOGENEOUS_UNIT
    ]);
    expect(new Set(SUPPORTED_LABEL_GUIDES.map((guide) => guide.id)).size).toBe(2);
  });

  it('links directly to the matching generator workflow', () => {
    expect(getSupportedLabelGuide(LABEL_TYPES.SSCC_ONLY)).toMatchObject({
      generatorHref: '/labels?type=sscc_only',
      barcodeSummary: ['(00) SSCC-18']
    });
    expect(getSupportedLabelGuide(LABEL_TYPES.HOMOGENEOUS_UNIT)).toMatchObject({
      generatorHref: '/labels?type=homogeneous_unit',
      barcodeSummary: expect.arrayContaining(['(02) CONTENT + (37) COUNT'])
    });
  });

  it('does not invent guidance for unsupported workflow values', () => {
    expect(getSupportedLabelGuide('mixed')).toBeNull();
  });
});
