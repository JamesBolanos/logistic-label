import { json } from '@sveltejs/kit';
import { getLabelStats } from '$lib/server/db/labels';
import { getLabelSettings } from '$lib/server/db/settings';
import { hasOperationalEvent } from '$lib/server/analytics/operationalEvents.js';
import { buildOnboardingProgress } from '$lib/onboarding/progress.js';

export async function GET({ locals }) {
  const user = locals.user;

  if (!user) {
    return json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  try {
    const [dashboard, settings, previewCompleted] = await Promise.all([
      getLabelStats(user.id),
      getLabelSettings(user.id),
      hasOperationalEvent(user.id, 'label_preview_succeeded')
    ]);
    const onboarding = buildOnboardingProgress({
      settingsConfigured: settings.is_configured,
      previewCompleted,
      totalLabels: dashboard.stats.totalLabels
    });

    return json({
      success: true,
      ...dashboard,
      onboarding
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);

    return json(
      {
        success: false,
        message: 'Failed to fetch dashboard data. Please try again.'
      },
      { status: 500 }
    );
  }
}
