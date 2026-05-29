// src/routes/api/pdf/preview/+server.js
import { json } from '@sveltejs/kit';
import { generateLogisticLabelPDF } from '$lib/server/pdf/labelGenerator';
import { validateLabelForm, sanitizeLabelForm } from '$lib/server/validation/formValidation';
import { getLabelSettings } from '$lib/server/db/settings';
import { generateSSCC } from '$lib/utils/gs1Utils';
import { pdfRateLimiter } from '$lib/server/auth/ratelimit';

export async function POST({ request, locals }) {
  // Apply rate limiting
  const rateLimitResponse = pdfRateLimiter(request);
  if (rateLimitResponse) return rateLimitResponse;

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
    
    return json(
      { 
        success: false, 
        message: 'Failed to generate preview. Please try again.' 
      }, 
      { status: 500 }
    );
  }
}
