import { AUTH_EMAIL_FROM, RESEND_API_KEY } from '$app/env/private';

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
const SUBJECT = 'Reset your SSCC Labels password';

/** @param {string} resetUrl @param {'en' | 'es'} [locale] */
export function createPasswordResetEmail(resetUrl, locale = 'en') {
  const safeResetUrl = escapeHtml(resetUrl);
  const isSpanish = locale === 'es';
  const copy = isSpanish
    ? {
        subject: 'Restablece tu contraseña de SSCC Labels',
        title: 'Restablece tu contraseña',
        request: 'Recibimos una solicitud para restablecer tu contraseña de SSCC Labels.',
        linkIntro: 'Usa este enlace dentro de los próximos 60 minutos:',
        button: 'Elegir una contraseña nueva',
        expiry: 'Este enlace vence en 60 minutos y solo se puede usar una vez.',
        ignore: 'Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.'
      }
    : {
        subject: SUBJECT,
        title: 'Reset your password',
        request: 'We received a request to reset your SSCC Labels password.',
        linkIntro: 'Use this link within 60 minutes:',
        button: 'Choose a new password',
        expiry: 'This link expires in 60 minutes and can only be used once.',
        ignore: 'If you did not request a password reset, you can ignore this email.'
      };

  return {
    subject: copy.subject,
    text: [copy.request, '', copy.linkIntro, resetUrl, '', copy.ignore].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto;">
        <h1 style="font-size: 24px; color: #111827;">${copy.title}</h1>
        <p>${copy.request}</p>
        <p>
          <a href="${safeResetUrl}" style="display: inline-block; padding: 12px 18px; border-radius: 6px; background: #2563eb; color: #ffffff; text-decoration: none;">
            ${copy.button}
          </a>
        </p>
        <p>${copy.expiry}</p>
        <p>${copy.ignore}</p>
      </div>
    `.trim()
  };
}

/** @param {{ to: string, resetUrl: string, locale?: 'en' | 'es' }} message */
export async function sendPasswordResetEmail({ to, resetUrl, locale = 'en' }) {
  const apiKey = RESEND_API_KEY?.trim();
  const from = AUTH_EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    throw new Error('Password reset email delivery is not configured.');
  }

  await deliverPasswordResetEmail({ apiKey, from, to, resetUrl, locale });
}

/**
 * @param {{ apiKey: string, from: string, to: string, resetUrl: string, locale?: 'en' | 'es' }} delivery
 * @param {typeof fetch} [fetchImplementation]
 */
export async function deliverPasswordResetEmail(
  { apiKey, from, to, resetUrl, locale = 'en' },
  fetchImplementation = fetch
) {
  const message = createPasswordResetEmail(resetUrl, locale);
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
        subject: message.subject,
        text: message.text,
        html: message.html,
        tags: [{ name: 'email_type', value: 'password_reset' }]
      })
    });
  } catch {
    throw new Error('The password reset email provider is unavailable.');
  }

  if (!response.ok) {
    await response.body?.cancel();
    throw new Error('The password reset email provider rejected the message.');
  }

  await response.body?.cancel();
}

/** @param {string} value */
function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
