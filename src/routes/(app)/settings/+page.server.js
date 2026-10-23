import { redirect, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { labelSettingsSchema } from '#lib/validation/schemas.js';
import { getLabelSettings, upsertLabelSettings } from '#lib/server/db/settings.js';
import {
  durationSince,
  getOperationId,
  recordOperationalEvent
} from '#lib/server/analytics/operationalEvents.js';

export async function load({ locals }) {
  if (!locals.user) {
    redirect(302, '/login');
  }

  let settings = {
    company_name: 'Company Name',
    gs1_company_prefix: '',
    extension_digit: '0',
    next_serial_reference: 1
  };
  let isConfigured = false;

  try {
    const stored = await getLabelSettings(locals.user.id);
    settings = {
      company_name: stored.company_name || 'Company Name',
      gs1_company_prefix: stored.gs1_company_prefix || '',
      extension_digit: stored.extension_digit || '0',
      next_serial_reference: stored.next_serial_reference || 1
    };
    isConfigured = Boolean(stored.is_configured);
  } catch (error) {
    console.error('Failed to load label settings:', error);
  }

  const form = await superValidate(settings, zod4(labelSettingsSchema));
  return { form, user: locals.user, isConfigured };
}

export const actions = {
  saveSettings: async ({ request, locals }) => {
    if (!locals.user) {
      redirect(302, '/login');
    }

    const startedAt = Date.now();
    const operationId = getOperationId(request);

    const form = await superValidate(request, zod4(labelSettingsSchema));
    if (!form.valid) {
      await recordOperationalEvent({
        eventName: 'workflow_failed',
        userId: locals.user.id,
        operationId,
        workflowStep: 'settings_save',
        errorCategory: 'validation',
        durationMs: durationSince(startedAt)
      });
      return fail(400, { form });
    }

    try {
      const previousSettings = await getLabelSettings(locals.user.id);
      const setupType = previousSettings.is_configured ? 'update' : 'first_setup';

      const settings = await upsertLabelSettings(locals.user.id, {
        company_name: form.data.company_name,
        gs1_company_prefix: form.data.gs1_company_prefix || null,
        extension_digit: form.data.extension_digit,
        next_serial_reference: form.data.next_serial_reference
      });

      await recordOperationalEvent({
        eventName: 'company_settings_saved',
        userId: locals.user.id,
        operationId,
        setupType,
        durationMs: durationSince(startedAt)
      });

      return { form, settings, setupType, success: true };
    } catch (error) {
      console.error('Failed to save label settings:', error);
      await recordOperationalEvent({
        eventName: 'workflow_failed',
        userId: locals.user.id,
        operationId,
        workflowStep: 'settings_save',
        errorCategory: 'database',
        durationMs: durationSince(startedAt)
      });
      return fail(500, { form, message: 'Failed to save settings' });
    }
  }
};
