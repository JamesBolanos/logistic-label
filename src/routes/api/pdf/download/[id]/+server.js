// src/routes/api/pdf/download/[id]/+server.js
import { getLabelById } from '$lib/server/db/labels';
import { pdfRateLimiter } from '$lib/server/auth/ratelimit';
import fs from 'fs';
import path from 'path';
import { env } from '$env/dynamic/private';

// Directory to store generated PDFs
const PDF_DIR = env.PDF_STORAGE_PATH || 'storage/pdf';

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
    
    // Check if PDF exists
    if (!label.pdf_path) {
      return new Response('PDF not found for this label', { status: 404 });
    }
    
    const pdfPath = path.join(PDF_DIR, label.pdf_path);
    
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      return new Response('PDF file not found', { status: 404 });
    }
    
    // Read the file
    const pdfBuffer = fs.readFileSync(pdfPath);
    
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
