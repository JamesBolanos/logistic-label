// src/routes/+layout.js
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

// Pages that don't require authentication
const publicPages = ['/', '/login', '/signup', '/reset-password', '/privacy'];

function getCookie(name) {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];
}

export const load = async ({ url }) => {
  // Skip auth check on the server
  if (!browser) return {};

  const path = url.pathname;

  // Allow public pages through
  const isPublicPage = publicPages.some((page) => path === page || path.startsWith(page + '/'));
  if (isPublicPage) return {};

  // Check auth via cookie set by the API
  const token = getCookie('authToken');
  if (!token) {
    goto(`/login?returnUrl=${encodeURIComponent(path)}`);
    return {};
  }

  // Auth present; let the page load
  return {};
};