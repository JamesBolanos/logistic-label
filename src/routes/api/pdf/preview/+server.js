// src/routes/api/pdf/preview/+server.js
import { json } from '@sveltejs/kit';
import { generateLogisticLabelPDF } from '$lib/server/pdf/labelGenerator';
import { validateLabelForm, sanitizeLabelForm } from '$lib/server/validation/formValidation';
import { getLabelSettings } from '$lib/server/db/settings';
import { generateSSCC } from '$lib/utils/gs1Utils';
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

    await recordOperationalEvent({
      eventName: 'label_preview_succeeded',
      userId: user.id,
      operationId,
      labelType: 'homogeneous_unit',
      labelSize: '4x6',
      templateVersion: 'v1',
      durationMs: durationSince(startedAt)
    });
    
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="gs1_label_preview.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Preview generation error:', error);

    await recordOperationalEvent({
      eventName: 'workflow_failed',
      userId: user.id,
      operationId,
      workflowStep: 'label_preview',
      errorCategory: error.code === 'LABEL_SETTINGS_REQUIRED' ? 'settings_required' : 'generation',
      durationMs: durationSince(startedAt)
    });
    
    return json(
      { 
        success: false, 
        message: 'Failed to generate preview. Please try again.' 
      }, 
      { status: 500 }
    );
  }
}
