import { describe, expect, it } from 'vitest';
import { paraglideMiddleware } from '../../src/lib/paraglide/server.js';

/** @param {Request} request */
async function resolveLocale(request) {
  return paraglideMiddleware(
    request,
    ({ locale, request: localizedRequest }) =>
      new Response(`${locale}:${new URL(localizedRequest.url).pathname}`),
    { redirect: 'navigation' }
  );
}

describe('locale routing', () => {
  it('redirects Spanish browser preferences to the equivalent /es route', async () => {
    const response = await resolveLocale(
      new Request('https://example.test/guide?source=home', {
        headers: {
          Accept: 'text/html',
          'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
          'Sec-Fetch-Dest': 'document'
        }
      })
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe('https://example.test/es/guide?source=home');
  });

  it('gives an explicit language cookie precedence over Accept-Language', async () => {
    const response = await resolveLocale(
      new Request('https://example.test/guide', {
        headers: {
          Accept: 'text/html',
          'Accept-Language': 'es-AR,es;q=0.9',
          Cookie: 'sscc-labels-locale=en',
          'Sec-Fetch-Dest': 'document'
        }
      })
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('en:/guide');
  });

  it('gives an explicit /es URL precedence over a different saved preference', async () => {
    const response = await resolveLocale(
      new Request('https://example.test/es/guide', {
        headers: {
          Accept: 'text/html',
          'Accept-Language': 'en',
          Cookie: 'sscc-labels-locale=en',
          'Sec-Fetch-Dest': 'document'
        }
      })
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('es:/guide');
  });
});
