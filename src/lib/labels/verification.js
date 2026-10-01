import { getLabelTypeName, getPrintLayoutName, LABEL_TYPES } from '$lib/labels/workflows.js';
import { validateGTIN, validateSSCC } from '$lib/utils/gs1Utils.js';

export const LABEL_VERIFICATION_HEADER = 'X-Label-Verification';

const DISPLAY_AI_ORDER = ['02', '37', '11', '13', '15', '16', '17', '10', '00'];

/**
 * @typedef {{ id: string, label: string, passed: boolean }} LabelVerificationCheck
 * @typedef {{
 *   version: 1,
 *   labelType: string,
 *   printLayout: string,
 *   symbology: 'GS1-128',
 *   applicationIdentifiers: string[],
 *   checks: LabelVerificationCheck[],
 *   warnings: string[]
 * }} LabelVerificationReport
 */

/**
 * Build the controlled summary shown after the server has successfully generated
 * the PDF. It deliberately contains no SSCC, GTIN, address, lot, or shipment data.
 *
 * @param {Record<string, unknown>} labelData
 * @param {string[]} applicationIdentifiers
 * @returns {LabelVerificationReport}
 */
export function buildSuccessfulLabelVerification(labelData, applicationIdentifiers) {
  const aiSet = new Set(applicationIdentifiers);
  const isHomogeneous = labelData.label_type === LABEL_TYPES.HOMOGENEOUS_UNIT;
  const orderedAis = DISPLAY_AI_ORDER.filter((ai) => aiSet.has(ai));

  /** @type {LabelVerificationCheck[]} */
  const checks = [
    {
      id: 'sscc_check_digit',
      label: 'SSCC check digit is valid',
      passed: validateSSCC(String(labelData.sscc ?? ''))
    }
  ];

  if (isHomogeneous) {
    checks.push(
      {
        id: 'gtin_check_digit',
        label: 'Contained GTIN check digit is valid',
        passed: validateGTIN(String(labelData.gtin ?? ''))
      },
      {
        id: 'content_count_association',
        label: 'AI (02) content is paired with AI (37) count',
        passed: aiSet.has('02') && aiSet.has('37')
      }
    );
  }

  checks.push(
    {
      id: 'barcode_fit',
      label: 'Barcode content fits the selected layout',
      // This report is built only after PDF generation completes its fit check.
      passed: true
    },
    {
      id: 'sscc_position',
      label: isHomogeneous ? 'SSCC is encoded in the lowest barcode' : 'SSCC is encoded as AI (00)',
      passed: aiSet.has('00')
    }
  );

  return {
    version: 1,
    labelType: getLabelTypeName(labelData.label_type),
    printLayout: getPrintLayoutName(
      labelData.print_layout,
      labelData.label_type,
      labelData.template_version
    ),
    symbology: 'GS1-128',
    applicationIdentifiers: orderedAis,
    checks,
    warnings: [
      'Print at 100% scale so barcode dimensions and quiet zones are preserved.',
      'Test a physical print with the intended printer, media, and scanner before operational use.'
    ]
  };
}

/** @param {LabelVerificationReport} report */
export function serializeLabelVerificationReport(report) {
  return encodeURIComponent(JSON.stringify(report));
}

/**
 * @param {string | null} value
 * @returns {LabelVerificationReport | null}
 */
export function parseLabelVerificationReport(value) {
  if (!value) return null;

  try {
    const report = JSON.parse(decodeURIComponent(value));
    if (
      report?.version !== 1 ||
      typeof report.labelType !== 'string' ||
      typeof report.printLayout !== 'string' ||
      report.symbology !== 'GS1-128' ||
      !Array.isArray(report.applicationIdentifiers) ||
      !Array.isArray(report.checks) ||
      !Array.isArray(report.warnings)
    ) {
      return null;
    }

    return report;
  } catch {
    return null;
  }
}
