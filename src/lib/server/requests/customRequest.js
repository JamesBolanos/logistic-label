import { isCustomRequestRateLimited } from '#lib/server/auth/ratelimit.js';
import { sendCustomRequestEmail } from '#lib/server/email/customRequest.js';
import { validateCustomRequest } from '#lib/validation/customRequest.js';

/**
 * @param {{
 *   values: Record<string, unknown>,
 *   clientAddress: string,
 *   sendEmail?: typeof sendCustomRequestEmail
 * }} request
 */
export async function processCustomRequest({
  values: inputValues,
  clientAddress,
  sendEmail = sendCustomRequestEmail
}) {
  const validation = validateCustomRequest(inputValues);
  const values = validation.values;

  if (values.website) {
    return {
      status: 400,
      data: {
        message: 'We could not accept this request. Please review the form and try again.',
        values,
        errors: {}
      }
    };
  }

  if (!validation.valid) {
    return {
      status: 400,
      data: {
        message: 'Please check the highlighted fields.',
        values,
        errors: validation.errors
      }
    };
  }

  const validatedValues = validation.values;

  if (isCustomRequestRateLimited(clientAddress)) {
    return {
      status: 429,
      data: {
        message:
          'Too many requests were sent from this connection. Your details are still here; please try again later.',
        values
      }
    };
  }

  try {
    await sendEmail(validatedValues);
    return {
      status: 200,
      data: { success: true, requestType: validatedValues.requestType }
    };
  } catch (error) {
    console.error('Custom request email delivery failed:', error);
    return {
      status: 503,
      data: {
        message:
          'Your request could not be sent right now. Your details are still here; please try again or email jbolanosdiaz@gmail.com.',
        values
      }
    };
  }
}
