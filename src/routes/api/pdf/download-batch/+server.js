// src/routes/api/pdf/download-batch/+server.js
import { getLabelById } from '#lib/server/db/labels.js';
import { getLabelSettings } from '#lib/server/db/settings.js';
import { generateMultipleLogisticLabels } from '#lib/server/pdf/labelGenerator.js';
import { pdfRateLimiter } from '#lib/server/auth/ratelimit.js';
import {
  durationSince,
  getOperationId,
  recordOperationalEvent
} from '#lib/server/analytics/operationalEvents.js';

export async function GET({ url, request, locals }) {
  const startedAt = Date.now();
  const operationId = getOperationId(request);

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

  const ids = String(url.searchParams.get('ids') || '')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);

  if (!ids.length) {
    return new Response('Label IDs are required', { status: 400 });
  }

  if (ids.length > 10) {
    return new Response('A batch may contain at most 10 labels', { status: 400 });
  }

  try {
    const labels = [];
    for (const id of ids) {
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
      labels.push(label);
    }

    const settings = await getLabelSettings(user.id);
    const pdfBuffer = await generateMultipleLogisticLabels(labels, {
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

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="gs1_labels_${labels[0].id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Batch PDF download error:', error);
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
