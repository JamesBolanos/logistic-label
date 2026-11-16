import { createAuthClient } from 'better-auth/svelte';
import { getLocale } from '#lib/paraglide/runtime.js';

export const authClient = createAuthClient({
  fetchOptions: {
    onRequest({ headers }) {
      headers.set('x-app-locale', getLocale());
    }
  }
});
