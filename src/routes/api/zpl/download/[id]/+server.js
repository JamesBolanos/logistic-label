import { getLabelById } from '$lib/server/db/labels';
import { getLabelSettings } from '$lib/server/db/settings';
import { pdfRateLimiter } from '$lib/server/auth/ratelimit';
import { generateLogisticLabelZPL, isZplDpi } from '$lib/server/zpl/labelGenerator';

export async function GET({ params, request, locals, url }) {
  if (!locals.user) return new Response('Authentication required', { status: 401 });

  const rateLimitResponse = pdfRateLimiter(request);
  if (rateLimitResponse) return rateLimitResponse;

  const resolution = url.searchParams.get('dpi') ?? '203';
  const dpi = Number(resolution);
  if (!/^(203|300|600)$/.test(resolution) || !isZplDpi(dpi)) {
    return new Response('Choose a printer resolution of 203, 300, or 600 dpi.', { status: 400 });
  }

  try {
    const label = await getLabelById(params.id, locals.user.id);
    if (!label) return new Response('Label not found', { status: 404 });

    const settings = await getLabelSettings(locals.user.id);
    const zpl = generateLogisticLabelZPL(label, { dpi, company_name: settings.company_name });

    return new Response(zpl, {
      headers: {
        'Content-Type': 'application/vnd.zebra-zpl; charset=utf-8',
        'Content-Disposition': `attachment; filename="gs1_label_${label.id}_${dpi}dpi.zpl"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    if (error.code === 'ZPL_BARCODE_TOO_WIDE' || error.code === 'BARCODE_TOO_WIDE') {
      return new Response(
        'The barcode is too wide for this ZPL layout. Download the PDF or review the label contents.',
        { status: 422 }
      );
    }
    // Do not log the label or an encoder error that can include label data.
    console.error('ZPL download failed');
    return new Response('Unable to download ZPL. Try again from saved labels.', { status: 500 });
  }
}
