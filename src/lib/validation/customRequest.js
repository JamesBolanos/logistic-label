export const CUSTOM_REQUEST_TYPES = Object.freeze({
  IMPROVEMENT: 'improvement',
  TAILORED_PROJECT: 'tailored_project'
});

export const CUSTOM_REQUEST_TOPICS = Object.freeze({
  GENERAL: 'general',
  ROUTING_GUIDE: 'routing_guide',
  LABEL_FORMAT: 'label_format',
  PRINTER_WORKFLOW: 'printer_workflow',
  INTEGRATION: 'integration',
  OTHER: 'other'
});

/** @type {Set<string>} */
const REQUEST_TYPE_VALUES = new Set(Object.values(CUSTOM_REQUEST_TYPES));
/** @type {Set<string>} */
const TOPIC_VALUES = new Set(Object.values(CUSTOM_REQUEST_TOPICS));
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** @typedef {'improvement' | 'tailored_project'} RequestType */
/** @typedef {'general' | 'routing_guide' | 'label_format' | 'printer_workflow' | 'integration' | 'other'} RequestTopic */
/** @typedef {{ requestType: string, topic: string, name: string, email: string, company: string, message: string, website: string }} NormalizedRequest */
/** @typedef {{ requestType: RequestType, topic: RequestTopic, name: string, email: string, company: string, message: string, website: string }} ValidRequest */

/**
 * @param {Record<string, unknown>} values
 * @returns {{ valid: true, errors: {}, values: ValidRequest } | { valid: false, errors: Record<string, string>, values: NormalizedRequest }}
 */
export function validateCustomRequest(values) {
  const normalized = {
    requestType: stringValue(values.requestType),
    topic: stringValue(values.topic),
    name: stringValue(values.name),
    email: stringValue(values.email),
    company: stringValue(values.company),
    message: stringValue(values.message),
    website: stringValue(values.website)
  };
  /** @type {Record<string, string>} */
  const errors = {};

  if (!REQUEST_TYPE_VALUES.has(normalized.requestType)) {
    errors.requestType = 'Choose a request type.';
  }
  if (!TOPIC_VALUES.has(normalized.topic)) {
    errors.topic = 'Choose the topic that best fits your request.';
  }
  if (normalized.name.length > 120) {
    errors.name = 'Name must be 120 characters or fewer.';
  }
  if (
    normalized.email.length > 254 ||
    /[\r\n]/.test(normalized.email) ||
    !EMAIL_PATTERN.test(normalized.email)
  ) {
    errors.email = 'Enter a valid email address so I can reply.';
  }
  if (normalized.company.length > 160) {
    errors.company = 'Company name must be 160 characters or fewer.';
  }
  if (normalized.message.length < 10 || normalized.message.length > 2000) {
    errors.message = 'Describe your request in 10 to 2,000 characters.';
  }

  if (
    Object.keys(errors).length === 0 &&
    isRequestType(normalized.requestType) &&
    isRequestTopic(normalized.topic)
  ) {
    return {
      valid: true,
      errors: {},
      values: {
        ...normalized,
        requestType: normalized.requestType,
        topic: normalized.topic
      }
    };
  }

  return { valid: false, errors, values: normalized };
}

/** @param {string} value @returns {value is RequestType} */
function isRequestType(value) {
  return REQUEST_TYPE_VALUES.has(value);
}

/** @param {string} value @returns {value is RequestTopic} */
function isRequestTopic(value) {
  return TOPIC_VALUES.has(value);
}

/** @param {unknown} value */
function stringValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}
