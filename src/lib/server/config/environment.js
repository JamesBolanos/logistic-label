import { dev } from '$app/env';
import {
  APP_ENV,
  AUTH_EMAIL_FROM,
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
  DATABASE_ENVIRONMENT,
  EXPECTED_NEON_PROJECT_ID,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  LOGISTIC_LABEL_DATABASE_URL,
  LOGISTIC_LABEL_NEON_PROJECT_ID,
  RECAPTCHA_SECRET_KEY,
  RESEND_API_KEY,
  VERCEL_ENV
} from '$app/env/private';
import { PUBLIC_RECAPTCHA_SITE_KEY } from '$app/env/public';

/** @type {Array<[string, () => string | undefined]>} */
const REQUIRED_PRODUCTION_VARIABLES = [
  ['LOGISTIC_LABEL_DATABASE_URL', () => LOGISTIC_LABEL_DATABASE_URL],
  ['DATABASE_ENVIRONMENT', () => DATABASE_ENVIRONMENT],
  ['LOGISTIC_LABEL_NEON_PROJECT_ID', () => LOGISTIC_LABEL_NEON_PROJECT_ID],
  ['EXPECTED_NEON_PROJECT_ID', () => EXPECTED_NEON_PROJECT_ID],
  ['BETTER_AUTH_SECRET', () => BETTER_AUTH_SECRET],
  ['BETTER_AUTH_URL', () => BETTER_AUTH_URL],
  ['GOOGLE_CLIENT_ID', () => GOOGLE_CLIENT_ID],
  ['GOOGLE_CLIENT_SECRET', () => GOOGLE_CLIENT_SECRET],
  ['PUBLIC_RECAPTCHA_SITE_KEY', () => PUBLIC_RECAPTCHA_SITE_KEY],
  ['RECAPTCHA_SECRET_KEY', () => RECAPTCHA_SECRET_KEY],
  ['RESEND_API_KEY', () => RESEND_API_KEY],
  ['AUTH_EMAIL_FROM', () => AUTH_EMAIL_FROM]
];

export function validateServerEnvironment() {
  if (dev || deploymentEnvironment() !== 'production') {
    return;
  }

  const missing = REQUIRED_PRODUCTION_VARIABLES.filter(([, getValue]) => !getValue()?.trim()).map(
    ([name]) => name
  );

  if (missing.length > 0) {
    throw new Error(`Production configuration is incomplete. Missing: ${missing.join(', ')}`);
  }

  const betterAuthUrl = BETTER_AUTH_URL;

  if (!betterAuthUrl) {
    throw new Error('Production configuration is incomplete. Missing: BETTER_AUTH_URL');
  }

  let authUrl;
  try {
    authUrl = new URL(betterAuthUrl);
  } catch {
    throw new Error(
      'Production configuration is invalid. BETTER_AUTH_URL must be an absolute URL.'
    );
  }

  if (authUrl.protocol !== 'https:') {
    throw new Error('Production configuration is invalid. BETTER_AUTH_URL must use HTTPS.');
  }
}

function deploymentEnvironment() {
  if (VERCEL_ENV === 'production') {
    return 'production';
  }

  return APP_ENV || VERCEL_ENV;
}
