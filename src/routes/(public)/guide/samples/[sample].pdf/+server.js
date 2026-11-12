import { generateLogisticLabelPDF } from '#lib/server/pdf/labelGenerator.js';
import { LABEL_TYPES, PRINT_LAYOUTS, TEMPLATE_VERSIONS } from '#lib/labels/workflows.js';

const companyName = 'GRAND SUPPLIER COFFEE';
const sscc = '006141411234567890';

/** @type {Record<string, Record<string, unknown>>} */
const samples = {
  transport: {
    label_type: LABEL_TYPES.SSCC_ONLY,
    template_version: TEMPLATE_VERSIONS.TRANSPORT,
    print_layout: PRINT_LAYOUTS.FOUR_BY_SIX_SINGLE,
    sscc,
    ship_from: `${companyName}\nOrigin address`,
    ship_to: 'Example Distribution\nDestination address',
    purchase_order: 'PO-EXAMPLE-001',
    carrier: 'Example Carrier',
    gross_weight: 1200,
    gross_weight_unit: 'kg',
    transport_count: 20,
    transport_count_type: 'cases'
  },
  contents: {
    label_type: LABEL_TYPES.HOMOGENEOUS_UNIT,
    template_version: TEMPLATE_VERSIONS.STRUCTURED_CONTENT,
    print_layout: PRINT_LAYOUTS.SIX_BY_EIGHT_SINGLE,
    sscc,
    gtin: '00614141000418',
    quantity: 20,
    packaging_level: 'case',
    lot_number: '451214',
    ship_from: `${companyName}\nOrigin address`,
    ship_to: 'Example Distribution\nDestination address',
    purchase_order: 'PO-EXAMPLE-001',
    carrier: 'Example Carrier',
    gross_weight: 1200,
    gross_weight_unit: 'kg'
  },
  basic: {
    label_type: LABEL_TYPES.SSCC_BASIC,
    template_version: TEMPLATE_VERSIONS.SSCC_BASIC,
    print_layout: PRINT_LAYOUTS.FOUR_BY_THREE_SINGLE,
    sscc
  }
};

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  const sample = Object.hasOwn(samples, params.sample) ? samples[params.sample] : null;
  if (!sample) return new Response('Sample not found', { status: 404 });

  const pdf = await generateLogisticLabelPDF(sample, { company_name: companyName });

  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="sscc-label-${params.sample}.pdf"`,
      'Cache-Control': 'public, max-age=86400'
    }
  });
}
