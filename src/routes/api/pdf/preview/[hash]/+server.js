import fs from 'fs';
import path from 'path';
import { env } from '$env/dynamic/private';

const PREVIEW_DIR = env.PREVIEW_STORAGE_PATH || 'storage/preview';

export async function GET({ params, locals }) {
  if (!locals.user) {
    return new Response('Authentication required', { status: 401 });
  }

  if (!/^[a-f0-9]{32}$/.test(params.hash)) {
    return new Response('Preview not found', { status: 404 });
  }

  const pdfPath = path.join(PREVIEW_DIR, `preview_${params.hash}.pdf`);

  if (!fs.existsSync(pdfPath)) {
    return new Response('Preview not found', { status: 404 });
  }

  const pdfBuffer = fs.readFileSync(pdfPath);

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="gs1_label_preview.pdf"',
      'Content-Length': pdfBuffer.length.toString(),
      'Cache-Control': 'private, max-age=300'
    }
  });
}
