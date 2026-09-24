// src/routes/api/pdf/generate/+server.js
import { json } from '@sveltejs/kit';
import { createLabel } from '$lib/server/db/labels';
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
    
    // Create label in database
    const label = await createLabel(sanitizedData, user.id, { operationId, startedAt });
    
    return json({ 
      success: true,
      message: 'Label generated successfully',
      labelId: label.id
    });
  } catch (error) {
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
