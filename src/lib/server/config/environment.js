import { dev } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

/** @type {Array<[string, () => string | undefined]>} */
const REQUIRED_PRODUCTION_VARIABLES = [
  ['LOGISTIC_LABEL_DATABASE_URL', () => privateEnv.LOGISTIC_LABEL_DATABASE_URL],
  ['DATABASE_ENVIRONMENT', () => privateEnv.DATABASE_ENVIRONMENT],
  ['LOGISTIC_LABEL_NEON_PROJECT_ID', () => privateEnv.LOGISTIC_LABEL_NEON_PROJECT_ID],
  ['EXPECTED_NEON_PROJECT_ID', () => privateEnv.EXPECTED_NEON_PROJECT_ID],
  ['BETTER_AUTH_SECRET', () => privateEnv.BETTER_AUTH_SECRET],
  ['BETTER_AUTH_URL', () => privateEnv.BETTER_AUTH_URL],
  ['GOOGLE_CLIENT_ID', () => privateEnv.GOOGLE_CLIENT_ID],
  ['GOOGLE_CLIENT_SECRET', () => privateEnv.GOOGLE_CLIENT_SECRET],
  ['PUBLIC_RECAPTCHA_SITE_KEY', () => publicEnv.PUBLIC_RECAPTCHA_SITE_KEY],
  ['RECAPTCHA_SECRET_KEY', () => privateEnv.RECAPTCHA_SECRET_KEY]
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

  const betterAuthUrl = privateEnv.BETTER_AUTH_URL;

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
  if (privateEnv.VERCEL_ENV === 'production') {
    return 'production';
  }

  return privateEnv.APP_ENV || privateEnv.VERCEL_ENV;
}
