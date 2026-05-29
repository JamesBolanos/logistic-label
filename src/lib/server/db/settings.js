import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { labelSettings, logisticLabel } from '$lib/server/db/schema.js';
import { generateSSCC, validateGS1CompanyPrefix } from '$lib/utils/gs1Utils';

export async function getLabelSettings(userId) {
  ensureDatabase();

  const [settings] = await db.select().from(labelSettings).where(eq(labelSettings.userId, userId)).limit(1);
  return settings ? toApiSettings(settings) : getDefaultSettings(userId);
}

export async function upsertLabelSettings(userId, data) {
  ensureDatabase();

  const sanitized = sanitizeSettings(data);
  const validation = validateLabelSettings(sanitized);

  if (!validation.isValid) {
    const error = new Error('Invalid label settings');
    error.validation = validation;
    throw error;
  }

  const [settings] = await db
    .insert(labelSettings)
    .values({
      userId,
      companyName: sanitized.company_name,
      gs1CompanyPrefix: sanitized.gs1_company_prefix,
      extensionDigit: sanitized.extension_digit,
      nextSerialReference: sanitized.next_serial_reference,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: labelSettings.userId,
      set: {
        companyName: sanitized.company_name,
        gs1CompanyPrefix: sanitized.gs1_company_prefix,
        extensionDigit: sanitized.extension_digit,
        nextSerialReference: sanitized.next_serial_reference,
        updatedAt: new Date()
      }
    })
    .returning();

  return toApiSettings(settings);
}

export async function allocateSSCC(userId) {
  ensureDatabase();

  const settings = await getExistingSettings(userId);

  if (!settings?.gs1CompanyPrefix) {
    const error = new Error('Configure your GS1 Company Prefix before generating labels.');
    error.code = 'LABEL_SETTINGS_REQUIRED';
    throw error;
  }

  let serialReference = settings.nextSerialReference;
  let sscc = null;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = generateSSCC({
      gs1CompanyPrefix: settings.gs1CompanyPrefix,
      serialReference,
      extensionDigit: settings.extensionDigit
    });

    const [existing] = await db
      .select({ id: logisticLabel.id })
      .from(logisticLabel)
      .where(eq(logisticLabel.sscc, candidate))
      .limit(1);

    if (!existing) {
      sscc = candidate;
      break;
    }

    serialReference += 1;
  }

  if (!sscc) {
    throw new Error('Unable to allocate an unused SSCC. Increase the next serial reference in Settings.');
  }

  await db
    .update(labelSettings)
    .set({
      nextSerialReference: serialReference + 1,
      updatedAt: new Date()
    })
    .where(eq(labelSettings.userId, userId));

  return sscc;
}

export function sanitizeSettings(data) {
  return {
    company_name: String(data?.company_name || '').trim() || 'Company Name',
    gs1_company_prefix: String(data?.gs1_company_prefix || '').replace(/\D/g, ''),
    extension_digit: String(data?.extension_digit ?? '0').replace(/\D/g, '').slice(0, 1) || '0',
    next_serial_reference: Math.max(1, Number.parseInt(data?.next_serial_reference || 1, 10) || 1)
  };
}

export function validateLabelSettings(settings) {
  const errors = {};

  if (!settings.company_name) {
    errors.company_name = 'Company name is required';
  }

  if (!settings.gs1_company_prefix) {
    errors.gs1_company_prefix = 'GS1 Company Prefix is required';
  } else if (!validateGS1CompanyPrefix(settings.gs1_company_prefix)) {
    errors.gs1_company_prefix = 'GS1 Company Prefix must be 4 to 12 digits';
  }

  if (!/^\d$/.test(settings.extension_digit)) {
    errors.extension_digit = 'Extension digit must be a single digit';
  }

  const serialDigits = 16 - settings.gs1_company_prefix.length;
  const maxSerial = 10 ** serialDigits - 1;

  if (!Number.isInteger(settings.next_serial_reference) || settings.next_serial_reference < 1) {
    errors.next_serial_reference = 'Next serial reference must be a positive number';
  } else if (settings.next_serial_reference > maxSerial) {
    errors.next_serial_reference = `Next serial reference must be ${maxSerial} or lower for this prefix length`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

async function getExistingSettings(userId) {
  const [settings] = await db.select().from(labelSettings).where(eq(labelSettings.userId, userId)).limit(1);
  return settings || null;
}

function getDefaultSettings(userId) {
  return {
    user_id: userId,
    company_name: 'Company Name',
    gs1_company_prefix: '',
    extension_digit: '0',
    next_serial_reference: 1,
    is_configured: false
  };
}

function toApiSettings(settings) {
  return {
    user_id: settings.userId,
    company_name: settings.companyName,
    gs1_company_prefix: settings.gs1CompanyPrefix || '',
    extension_digit: settings.extensionDigit,
    next_serial_reference: settings.nextSerialReference,
    is_configured: Boolean(settings.gs1CompanyPrefix),
    created_at: settings.createdAt?.toISOString?.() || settings.createdAt,
    updated_at: settings.updatedAt?.toISOString?.() || settings.updatedAt
  };
}

function ensureDatabase() {
  if (!db) {
    throw new Error('Database is not configured. Set LOGISTIC_LABEL_DATABASE_URL.');
  }
}
