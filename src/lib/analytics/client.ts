import { sanitizeAnalyticsParameters, type ProductEventName } from '$lib/analytics/events.js';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let analyticsEnabled = false;
let configuredMeasurementId: string | null = null;

export function initializeAnalytics(measurementId: string | null | undefined): boolean {
  if (typeof window === 'undefined' || !isMeasurementId(measurementId)) return false;

  analyticsEnabled = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      // Google gtag queues its array-like arguments object as one command.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };

  if (configuredMeasurementId === measurementId) return true;
  configuredMeasurementId = measurementId;

  if (!document.querySelector('script[data-google-analytics]')) {
    const script = document.createElement('script');
    script.async = true;
    script.dataset.googleAnalytics = 'true';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }

  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });
  return true;
}

export function trackPageView(pathname: string, title: string): boolean {
  if (!analyticsEnabled || !window.gtag || !pathname.startsWith('/')) return false;

  window.gtag('event', 'page_view', {
    page_location: `${window.location.origin}${pathname}`,
    page_path: pathname,
    page_title: title
  });
  return true;
}

export function trackProductEvent(
  eventName: ProductEventName,
  parameters: Record<string, unknown> = {}
): boolean {
  if (!analyticsEnabled || !window.gtag) return false;

  window.gtag('event', eventName, sanitizeAnalyticsParameters(eventName, parameters));
  return true;
}

export function createOperationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function observeReleaseUpdate(
  node: HTMLElement,
  update: { id: string; category: string; featureKey: string }
): { destroy: () => void } {
  if (!analyticsEnabled || typeof window === 'undefined') return { destroy() {} };

  const storageKey = `release-update-viewed:${update.id}`;
  let recorded = readSessionFlag(storageKey);

  const recordView = () => {
    if (recorded) return;

    const sent = trackProductEvent('release_update_viewed', {
      release_id: update.id,
      change_category: update.category.replace(' ', '_'),
      feature_key: update.featureKey
    });

    if (sent) {
      recorded = true;
      writeSessionFlag(storageKey);
    }
  };

  if (!('IntersectionObserver' in window)) {
    recordView();
    return { destroy() {} };
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        recordView();
        observer.disconnect();
      }
    },
    { threshold: 0.5 }
  );

  observer.observe(node);
  return { destroy: () => observer.disconnect() };
}

function isMeasurementId(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^G-[A-Z0-9]+$/.test(value);
}

function readSessionFlag(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function writeSessionFlag(key: string): void {
  try {
    window.sessionStorage.setItem(key, 'true');
  } catch {
    // Storage can be unavailable in privacy-restricted browsers. Tracking still remains optional.
  }
}
