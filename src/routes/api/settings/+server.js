import { json } from '@sveltejs/kit';
import { getLabelSettings, upsertLabelSettings } from '$lib/server/db/settings';

export async function GET({ locals }) {
  const user = locals.user;
  if (!user) {
    return json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  try {
    const settings = await getLabelSettings(user.id);
    return json({ success: true, settings });
  } catch (error) {
    console.error('Settings load error:', error);
    return json({ success: false, message: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST({ request, locals }) {
  const user = locals.user;
  if (!user) {
    return json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const settings = await upsertLabelSettings(user.id, payload);
    return json({ success: true, settings });
  } catch (error) {
    if (error.validation) {
      return json(
        {
          success: false,
          message: 'Invalid label settings',
          errors: error.validation.errors
        },
        { status: 400 }
      );
    }

    console.error('Settings save error:', error);
    return json({ success: false, message: 'Failed to save settings' }, { status: 500 });
  }
}
