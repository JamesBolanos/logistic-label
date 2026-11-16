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
 *   message: string,
 *   locale?: 'en' | 'es'
 * }} request
 */
export function createCustomRequestEmail(request) {
  const isProject = request.requestType === 'tailored_project';
  const isSpanish = request.locale === 'es';
  const requestTypeLabels = isSpanish
    ? {
        improvement: 'Sugerencia sobre la herramienta pública',
        tailored_project: 'Consulta sobre proyecto a medida'
      }
    : REQUEST_TYPE_LABELS;
  const topicLabels = isSpanish
    ? {
        general: 'General o no estoy seguro',
        routing_guide: 'Guía de enrutamiento del cliente o minorista',
        label_format: 'Tamaño o formato de etiqueta',
        printer_workflow: 'Flujo de trabajo de impresión',
        integration: 'Integración de datos o sistemas',
        other: 'Otro'
      }
    : TOPIC_LABELS;
  const labels = isSpanish
    ? {
        requestType: 'Tipo de solicitud',
        topic: 'Tema',
        name: 'Nombre',
        company: 'Empresa',
        replyEmail: 'Correo para responder',
        notProvided: 'No indicado',
        details: 'Detalles de la solicitud'
      }
    : {
        requestType: 'Request type',
        topic: 'Topic',
        name: 'Name',
        company: 'Company',
        replyEmail: 'Reply email',
        notProvided: 'Not provided',
        details: 'Request details'
      };

  return {
    subject: isSpanish
      ? isProject
        ? 'Nueva consulta sobre proyecto a medida'
        : 'Nueva sugerencia sobre la herramienta pública'
      : isProject
        ? 'New tailored project inquiry'
        : 'New public tool suggestion',
    text: [
      `${labels.requestType}: ${requestTypeLabels[request.requestType]}`,
      `${labels.topic}: ${topicLabels[request.topic]}`,
      `${labels.name}: ${request.name || labels.notProvided}`,
      `${labels.company}: ${request.company || labels.notProvided}`,
      `${labels.replyEmail}: ${request.email}`,
      '',
      `${labels.details}:`,
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
