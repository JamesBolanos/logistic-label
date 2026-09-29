// src/routes/api/labels/create/+server.js
import { json } from '@sveltejs/kit';
import { createLabel } from '$lib/server/db/labels';
import { validateGuidedLabelBarcodeFit } from '$lib/server/pdf/labelGenerator.js';
import { validateLabelForm, sanitizeLabelForm } from '$lib/server/validation/formValidation';
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

    // Create label in database
    const label = await createLabel(sanitizedData, user.id, { operationId, startedAt });

    return json({
      success: true,
      message: 'Label created successfully',
      label: {
        id: label.id,
        label_type: label.label_type,
        template_version: label.template_version,
        print_layout: label.print_layout,
        gtin: label.gtin,
        packaging_level: label.packaging_level,
        lot_number: label.lot_number,
        production_date: label.production_date,
        date_ai: label.date_ai,
        date_value: label.date_value,
        quantity: label.quantity,
        weight_pounds: label.weight_pounds,
        ship_from: label.ship_from,
        ship_to: label.ship_to,
        purchase_order: label.purchase_order,
        carrier: label.carrier,
        gross_weight: label.gross_weight,
        gross_weight_unit: label.gross_weight_unit,
        transport_count: label.transport_count,
        transport_count_type: label.transport_count_type,
        sscc: label.sscc,
        created_at: label.created_at
      }
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
          message: 'Configure your GS1 Company Prefix in Settings before creating labels.'
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

    console.error('Label creation error:', error);

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
        message: 'Failed to create label. Please try again.'
      },
      { status: 500 }
    );
  }
}
