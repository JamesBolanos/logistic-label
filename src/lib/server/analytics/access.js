import { env } from '$env/dynamic/private';
import { combineAnalyticsUserIds, isConfiguredAnalyticsOwner } from '$lib/analytics/access.js';

export function isAnalyticsOwner(userId) {
  return isConfiguredAnalyticsOwner(userId, env.ANALYTICS_OWNER_USER_IDS);
}

export function isAnalyticsExcluded(userId) {
  return Boolean(userId && getAnalyticsExcludedUserIds().includes(userId));
}

export function getAnalyticsOwnerUserIds() {
  return combineAnalyticsUserIds(env.ANALYTICS_OWNER_USER_IDS);
}

export function getAnalyticsExcludedUserIds() {
  return combineAnalyticsUserIds(env.ANALYTICS_OWNER_USER_IDS, env.ANALYTICS_EXCLUDED_USER_IDS);
}
