import { json } from '@sveltejs/kit';
import { getLabelStats } from '$lib/server/db/labels';

export async function GET({ locals }) {
  const user = locals.user;

  if (!user) {
    return json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  try {
    const dashboard = await getLabelStats(user.id);

    return json({
      success: true,
      ...dashboard
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
