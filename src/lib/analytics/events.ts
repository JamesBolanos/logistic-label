export const productEventNames = [
  'sign_up',
  'login',
  'company_settings_saved',
  'label_preview_succeeded',
  'label_saved',
  'pdf_response_succeeded',
  'pdf_download_started',
  'workflow_failed',
  'custom_contact_clicked',
  'release_update_viewed',
  'release_cta_clicked'
] as const;

export type ProductEventName = (typeof productEventNames)[number];

export const workflowSteps = [
  'sign_up',
  'login',
  'settings_save',
  'label_preview',
  'label_save',
  'pdf_response',
  'pdf_download'
] as const;

export const failureCategories = [
  'authentication',
  'validation',
  'settings_required',
  'not_found',
  'rate_limited',
  'network',
  'generation',
  'database',
  'unexpected'
] as const;

export type WorkflowStep = (typeof workflowSteps)[number];
export type FailureCategory = (typeof failureCategories)[number];

type AnalyticsValue = string | number | boolean;
type AnalyticsParameters = Record<string, AnalyticsValue>;

const allowedParameters: Record<ProductEventName, readonly string[]> = {
  sign_up: ['method'],
  login: ['method'],
  company_settings_saved: ['setup_type'],
  label_preview_succeeded: ['label_type', 'label_size', 'template_version', 'duration_ms'],
  label_saved: ['label_type', 'label_size', 'template_version', 'duration_ms'],
  pdf_response_succeeded: ['format', 'source', 'duration_ms'],
  pdf_download_started: ['format', 'source'],
  workflow_failed: ['step', 'error_category', 'duration_ms'],
  custom_contact_clicked: ['placement'],
  release_update_viewed: ['release_id', 'change_category', 'feature_key'],
  release_cta_clicked: ['release_id', 'feature_key']
};

const controlledValues: Record<string, ReadonlySet<string>> = {
  method: new Set(['email', 'google', 'unknown']),
  setup_type: new Set(['first_setup', 'update']),
  label_type: new Set(['homogeneous_unit']),
  label_size: new Set(['4x6']),
  template_version: new Set(['v1']),
  format: new Set(['pdf']),
  source: new Set(['new_label', 'history']),
  step: new Set(workflowSteps),
  error_category: new Set(failureCategories),
  placement: new Set(['dashboard']),
  change_category: new Set(['fix', 'improvement', 'new_feature'])
};

const identifierParameters = new Set(['release_id', 'feature_key']);
const SAFE_IDENTIFIER = /^[a-z0-9][a-z0-9_-]{0,79}$/;

export function isProductEventName(value: unknown): value is ProductEventName {
  return typeof value === 'string' && productEventNames.includes(value as ProductEventName);
}

export function sanitizeAnalyticsParameters(
  eventName: ProductEventName,
  parameters: Record<string, unknown> = {}
): AnalyticsParameters {
  const sanitized: AnalyticsParameters = {};

  for (const key of allowedParameters[eventName]) {
    const value = parameters[key];

    if (key === 'duration_ms') {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        sanitized[key] = Math.round(value);
      }
      continue;
    }

    if (typeof value !== 'string') continue;

    if (identifierParameters.has(key)) {
      if (SAFE_IDENTIFIER.test(value)) sanitized[key] = value;
      continue;
    }

    const values = controlledValues[key];
    if (values?.has(value)) sanitized[key] = value;
  }

  return sanitized;
}

export function classifyHttpFailure(status: number): FailureCategory {
  if (status === 400 || status === 422) return 'validation';
  if (status === 401 || status === 403) return 'authentication';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'unexpected';
  return 'unexpected';
}

export function resolveAuthMethod(path: string | undefined): 'email' | 'google' | 'unknown' {
  if (!path) return 'unknown';
  if (path === '/sign-in/email' || path === '/sign-up/email') return 'email';
  if (path === '/callback/google' || path.endsWith('/google')) return 'google';
  return 'unknown';
}
