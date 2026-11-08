// src/routes/api/pdf/generate/+server.js
import { json } from '@sveltejs/kit';
import { createLabel } from '#lib/server/db/labels.js';
import { validateGuidedLabelBarcodeFit } from '#lib/server/pdf/labelGenerator.js';
import { LABEL_TYPES } from '#lib/labels/workflows.js';
import { validateLabelForm, sanitizeLabelForm } from '#lib/server/validation/formValidation.js';
import { pdfRateLimiter } from '#lib/server/auth/ratelimit.js';
import {
  durationSince,
  getOperationId,
  recordOperationalEvent
} from '#lib/server/analytics/operationalEvents.js';

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
        workflowStep: 'label_save',
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
        workflowStep: 'label_save',
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

    validateGuidedLabelBarcodeFit(sanitizedData);

    const labelCount =
      sanitizedData.label_type === LABEL_TYPES.SSCC_BASIC
        ? Math.min(10, Math.max(1, Number(sanitizedData.label_count) || 1))
        : 1;

    // Create one label per requested SSCC. Each call allocates and advances the
    // configured serial reference, so labels in a batch never share an SSCC.
    const labels = [];
    for (let index = 0; index < labelCount; index += 1) {
      const label = await createLabel(sanitizedData, user.id, { operationId, startedAt });
      labels.push(label);
    }

    return json({
      success: true,
      message:
        labels.length === 1
          ? 'Label generated successfully'
          : `${labels.length} labels generated successfully`,
      labelId: labels[0].id,
      labelIds: labels.map((label) => label.id),
      count: labels.length
    });
  } catch (error) {
    if (error.code === 'BARCODE_TOO_WIDE') {
      await recordOperationalEvent({
        eventName: 'workflow_failed',
        userId: user.id,
        operationId,
        workflowStep: 'label_save',
        errorCategory: 'validation',
        durationMs: durationSince(startedAt)
      });
      return json({ success: false, message: error.message }, { status: 400 });
    }

    if (error.code === 'LABEL_SETTINGS_REQUIRED') {
      await recordOperationalEvent({
        eventName: 'workflow_failed',
        userId: user.id,
        operationId,
        workflowStep: 'label_save',
        errorCategory: 'settings_required',
        durationMs: durationSince(startedAt)
      });

      return json(
        {
          success: false,
          message: 'Configure your GS1 Company Prefix in Settings before generating labels.'
        },
        { status: 400 }
      );
    }

    if (error.code === 'SSCC_SERIAL_EXHAUSTED' || error.code === 'SSCC_ALLOCATION_FAILED') {
      await recordOperationalEvent({
        eventName: 'workflow_failed',
        userId: user.id,
        operationId,
        workflowStep: 'label_save',
        errorCategory: 'database',
        durationMs: durationSince(startedAt)
      });

      return json(
        {
          success: false,
          message: 'Unable to allocate a new SSCC. Review the serial reference in Settings.'
        },
        { status: 409 }
      );
    }

    console.error('PDF generation error:', error);

    await recordOperationalEvent({
      eventName: 'workflow_failed',
      userId: user.id,
      operationId,
      workflowStep: 'label_save',
      errorCategory: 'database',
      durationMs: durationSince(startedAt)
    });

    return json(
      {
        success: false,
        message: error.message || 'Failed to generate PDF. Please try again.'
      },
      { status: 500 }
    );
  }
}
