import { fail } from '@sveltejs/kit';
import { processCustomRequest } from '#lib/server/requests/customRequest.js';

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
