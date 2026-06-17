import { building } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from '$lib/server/auth/betterAuth';
import { verifyRecaptchaToken } from '$lib/server/auth/recaptcha';

const PROTECTED_PATHS = ['/dashboard', '/labels', '/settings'];
const CAPTCHA_AUTH_PATHS = new Set(['/api/auth/sign-in/email', '/api/auth/sign-up/email']);

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
    const captchaRequest = await verifyAuthCaptcha(event);

    if (captchaRequest instanceof Response) {
      return captchaRequest;
    }

    return auth.handler(captchaRequest ?? event.request);
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

async function verifyAuthCaptcha(event) {
  if (event.request.method !== 'POST' || !CAPTCHA_AUTH_PATHS.has(event.url.pathname)) {
    return null;
  }

  let body;

  try {
    body = await event.request.json();
  } catch {
    return jsonBadRequest('Invalid authentication request.');
  }

  const { captchaToken, ...authBody } = body;
  const result = await verifyRecaptchaToken(captchaToken, event.getClientAddress?.());

  if (!result.success) {
    return new Response(JSON.stringify({ message: result.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const headers = new Headers(event.request.headers);
  headers.delete('content-length');

  return new Request(event.request.url, {
    method: event.request.method,
    headers,
    body: JSON.stringify(authBody)
  });
}

function jsonBadRequest(message) {
  return new Response(JSON.stringify({ success: false, message }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

function jsonUnauthorized() {
  return new Response(JSON.stringify({ success: false, message: 'Authentication required' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}
