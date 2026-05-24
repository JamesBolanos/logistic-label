// src/hooks.server.js
import { redirect } from '@sveltejs/kit';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  // Set security headers
  const response = await resolve(event);

  // Security headers that must be set via HTTP headers, not meta tags
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'no-referrer-when-downgrade');

  // Note: X-XSS-Protection is deprecated and not needed in modern browsers

  return response;
}