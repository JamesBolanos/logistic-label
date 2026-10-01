import { describe, expect, it } from 'vitest';
import {
  buildSuccessfulLabelVerification,
  parseLabelVerificationReport,
  serializeLabelVerificationReport
} from '../../src/lib/labels/verification.js';

describe('label verification summaries', () => {
  it('summarizes a transport label without exposing its SSCC or shipment data', () => {
    const report = buildSuccessfulLabelVerification(
      {
        label_type: 'sscc_only',
        template_version: 'v3',
        print_layout: '4x6_two_up',
        sscc: '012345670000000015',
        ship_to: 'Private Customer DC'
      },
      ['00']
    );

    expect(report).toMatchObject({
      labelType: 'Transport unit tracking',
      printLayout: '4 × 6 — two copies',
      symbology: 'GS1-128',
      applicationIdentifiers: ['00']
    });
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'sscc_check_digit', passed: true }),
        expect.objectContaining({ id: 'barcode_fit', passed: true }),
        expect.objectContaining({ id: 'sscc_position', passed: true })
      ])
    );

    const serialized = serializeLabelVerificationReport(report);
    expect(serialized).not.toContain('012345670000000015');
    expect(serialized).not.toContain('Private Customer DC');
    expect(parseLabelVerificationReport(serialized)).toEqual(report);
  });

  it('reports the required content/count association and optional traceability AIs', () => {
    const report = buildSuccessfulLabelVerification(
      {
        label_type: 'homogeneous_unit',
        template_version: 'v4',
        print_layout: '6x8_single',
        sscc: '012345670000000015',
        gtin: '00012345600012'
      },
      ['00', '02', '37', '13', '10']
    );

    expect(report).toMatchObject({
      labelType: 'Identical contents',
      printLayout: '6 × 8 — detailed contents',
      applicationIdentifiers: ['02', '37', '13', '10', '00']
    });
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'gtin_check_digit', passed: true }),
        expect.objectContaining({ id: 'content_count_association', passed: true }),
        expect.objectContaining({ id: 'sscc_position', passed: true })
      ])
    );
  });

  it('ignores malformed or unsupported serialized reports', () => {
    expect(parseLabelVerificationReport(null)).toBeNull();
    expect(parseLabelVerificationReport('not-json')).toBeNull();
    expect(
      parseLabelVerificationReport(encodeURIComponent(JSON.stringify({ version: 2 })))
    ).toBeNull();
  });
});
