import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export async function verifyRecaptchaToken(token, remoteIp) {
  if (dev) {
    return { success: true };
  }

  if (!env.RECAPTCHA_SECRET_KEY) {
    return { success: false, message: 'Captcha secret is not configured.' };
  }

  if (!token) {
    return { success: false, message: 'Captcha verification is required.' };
  }

  const body = new URLSearchParams({
    secret: env.RECAPTCHA_SECRET_KEY,
    response: token
  });

  if (remoteIp) {
    body.set('remoteip', remoteIp);
  }

  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });
    const result = await response.json();

    if (!result.success) {
      return { success: false, message: 'Captcha verification failed.' };
    }

    return { success: true };
  } catch (error) {
    console.error('reCAPTCHA verification error', error);
    return { success: false, message: 'Unable to verify captcha.' };
  }
}
