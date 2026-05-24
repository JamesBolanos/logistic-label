// src/routes/api/pdf/generate/+server.js
import { json } from '@sveltejs/kit';
import { generateLogisticLabelPDF } from '$lib/server/pdf/labelGenerator';
import { createLabel, updateLabelPrinted } from '$lib/server/db/labels';
import { validateLabelForm, sanitizeLabelForm } from '$lib/server/validation/formValidation';
import { pdfRateLimiter } from '$lib/server/auth/ratelimit';
import path from 'path';
import fs from 'fs';
import { env } from '$env/dynamic/private';

// Directory to store generated PDFs
const PDF_DIR = env.PDF_STORAGE_PATH || 'storage/pdf';

// Ensure the PDF directory exists
try {
  fs.mkdirSync(PDF_DIR, { recursive: true });
} catch (err) {
  console.error('Failed to create PDF storage directory:', err);
}

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
    
    // Create label in database
    const label = await createLabel(sanitizedData, user.id);
    
    // Generate PDF
    const pdfBuffer = await generateLogisticLabelPDF(label, {
      company_name: 'Your Company Name' // Could be configurable
    });
    
    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
    const filename = `label_${label.id}_${timestamp}.pdf`;
    const pdfPath = path.join(PDF_DIR, filename);
    
    // Save the PDF to disk
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    // Update the label record with PDF path
    await updateLabelPrinted(label.id, filename, user.id);
    
    return json({ 
      success: true,
      message: 'PDF generated successfully',
      labelId: label.id
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    
    return json(
      { 
        success: false, 
        message: 'Failed to generate PDF. Please try again.' 
      }, 
      { status: 500 }
    );
  }
}
