import { redirect } from '@sveltejs/kit';

/**
 * Defense-in-depth guard for the authenticated application group. The global
 * hook already redirects these paths, but the layout also protects any future
 * route added under (app)/ that is not listed there yet.
 */
export async function load({ locals, url }) {
  if (!locals.user) {
    redirect(303, `/login?returnUrl=${encodeURIComponent(url.pathname + url.search)}`);
  }

  return {};
}
