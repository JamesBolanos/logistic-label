import { env } from '$env/dynamic/private';
import { isConfiguredAnalyticsOwner, parseAnalyticsUserIds } from '$lib/analytics/access.js';

export function isAnalyticsOwner(userId) {
  return isConfiguredAnalyticsOwner(userId, env.ANALYTICS_OWNER_USER_IDS);
}

export function getAnalyticsOwnerUserIds() {
  return parseAnalyticsUserIds(env.ANALYTICS_OWNER_USER_IDS);
}
