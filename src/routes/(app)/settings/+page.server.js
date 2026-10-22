import { redirect, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { labelSettingsSchema } from '#lib/validation/schemas.js';
import { getLabelSettings, upsertLabelSettings } from '#lib/server/db/settings.js';

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

  try {
    const stored = await getLabelSettings(locals.user.id);
    settings = {
      company_name: stored.company_name || 'Company Name',
      gs1_company_prefix: stored.gs1_company_prefix || '',
      extension_digit: stored.extension_digit || '0',
      next_serial_reference: stored.next_serial_reference || 1
    };
  } catch (error) {
    console.error('Failed to load label settings:', error);
  }

  const form = await superValidate(settings, zod(labelSettingsSchema));
  return { form, user: locals.user };
}

export const actions = {
  saveSettings: async ({ request, locals }) => {
    if (!locals.user) {
      redirect(302, '/login');
    }

    const form = await superValidate(request, zod(labelSettingsSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const settings = await upsertLabelSettings(locals.user.id, {
        company_name: form.data.company_name,
        gs1_company_prefix: form.data.gs1_company_prefix || null,
        extension_digit: form.data.extension_digit,
        next_serial_reference: form.data.next_serial_reference
      });
      return { form, settings, success: true };
    } catch (error) {
      console.error('Failed to save label settings:', error);
      return fail(500, { form, message: 'Failed to save settings' });
    }
  }
};

