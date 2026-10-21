import { defineEnvVars } from '@sveltejs/kit/env';

/**
 * Accepts the raw environment value, including `undefined` when the variable is
 * not set.
 *
 * Every variable is optional at the framework level so that local development,
 * CI, and preview builds can start with a partial configuration.
 * `validateServerEnvironment()` in `src/lib/server/config/environment.js`
 * remains the authoritative check before a production deployment serves traffic.
 *
 * @param {string | undefined} value
 * @returns {string | undefined}
 */
const optionalString = (value) => value;

/**
 * Declares every environment variable the app reads.
 *
 * SvelteKit only exposes variables that are declared here, so an undeclared
 * variable resolves to `undefined` instead of failing the build. Private
 * variables are imported from `$app/env/private`; public ones from
 * `$app/env/public`.
 */
export const variables = defineEnvVars({
  APP_ENV: {
    schema: optionalString,
    description: 'Deployment environment name used when the app does not run on Vercel.'
  },
  AUTH_EMAIL_FROM: {
    schema: optionalString,
    description: 'Sender address used for password reset emails.'
  },
  ANALYTICS_OWNER_USER_IDS: {
    schema: optionalString,
    description: 'Comma-separated user IDs allowed to read analytics.'
  },
  BETTER_AUTH_SECRET: {
    schema: optionalString,
    description: 'Secret used to sign authentication sessions and tokens.'
  },
  BETTER_AUTH_URL: {
    schema: optionalString,
    description: 'Public base URL of the deployed application.'
  },
  DATABASE_ENVIRONMENT: {
    schema: optionalString,
    description: 'Environment the database is expected to belong to (production or nonproduction).'
  },
  EXPECTED_NEON_PROJECT_ID: {
    schema: optionalString,
    description: 'Neon project ID the application database must belong to.'
  },
  GOOGLE_ANALYTICS_ID: {
    schema: optionalString,
    description: 'Google Analytics measurement ID injected into production pages.'
  },
  GOOGLE_CLIENT_ID: {
    schema: optionalString,
    description: 'Google OAuth client ID used for sign-in.'
  },
  GOOGLE_CLIENT_SECRET: {
    schema: optionalString,
    description: 'Google OAuth client secret used for sign-in.'
  },
  LOGISTIC_LABEL_DATABASE_URL: {
    schema: optionalString,
    description: 'Postgres connection string for the application database.'
  },
  LOGISTIC_LABEL_NEON_PROJECT_ID: {
    schema: optionalString,
    description: 'Neon project ID of the application database.'
  },
  PREVIEW_STORAGE_PATH: {
    schema: optionalString,
    description: 'Directory used to store generated PDF previews.'
  },
  RECAPTCHA_SECRET_KEY: {
    schema: optionalString,
    description: 'Server-side reCAPTCHA key used to verify tokens.'
  },
  RESEND_API_KEY: {
    schema: optionalString,
    description: 'Resend API key used to send transactional email.'
  },
  VERCEL: {
    schema: optionalString,
    description: 'Set by Vercel. Enables platform background tasks.'
  },
  VERCEL_ENV: {
    schema: optionalString,
    description: 'Vercel deployment environment (production, preview, or development).'
  },
  PUBLIC_RECAPTCHA_SITE_KEY: {
    public: true,
    schema: optionalString,
    description: 'Browser-safe reCAPTCHA site key used to render the widget.'
  }
});
