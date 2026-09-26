import { env } from '$env/dynamic/private';

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
const SUBJECT = 'Reset your SSCC Labels password';

/** @param {string} resetUrl */
export function createPasswordResetEmail(resetUrl) {
  const safeResetUrl = escapeHtml(resetUrl);

  return {
    subject: SUBJECT,
    text: [
      'We received a request to reset your SSCC Labels password.',
      '',
      'Use this link within 60 minutes:',
      resetUrl,
      '',
      'If you did not request a password reset, you can ignore this email.'
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto;">
        <h1 style="font-size: 24px; color: #111827;">Reset your password</h1>
        <p>We received a request to reset your SSCC Labels password.</p>
        <p>
          <a href="${safeResetUrl}" style="display: inline-block; padding: 12px 18px; border-radius: 6px; background: #2563eb; color: #ffffff; text-decoration: none;">
            Choose a new password
          </a>
        </p>
        <p>This link expires in 60 minutes and can only be used once.</p>
        <p>If you did not request a password reset, you can ignore this email.</p>
      </div>
    `.trim()
  };
}

/** @param {{ to: string, resetUrl: string }} message */
export async function sendPasswordResetEmail({ to, resetUrl }) {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.AUTH_EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    throw new Error('Password reset email delivery is not configured.');
  }

  await deliverPasswordResetEmail({ apiKey, from, to, resetUrl });
}

/**
 * @param {{ apiKey: string, from: string, to: string, resetUrl: string }} delivery
 * @param {typeof fetch} [fetchImplementation]
 */
export async function deliverPasswordResetEmail(
  { apiKey, from, to, resetUrl },
  fetchImplementation = fetch
) {
  const message = createPasswordResetEmail(resetUrl);
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
