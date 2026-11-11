import { AUTH_EMAIL_FROM, RESEND_API_KEY } from '$app/env/private';

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
export const CUSTOM_REQUEST_TO = 'jbolanosdiaz@gmail.com';

const REQUEST_TYPE_LABELS = {
  improvement: 'Public tool suggestion',
  tailored_project: 'Tailored project inquiry'
};

const TOPIC_LABELS = {
  general: 'General or not sure',
  routing_guide: 'Customer or retailer routing guide',
  label_format: 'Label size or format',
  printer_workflow: 'Printer workflow',
  integration: 'Data or system integration',
  other: 'Other'
};

/**
 * @param {{
 *   requestType: keyof typeof REQUEST_TYPE_LABELS,
 *   topic: keyof typeof TOPIC_LABELS,
 *   name: string,
 *   email: string,
 *   company: string,
 *   message: string
 * }} request
 */
export function createCustomRequestEmail(request) {
  const isProject = request.requestType === 'tailored_project';
  return {
    subject: isProject ? 'New tailored project inquiry' : 'New public tool suggestion',
    text: [
      `Request type: ${REQUEST_TYPE_LABELS[request.requestType]}`,
      `Topic: ${TOPIC_LABELS[request.topic]}`,
      `Name: ${request.name || 'Not provided'}`,
      `Company: ${request.company || 'Not provided'}`,
      `Reply email: ${request.email}`,
      '',
      'Request details:',
      request.message
    ].join('\n')
  };
}

/**
 * @param {Parameters<typeof createCustomRequestEmail>[0]} request
 */
export async function sendCustomRequestEmail(request) {
  const apiKey = RESEND_API_KEY?.trim();
  const from = AUTH_EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    throw new Error('Custom request email delivery is not configured.');
  }

  await deliverCustomRequestEmail({ apiKey, from, to: CUSTOM_REQUEST_TO, request });
}

/**
 * @param {{
 *   apiKey: string,
 *   from: string,
 *   to: string,
 *   request: Parameters<typeof createCustomRequestEmail>[0]
 * }} delivery
 * @param {typeof fetch} [fetchImplementation]
 */
export async function deliverCustomRequestEmail(
  { apiKey, from, to, request },
  fetchImplementation = fetch
) {
  const message = createCustomRequestEmail(request);
  let response;

  try {
    response = await fetchImplementation(RESEND_EMAILS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: request.email,
        subject: message.subject,
        text: message.text,
        tags: [
          { name: 'email_type', value: 'custom_request' },
          { name: 'request_type', value: request.requestType }
        ]
      })
    });
  } catch {
    throw new Error('The custom request email provider is unavailable.');
  }

  if (!response.ok) {
    await response.body?.cancel();
    throw new Error('The custom request email provider rejected the message.');
  }

  await response.body?.cancel();
}
