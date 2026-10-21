import { ANALYTICS_OWNER_USER_IDS } from '$app/env/private';
import { isConfiguredAnalyticsOwner, parseAnalyticsUserIds } from '#lib/analytics/access.ts';

export function isAnalyticsOwner(userId) {
  return isConfiguredAnalyticsOwner(userId, ANALYTICS_OWNER_USER_IDS);
}

export function getAnalyticsOwnerUserIds() {
  return parseAnalyticsUserIds(ANALYTICS_OWNER_USER_IDS);
}
