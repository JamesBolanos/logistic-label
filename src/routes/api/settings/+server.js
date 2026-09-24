import { json } from '@sveltejs/kit';
import { getLabelSettings, upsertLabelSettings } from '$lib/server/db/settings';
import {
  durationSince,
  getOperationId,
  recordOperationalEvent
} from '$lib/server/analytics/operationalEvents.js';

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
  const startedAt = Date.now();
  const operationId = getOperationId(request);
  const user = locals.user;
  if (!user) {
    return json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const previousSettings = await getLabelSettings(user.id);
    const setupType = previousSettings.is_configured ? 'update' : 'first_setup';
    const settings = await upsertLabelSettings(user.id, payload);

    await recordOperationalEvent({
      eventName: 'company_settings_saved',
      userId: user.id,
      operationId,
      setupType,
      durationMs: durationSince(startedAt)
    });

    return json({ success: true, settings, setupType });
  } catch (error) {
    if (error.validation) {
      await recordOperationalEvent({
        eventName: 'workflow_failed',
        userId: user.id,
        operationId,
        workflowStep: 'settings_save',
        errorCategory: 'validation',
        durationMs: durationSince(startedAt)
      });

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
    await recordOperationalEvent({
      eventName: 'workflow_failed',
      userId: user.id,
      operationId,
      workflowStep: 'settings_save',
      errorCategory: 'database',
      durationMs: durationSince(startedAt)
    });
    return json({ success: false, message: 'Failed to save settings' }, { status: 500 });
  }
}
