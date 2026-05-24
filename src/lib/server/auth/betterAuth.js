import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { db, schema } from '$lib/server/db';

if (!db) {
  console.warn('Better Auth is configured, but LOGISTIC_LABEL_DATABASE_URL is missing.');
}

export const auth = betterAuth({
  database: db ? drizzleAdapter(db, { provider: 'pg', schema }) : undefined,
  secret: env.BETTER_AUTH_SECRET || 'dev-only-change-me-before-production',
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID || '',
      clientSecret: env.GOOGLE_CLIENT_SECRET || ''
    }
  },
  trustedOrigins: [
    env.BETTER_AUTH_URL,
    dev ? 'http://localhost:5173' : null,
    dev ? 'http://localhost:5174' : null,
    dev ? 'http://127.0.0.1:5173' : null,
    dev ? 'http://127.0.0.1:5174' : null
  ].filter(Boolean),
  plugins: [sveltekitCookies(getRequestEvent)]
});
