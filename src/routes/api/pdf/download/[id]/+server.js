// src/routes/api/pdf/download/[id]/+server.js
import { getLabelById } from '$lib/server/db/labels';
import { getLabelSettings } from '$lib/server/db/settings';
import { generateLogisticLabelPDF } from '$lib/server/pdf/labelGenerator';
import { pdfRateLimiter } from '$lib/server/auth/ratelimit';
import {
  durationSince,
  getOperationId,
  recordOperationalEvent
} from '$lib/server/analytics/operationalEvents.js';

export async function GET({ params, request, locals }) {
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
        workflowStep: 'pdf_response',
        errorCategory: 'rate_limited',
        durationMs: durationSince(startedAt)
      });
    }
    return rateLimitResponse;
  }

  const user = locals.user;
  if (!user) {
    return new Response('Authentication required', { status: 401 });
  }
  
  // Get label ID from params
  const { id } = params;
  
  try {
    // Get label from database
    const label = await getLabelById(id, user.id);
    
    if (!label) {
      await recordOperationalEvent({
        eventName: 'workflow_failed',
        userId: user.id,
        operationId,
        workflowStep: 'pdf_response',
        errorCategory: 'not_found',
        durationMs: durationSince(startedAt)
      });

      return new Response('Label not found', { status: 404 });
    }
    
    const settings = await getLabelSettings(user.id);
    const pdfBuffer = await generateLogisticLabelPDF(label, {
      company_name: settings.company_name
    });

    await recordOperationalEvent({
      eventName: 'pdf_response_succeeded',
      userId: user.id,
      operationId,
      documentFormat: 'pdf',
      downloadSource: request.headers.get('x-download-source'),
      durationMs: durationSince(startedAt)
    });
    
    // Return the PDF
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="gs1_label_${label.id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('PDF download error:', error);
    await recordOperationalEvent({
      eventName: 'workflow_failed',
      userId: user.id,
      operationId,
      workflowStep: 'pdf_response',
      errorCategory: 'generation',
      durationMs: durationSince(startedAt)
    });
    return new Response('Error downloading PDF', { status: 500 });
  }
}
