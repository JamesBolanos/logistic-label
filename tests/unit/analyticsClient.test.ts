import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  initializeAnalytics,
  observeReleaseUpdate,
  trackPageView,
  trackProductEvent
} from '../../src/lib/analytics/client.js';

describe('browser analytics lifecycle', () => {
  afterEach(() => {
    initializeAnalytics(null);
    vi.unstubAllGlobals();
  });

  it('starts a release observer when analytics initializes after the page content', () => {
    const gtag = vi.fn();
    const sessionValues = new Map<string, string>();
    let intersectionCallback: IntersectionObserverCallback | null = null;
    const disconnect = vi.fn();
    const observe = vi.fn();

    class TestIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        intersectionCallback = callback;
      }

      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
      takeRecords = vi.fn(() => []);
      root = null;
      rootMargin = '0px';
      thresholds = [0.5];
    }

    const browserWindow: Record<string, unknown> = {
      dataLayer: [],
      gtag,
      location: { origin: 'https://sscc-labels.com' },
      sessionStorage: {
        getItem: (key: string) => sessionValues.get(key) || null,
        setItem: (key: string, value: string) => sessionValues.set(key, value)
      },
      IntersectionObserver: TestIntersectionObserver
    };

    vi.stubGlobal('window', browserWindow);
    vi.stubGlobal('document', {
      querySelector: vi.fn(() => ({})),
      title: 'SSCC Labels'
    });
    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);

    const action = observeReleaseUpdate({} as HTMLElement, {
      id: '2026-09-28-test-release',
      category: 'improvement',
      featureKey: 'test_release'
    });

    expect(observe).not.toHaveBeenCalled();
    expect(initializeAnalytics('G-DELAY1')).toBe(true);
    expect(observe).toHaveBeenCalledOnce();

    const callback = intersectionCallback as IntersectionObserverCallback | null;
    expect(callback).not.toBeNull();
    callback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(gtag).toHaveBeenCalledWith('event', 'release_update_viewed', {
      release_id: '2026-09-28-test-release',
      change_category: 'improvement',
      feature_key: 'test_release'
    });
    expect(sessionValues.get('release-update-viewed:2026-09-28-test-release')).toBe('true');
    expect(disconnect).toHaveBeenCalledOnce();

    action.destroy();
  });

  it('starts a queued release observer when the same analytics property is re-enabled', () => {
    const gtag = vi.fn();
    const observe = vi.fn();

    class TestIntersectionObserver {
      observe = observe;
      disconnect = vi.fn();
      unobserve = vi.fn();
      takeRecords = vi.fn(() => []);
      root = null;
      rootMargin = '0px';
      thresholds = [0.5];
    }

    const browserWindow: Record<string, unknown> = {
      dataLayer: [],
      gtag,
      location: { origin: 'https://sscc-labels.com' },
      sessionStorage: {
        getItem: () => null,
        setItem: vi.fn()
      },
      IntersectionObserver: TestIntersectionObserver
    };

    vi.stubGlobal('window', browserWindow);
    vi.stubGlobal('document', {
      querySelector: vi.fn(() => ({})),
      title: 'SSCC Labels'
    });
    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);

    expect(initializeAnalytics('G-REENABLE1')).toBe(true);
    expect(initializeAnalytics(null)).toBe(false);

    const action = observeReleaseUpdate({} as HTMLElement, {
      id: '2026-09-28-reenabled-release',
      category: 'fix',
      featureKey: 'reenabled_release'
    });

    expect(observe).not.toHaveBeenCalled();
    expect(initializeAnalytics('G-REENABLE1')).toBe(true);
    expect(observe).toHaveBeenCalledOnce();

    action.destroy();
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

    expect(initializeAnalytics('G-LIFECYCLE1')).toBe(true);
    expect(browserWindow['ga-disable-G-LIFECYCLE1']).toBe(false);
    expect(trackPageView('/labels', 'Labels')).toBe(true);
    expect(trackProductEvent('custom_contact_clicked', { placement: 'home_hero' })).toBe(true);

    const callsBeforeDisable = gtag.mock.calls.length;

    expect(initializeAnalytics(null)).toBe(false);
    expect(browserWindow['ga-disable-G-LIFECYCLE1']).toBe(true);
    expect(trackPageView('/dashboard', 'Dashboard')).toBe(false);
    expect(trackProductEvent('custom_contact_clicked', { placement: 'home_cta' })).toBe(false);
    expect(gtag).toHaveBeenCalledTimes(callsBeforeDisable);

    expect(initializeAnalytics('G-LIFECYCLE1')).toBe(true);
    expect(browserWindow['ga-disable-G-LIFECYCLE1']).toBe(false);
    expect(trackPageView('/', 'SSCC Labels')).toBe(true);
  });
});
