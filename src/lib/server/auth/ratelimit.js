// src/lib/server/auth/ratelimit.js
import { json } from '@sveltejs/kit';

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;
const buckets = new Map();

function isLimited(request) {
  const key = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown';
  const now = Date.now();
  const bucket = buckets.get(key) || [];
  const recent = bucket.filter((timestamp) => now - timestamp < WINDOW_MS);
  recent.push(now);
  buckets.set(key, recent);
  return recent.length > MAX_REQUESTS;
}

export function authRateLimiter(request) {
  if (isLimited(request)) {
    return json({ success: false, message: 'Too many requests' }, { status: 429 });
  }
  return null;
}

export function pdfRateLimiter(request) {
  if (isLimited(request)) {
    return json({ success: false, message: 'Too many requests' }, { status: 429 });
  }
  return null;
}

export default { authRateLimiter, pdfRateLimiter };
