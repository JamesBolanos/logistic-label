// src/lib/validation/formValidation.js
import {
  normalizeGTIN,
  validateGTIN,
  validateISODate,
  validateLotNumber
} from '$lib/utils/gs1Utils';
import {
  DEFAULT_PRINT_LAYOUT,
  getTemplateVersionForLabelType,
  isHomogeneousDateAi,
  isPackagingLevel,
  isSupportedPrintLayout,
  isSupportedLabelType,
  isTransportCountType,
  isTransportWeightUnit,
  LABEL_TYPES,
  PRINT_LAYOUTS
} from '$lib/labels/workflows.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_COMPLEXITY_PATTERN = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/**
 * @param {{
 *   label_type?: string,
 *   gtin?: string,
 *   quantity?: string | number,
 *   packaging_level?: string,
 *   print_layout?: string,
 *   lot_number?: string,
 *   date_ai?: string,
 *   date_value?: string,
 *   ship_from?: string,
 *   ship_to?: string,
 *   purchase_order?: string,
 *   carrier?: string,
 *   gross_weight?: string | number,
 *   gross_weight_unit?: string,
 *   transport_count?: string | number,
 *   transport_count_type?: string
 * }} formData
 */
export function validateLabelForm(formData) {
  /** @type {Record<string, string>} */
  const errors = {};

  if (!isSupportedLabelType(formData?.label_type)) {
    errors.label_type = 'Choose a supported label workflow';
    return { isValid: false, errors };
  }

  const printLayout = formData.print_layout || DEFAULT_PRINT_LAYOUT;
  if (!isSupportedPrintLayout(printLayout)) {
    errors.print_layout = 'Choose a supported print layout';
  }

  if (formData.label_type === LABEL_TYPES.SSCC_ONLY) {
    validateTransportFields(formData, errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  }

  if (printLayout !== PRINT_LAYOUTS.FOUR_BY_SIX_SINGLE) {
    errors.print_layout = 'The homogeneous workflow currently supports the 4 × 6 layout';
  }

  if (!formData.gtin) {
    errors.gtin = 'Contained trade item GTIN is required';
  } else if (!validateGTIN(formData.gtin)) {
    errors.gtin = 'Enter a valid GTIN-8, GTIN-12, GTIN-13, or GTIN-14';
  }

  if (!isPackagingLevel(formData.packaging_level)) {
    errors.packaging_level = 'Choose what the contained GTIN identifies';
  }

  if (!formData.quantity) {
    errors.quantity = 'Contained trade item count is required';
  } else if (
    !Number.isInteger(Number(formData.quantity)) ||
    Number(formData.quantity) < 1 ||
    Number(formData.quantity) > 9999
  ) {
    errors.quantity = 'Count must be a whole number from 1 to 9,999';
  }

  const lotNumber = String(formData.lot_number || '').trim();
  if (lotNumber && !validateLotNumber(lotNumber)) {
    errors.lot_number =
      'Lot number must contain 1 to 20 GS1-compatible letters, numbers, or symbols';
  }

  const dateAi = String(formData.date_ai || '').trim();
  const dateValue = String(formData.date_value || '').trim();
  if (dateAi && !isHomogeneousDateAi(dateAi)) {
    errors.date_ai = 'Choose a supported GS1 date type';
  } else if (dateAi && !dateValue) {
    errors.date_value = 'Enter the selected date';
  } else if (!dateAi && dateValue) {
    errors.date_ai = 'Choose what this date means';
  } else if (dateValue && !validateISODate(dateValue)) {
    errors.date_value = 'Enter a valid date';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * @param {{
 *   label_type?: string,
 *   gtin?: string,
 *   quantity?: string | number,
 *   packaging_level?: string,
 *   print_layout?: string,
 *   lot_number?: string,
 *   date_ai?: string,
 *   date_value?: string,
 *   ship_from?: string,
 *   ship_to?: string,
 *   purchase_order?: string,
 *   carrier?: string,
 *   gross_weight?: string | number,
 *   gross_weight_unit?: string,
 *   transport_count?: string | number,
 *   transport_count_type?: string
 * }} formData
 */
export function sanitizeLabelForm(formData) {
  const labelType = String(formData?.label_type || '').trim();

  if (labelType === LABEL_TYPES.SSCC_ONLY) {
    return {
      label_type: labelType,
      template_version: getTemplateVersionForLabelType(labelType),
      gtin: null,
      lot_number: null,
      production_date: null,
      date_ai: null,
      date_value: null,
      quantity: null,
      weight_pounds: null,
      packaging_level: null,
      print_layout: String(formData.print_layout || DEFAULT_PRINT_LAYOUT),
      ship_from: normalizeAddress(formData.ship_from),
      ship_to: normalizeAddress(formData.ship_to),
      purchase_order: normalizeSingleLine(formData.purchase_order) || null,
      carrier: normalizeSingleLine(formData.carrier) || null,
      gross_weight: hasValue(formData.gross_weight) ? Number(formData.gross_weight) : null,
      gross_weight_unit: normalizeSingleLine(formData.gross_weight_unit) || null,
      transport_count: hasValue(formData.transport_count) ? Number(formData.transport_count) : null,
      transport_count_type: normalizeSingleLine(formData.transport_count_type) || null
    };
  }

  return {
    label_type: labelType,
    template_version: getTemplateVersionForLabelType(labelType),
    gtin: normalizeGTIN(formData.gtin || ''),
    lot_number: String(formData.lot_number || '').trim() || null,
    production_date: null,
    date_ai: String(formData.date_ai || '').trim() || null,
    date_value: String(formData.date_value || '').trim() || null,
    quantity: Number(formData.quantity),
    weight_pounds: null,
    packaging_level: String(formData.packaging_level || '').trim(),
    print_layout: DEFAULT_PRINT_LAYOUT,
    ship_from: null,
    ship_to: null,
    purchase_order: null,
    carrier: null,
    gross_weight: null,
    gross_weight_unit: null,
    transport_count: null,
    transport_count_type: null
  };
}

/**
 * @param {Record<string, unknown>} formData
 * @param {Record<string, string>} errors
 */
function validateTransportFields(formData, errors) {
  const shipFrom = normalizeAddress(formData.ship_from);
  const shipTo = normalizeAddress(formData.ship_to);
  const purchaseOrder = normalizeSingleLine(formData.purchase_order);
  const carrier = normalizeSingleLine(formData.carrier);

  if (!shipFrom) errors.ship_from = 'Ship From is required';
  else if (shipFrom.length > 160) errors.ship_from = 'Ship From must be 160 characters or fewer';

  if (!shipTo) errors.ship_to = 'Ship To is required';
  else if (shipTo.length > 160) errors.ship_to = 'Ship To must be 160 characters or fewer';

  if (purchaseOrder.length > 50) {
    errors.purchase_order = 'PO Number must be 50 characters or fewer';
  }
  if (carrier.length > 100) errors.carrier = 'Carrier must be 100 characters or fewer';

  const hasWeight = hasValue(formData.gross_weight);
  const weight = Number(formData.gross_weight);
  const weightUnit = normalizeSingleLine(formData.gross_weight_unit);
  if (hasWeight && (!Number.isFinite(weight) || weight <= 0 || weight > 999999.99)) {
    errors.gross_weight = 'Gross Weight must be greater than 0 and no more than 999,999.99';
  }
  if (hasWeight && !isTransportWeightUnit(weightUnit)) {
    errors.gross_weight_unit = 'Choose kg or lb';
  } else if (!hasWeight && weightUnit) {
    errors.gross_weight = 'Enter the Gross Weight for the selected unit';
  }

  const hasCount = hasValue(formData.transport_count);
  const count = Number(formData.transport_count);
  const countType = normalizeSingleLine(formData.transport_count_type);
  if (hasCount && (!Number.isInteger(count) || count < 1 || count > 99999)) {
    errors.transport_count = 'Count must be a whole number from 1 to 99,999';
  }
  if (hasCount && !isTransportCountType(countType)) {
    errors.transport_count_type = 'Choose what is being counted';
  } else if (!hasCount && countType) {
    errors.transport_count = 'Enter the Count for the selected type';
  }
}

/** @param {unknown} value */
function normalizeSingleLine(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** @param {unknown} value */
function normalizeAddress(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/[\t ]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

/** @param {unknown} value */
function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

/** @param {{ email?: string, password?: string }} formData */
export function validateLoginForm(formData) {
  const errors = {};

  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/** @param {{ email?: string, password?: string, password_confirm?: string }} formData */
export function validateRegistrationForm(formData) {
  const errors = {};

  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  const passwordError = validatePasswordValue(formData.password);
  if (passwordError) errors.password = passwordError;

  if (!formData.password_confirm) {
    errors.password_confirm = 'Please confirm your password';
  } else if (formData.password !== formData.password_confirm) {
    errors.password_confirm = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/** @param {{ email?: string }} formData */
export function validatePasswordResetRequest(formData) {
  const errors = {};

  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/** @param {{ newPassword?: string, confirmPassword?: string }} formData */
export function validatePasswordResetForm(formData) {
  const errors = {};
  const passwordError = validatePasswordValue(formData.newPassword);

  if (passwordError) errors.newPassword = passwordError;

  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (formData.newPassword !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/** @param {string | undefined | null} password */
export function validatePasswordValue(password) {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 128) return 'Password must be no more than 128 characters';
  if (!PASSWORD_COMPLEXITY_PATTERN.test(password)) {
    return 'Password must include uppercase, lowercase, and numbers';
  }

  return null;
}

export default {
  validateLabelForm,
  sanitizeLabelForm,
  validateLoginForm,
  validateRegistrationForm,
  validatePasswordResetRequest,
  validatePasswordResetForm,
  validatePasswordValue
};
