// src/routes/api/pdf/preview/+server.js
import { json } from '@sveltejs/kit';
import { generateLogisticLabelPDF } from '$lib/server/pdf/labelGenerator';
import { validateLabelForm, sanitizeLabelForm } from '$lib/server/validation/formValidation';
import { getLabelSettings } from '$lib/server/db/settings';
import { generateSSCC } from '$lib/utils/gs1Utils';
import { getLabelSizeForPrintLayout } from '$lib/labels/workflows.js';
import {
  buildSuccessfulLabelVerification,
  LABEL_VERIFICATION_HEADER,
  serializeLabelVerificationReport
} from '$lib/labels/verification.js';
import { buildGs1Elements } from '$lib/server/pdf/gs1Barcode.js';
import { pdfRateLimiter } from '$lib/server/auth/ratelimit';
import {
  durationSince,
  getOperationId,
  recordOperationalEvent
} from '$lib/server/analytics/operationalEvents.js';

export async function POST({ request, locals }) {
  const startedAt = Date.now();
  const operationId = getOperationId(request);

  // Apply rate limiting
  const rateLimitResponse = pdfRateLimiter(request);
  if (rateLimitResponse) {
    if (locals.user) {
      await recordOperationalEvent({
        eventName: 'workflow_failed',
        userId: locals.user.id,
        operationId,
        workflowStep: 'label_preview',
        errorCategory: 'rate_limited',
        durationMs: durationSince(startedAt)
      });
    }
    return rateLimitResponse;
  }

  const user = locals.user;
  if (!user) {
    return json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  try {
    // Parse label data from request
    const labelData = await request.json();

    // Validate form data
    const validation = validateLabelForm(labelData);
    if (!validation.isValid) {
      await recordOperationalEvent({
        eventName: 'workflow_failed',
        userId: user.id,
        operationId,
        workflowStep: 'label_preview',
        errorCategory: 'validation',
        durationMs: durationSince(startedAt)
      });

      return json(
        {
          success: false,
          message: 'Invalid label data',
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    // Sanitize form data
    const sanitizedData = sanitizeLabelForm(labelData);

    const settings = await getLabelSettings(user.id);

    if (!settings.is_configured) {
      await recordOperationalEvent({
        eventName: 'workflow_failed',
        userId: user.id,
        operationId,
        workflowStep: 'label_preview',
        errorCategory: 'settings_required',
        durationMs: durationSince(startedAt)
      });

      return json(
        {
          success: false,
          message: 'Configure your GS1 Company Prefix in Settings before previewing labels.'
        },
        { status: 400 }
      );
    }

    const sscc = generateSSCC({
      gs1CompanyPrefix: settings.gs1_company_prefix,
      extensionDigit: settings.extension_digit,
      serialReference: settings.next_serial_reference
    });

    // Prepare complete label data for preview
    const previewLabelData = {
      ...sanitizedData,
      id: 'preview',
      sscc,
      created_at: new Date().toISOString()
    };

    // Generate PDF
    const pdfBuffer = await generateLogisticLabelPDF(previewLabelData, {
      company_name: settings.company_name
    });

    // Send only controlled verification metadata. Label contents stay in the PDF
    // and are never copied into response headers or product analytics.
    const verification = buildSuccessfulLabelVerification(
      previewLabelData,
      buildGs1Elements(previewLabelData).map(({ ai }) => ai)
    );

    await recordOperationalEvent({
      eventName: 'label_preview_succeeded',
      userId: user.id,
      operationId,
      labelType: sanitizedData.label_type,
      labelSize: getLabelSizeForPrintLayout(sanitizedData.print_layout),
      templateVersion: sanitizedData.template_version,
      durationMs: durationSince(startedAt)
    });

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="gs1_label_preview.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store',
        [LABEL_VERIFICATION_HEADER]: serializeLabelVerificationReport(verification)
      }
    });
  } catch (error) {
    console.error('Preview generation error:', error);

    await recordOperationalEvent({
      eventName: 'workflow_failed',
      userId: user.id,
      operationId,
      workflowStep: 'label_preview',
      errorCategory:
        error.code === 'LABEL_SETTINGS_REQUIRED'
          ? 'settings_required'
          : error.code === 'BARCODE_TOO_WIDE'
            ? 'validation'
            : 'generation',
      durationMs: durationSince(startedAt)
    });

    const isBarcodeTooWide = error.code === 'BARCODE_TOO_WIDE';
    return json(
      {
        success: false,
        message: isBarcodeTooWide ? error.message : 'Failed to generate preview. Please try again.'
      },
      { status: isBarcodeTooWide ? 400 : 500 }
    );
  }
}
