// src/routes/api/pdf/download/[id]/+server.js
import { getLabelById } from '$lib/server/db/labels';
import { getLabelSettings } from '$lib/server/db/settings';
import { generateLogisticLabelPDF } from '$lib/server/pdf/labelGenerator';
import { pdfRateLimiter } from '$lib/server/auth/ratelimit';

export async function GET({ params, request, locals }) {
  // Apply rate limiting
  const rateLimitResponse = pdfRateLimiter(request);
  if (rateLimitResponse) return rateLimitResponse;

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
      return new Response('Label not found', { status: 404 });
    }
    
    const settings = await getLabelSettings(user.id);
    const pdfBuffer = await generateLogisticLabelPDF(label, {
      company_name: settings.company_name
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
    return new Response('Error downloading PDF', { status: 500 });
  }
}
