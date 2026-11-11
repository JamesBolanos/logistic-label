// src/lib/server/auth/ratelimit.js
import { json } from '@sveltejs/kit';

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;
/** @type {Map<string, number[]>} */
const buckets = new Map();
const CUSTOM_REQUEST_WINDOW_MS = 15 * 60 * 1000;
const CUSTOM_REQUEST_MAX = 3;
/** @type {Map<string, number[]>} */
const customRequestBuckets = new Map();

/** @param {Request} request */
function isLimited(request) {
  const key =
    request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown';
  const now = Date.now();
  const bucket = buckets.get(key) || [];
  const recent = bucket.filter((timestamp) => now - timestamp < WINDOW_MS);
  recent.push(now);
  buckets.set(key, recent);
  return recent.length > MAX_REQUESTS;
}

/** @param {Request} request */
export function authRateLimiter(request) {
  if (isLimited(request)) {
    return json({ success: false, message: 'Too many requests' }, { status: 429 });
  }
  return null;
}

/** @param {Request} request */
export function pdfRateLimiter(request) {
  if (isLimited(request)) {
    return json({ success: false, message: 'Too many requests' }, { status: 429 });
  }
  return null;
}

/**
 * @param {string} clientAddress
 * @param {number} [now]
 */
export function isCustomRequestRateLimited(clientAddress, now = Date.now()) {
  const key = clientAddress || 'unknown';

  for (const [address, timestamps] of customRequestBuckets) {
    if (timestamps.every((timestamp) => now - timestamp >= CUSTOM_REQUEST_WINDOW_MS)) {
      customRequestBuckets.delete(address);
    }
  }

  const recent = (customRequestBuckets.get(key) || []).filter(
    (timestamp) => now - timestamp < CUSTOM_REQUEST_WINDOW_MS
  );

  if (recent.length >= CUSTOM_REQUEST_MAX) {
    customRequestBuckets.set(key, recent);
    return true;
  }

  recent.push(now);
  customRequestBuckets.set(key, recent);

  if (customRequestBuckets.size > 10_000) {
    const oldestAddress = customRequestBuckets.keys().next().value;
    if (oldestAddress !== undefined) customRequestBuckets.delete(oldestAddress);
  }

  return false;
}

export default { authRateLimiter, pdfRateLimiter };
