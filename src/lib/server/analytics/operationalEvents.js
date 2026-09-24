import { randomUUID } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { operationalEvent } from '$lib/server/db/schema.js';
import { isProductEventName } from '$lib/analytics/events.js';

const OPERATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$/;

export function getOperationId(request) {
  const candidate = request.headers.get('x-operation-id')?.trim();
  return candidate && OPERATION_ID_PATTERN.test(candidate) ? candidate : randomUUID();
}

export async function recordOperationalEvent(input) {
  if (!db || !input?.userId || !isProductEventName(input.eventName)) return false;

  try {
    await db
      .insert(operationalEvent)
      .values({
        userId: input.userId,
        eventName: input.eventName,
        operationId: normalizeOptional(input.operationId, 128),
        authMethod: allow(input.authMethod, ['email', 'google', 'unknown']),
        setupType: allow(input.setupType, ['first_setup', 'update']),
        workflowStep: allow(input.workflowStep, [
          'sign_up',
          'login',
          'settings_save',
          'label_preview',
          'label_save',
          'pdf_response',
          'pdf_download'
        ]),
        errorCategory: allow(input.errorCategory, [
          'authentication',
          'validation',
          'settings_required',
          'not_found',
          'rate_limited',
          'network',
          'generation',
          'database',
          'unexpected'
        ]),
        documentFormat: allow(input.documentFormat, ['pdf']),
        downloadSource: allow(input.downloadSource, ['new_label', 'history']),
        labelType: allow(input.labelType, ['homogeneous_unit']),
        labelSize: allow(input.labelSize, ['4x6']),
        templateVersion: allow(input.templateVersion, ['v1']),
        durationMs: normalizeDuration(input.durationMs),
        isInternal: excludedUserIds().has(input.userId)
      })
      .onConflictDoNothing();

    return true;
  } catch (error) {
    console.error(`Operational event recording failed for ${input.eventName}:`, error);
    return false;
  }
}

export function durationSince(startedAt) {
  return Math.max(0, Date.now() - startedAt);
}

function normalizeOptional(value, maxLength) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function normalizeDuration(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}

function allow(value, allowedValues) {
  return allowedValues.includes(value) ? value : null;
}

function excludedUserIds() {
  return new Set(
    String(env.ANALYTICS_EXCLUDED_USER_IDS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  );
}
