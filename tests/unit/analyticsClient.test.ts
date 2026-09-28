import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  initializeAnalytics,
  trackPageView,
  trackProductEvent
} from '../../src/lib/analytics/client.js';

describe('browser analytics lifecycle', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stops sending events when analytics becomes unavailable for the current user', () => {
    const gtag = vi.fn();
    const browserWindow: Record<string, unknown> = {
      dataLayer: [],
      gtag,
      location: { origin: 'https://sscc-labels.com' }
    };

    vi.stubGlobal('window', browserWindow);
    vi.stubGlobal('document', {
      querySelector: vi.fn(() => ({})),
      title: 'SSCC Labels'
    });

    expect(initializeAnalytics('G-TEST123')).toBe(true);
    expect(browserWindow['ga-disable-G-TEST123']).toBe(false);
    expect(trackPageView('/labels', 'Labels')).toBe(true);
    expect(trackProductEvent('custom_contact_clicked', { placement: 'home_hero' })).toBe(true);

    const callsBeforeDisable = gtag.mock.calls.length;

    expect(initializeAnalytics(null)).toBe(false);
    expect(browserWindow['ga-disable-G-TEST123']).toBe(true);
    expect(trackPageView('/dashboard', 'Dashboard')).toBe(false);
    expect(trackProductEvent('custom_contact_clicked', { placement: 'home_cta' })).toBe(false);
    expect(gtag).toHaveBeenCalledTimes(callsBeforeDisable);

    expect(initializeAnalytics('G-TEST123')).toBe(true);
    expect(browserWindow['ga-disable-G-TEST123']).toBe(false);
    expect(trackPageView('/', 'SSCC Labels')).toBe(true);
  });
});
