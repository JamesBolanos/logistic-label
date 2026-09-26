import { env } from '$env/dynamic/private';
import {
  isAnalyticsExcluded,
  isAnalyticsOwner
} from '$lib/server/analytics/access.js';

const DEFAULT_GOOGLE_ANALYTICS_ID = 'G-WWFKCEM8Q1';

export async function load({ locals }) {
  const displayName = getDisplayName(locals.user);
  const analyticsOwner = isAnalyticsOwner(locals.user?.id);

  return {
    analyticsMeasurementId: isAnalyticsExcluded(locals.user?.id)
      ? null
      : getAnalyticsMeasurementId(),
    isAnalyticsOwner: analyticsOwner,
    user: locals.user
      ? {
          id: locals.user.id,
          email: locals.user.email,
          name: locals.user.name,
          displayName,
          image: locals.user.image
        }
      : null
  };
}

function getAnalyticsMeasurementId() {
  const deploymentEnvironment = env.VERCEL_ENV || env.APP_ENV;
  if (deploymentEnvironment !== 'production') return null;

  const measurementId = String(env.GOOGLE_ANALYTICS_ID || DEFAULT_GOOGLE_ANALYTICS_ID).trim();
  return /^G-[A-Z0-9]+$/.test(measurementId) ? measurementId : null;
}

function getDisplayName(user) {
  if (!user) return null;

  const name = String(user.name || '').trim();
  const email = String(user.email || '').trim();

  if (name && !isPlaceholderName(name)) {
    return name;
  }

  if (email.includes('@')) {
    return email.split('@')[0];
  }

  return name || 'User';
}

function isPlaceholderName(name) {
  return ['user name', 'username', 'test user'].includes(name.toLowerCase());
}
