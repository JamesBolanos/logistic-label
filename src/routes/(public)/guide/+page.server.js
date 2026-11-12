import { fail } from '@sveltejs/kit';
import { getLabelSettings } from '#lib/server/db/settings.js';
import { processCustomRequest } from '#lib/server/requests/customRequest.js';
import { CUSTOM_REQUEST_TYPES } from '#lib/validation/customRequest.js';

const requestTypeValues = new Set(Object.values(CUSTOM_REQUEST_TYPES));

export async function load({ locals, setHeaders, url }) {
  const requestedType = url.searchParams.get('requestType');
  const requestDefaults = {
    requestType: requestTypeValues.has(requestedType) ? requestedType : '',
    name: '',
    email: '',
    company: ''
  };

  if (!locals.user) {
    return { requestDefaults };
  }

  setHeaders({ 'cache-control': 'private, no-store' });
  requestDefaults.name = locals.user.name || '';
  requestDefaults.email = locals.user.email || '';

  let companyPrefillWarning = '';
  try {
    const settings = await getLabelSettings(locals.user.id);
    const company = settings.company_name?.trim();
    requestDefaults.company = company && company !== 'Company Name' ? company : '';
  } catch (error) {
    console.error('Failed to load company name for tailored request form:', error);
    companyPrefillWarning =
      'Your company name could not be prefilled. You can enter it below if needed.';
  }

  return { requestDefaults, companyPrefillWarning };
}

export const actions = {
  submitRequest: async ({ request, getClientAddress }) => {
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return fail(400, { message: 'Please submit the request form again.', values: {} });
    }

    const result = await processCustomRequest({
      values: Object.fromEntries(formData),
      clientAddress: getClientAddress()
    });

    return result.status === 200 ? result.data : fail(result.status, result.data);
  }
};
