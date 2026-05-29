import { building } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from '$lib/server/auth/betterAuth';

const PROTECTED_PATHS = ['/dashboard', '/labels', '/settings'];

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const resolveWithSecurityHeaders = async (event) => {
    const response = await resolve(event);

    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'no-referrer-when-downgrade');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return response;
  };

  if (building) {
    return svelteKitHandler({
      auth,
      event,
      resolve: resolveWithSecurityHeaders,
      building
    });
  }

  if (event.url.pathname.startsWith('/api/auth/')) {
    return auth.handler(event.request);
  }

  const session = await auth.api.getSession({
    headers: event.request.headers
  });

  event.locals.session = session?.session ?? null;
  event.locals.user = session?.user ?? null;

  if (PROTECTED_PATHS.some((path) => event.url.pathname === path || event.url.pathname.startsWith(`${path}/`))) {
    if (!event.locals.user) {
      redirect(303, `/login?returnUrl=${encodeURIComponent(event.url.pathname + event.url.search)}`);
    }
  }

  if (event.url.pathname.startsWith('/api/') && !event.url.pathname.startsWith('/api/auth') && !event.locals.user) {
    return jsonUnauthorized();
  }

  return svelteKitHandler({
    auth,
    event,
    resolve: resolveWithSecurityHeaders,
    building
  });
}

function jsonUnauthorized() {
  return new Response(JSON.stringify({ success: false, message: 'Authentication required' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}
