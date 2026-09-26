import { error } from '@sveltejs/kit';
import { resolveReportingDays } from '$lib/analytics/statistics.js';
import { isAnalyticsOwner } from '$lib/server/analytics/access.js';
import { getOwnerStatistics } from '$lib/server/analytics/statistics.js';

export async function load({ locals, setHeaders, url }) {
  if (!locals.user || !isAnalyticsOwner(locals.user.id)) {
    error(403, 'Owner access is required.');
  }

  setHeaders({
    'cache-control': 'private, no-store'
  });

  const days = resolveReportingDays(url.searchParams.get('days'));

  try {
    return {
      statistics: await getOwnerStatistics(days)
    };
  } catch (cause) {
    console.error('Owner statistics error:', cause);
    error(503, 'Usage statistics are temporarily unavailable.');
  }
}
