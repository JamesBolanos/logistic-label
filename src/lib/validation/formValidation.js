// src/lib/validation/formValidation.js
import { normalizeGTIN, validateGTIN } from '$lib/utils/gs1Utils';
import {
  CURRENT_TEMPLATE_VERSION,
  isPackagingLevel,
  isSupportedLabelType,
  LABEL_TYPES
} from '$lib/labels/workflows.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_COMPLEXITY_PATTERN = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/**
 * @param {{
 *   label_type?: string,
 *   gtin?: string,
 *   quantity?: string | number,
 *   packaging_level?: string,
 *   contents_are_homogeneous?: boolean
 * }} formData
 */
export function validateLabelForm(formData) {
  const errors = {};

  if (!isSupportedLabelType(formData?.label_type)) {
    errors.label_type = 'Choose a supported label workflow';
    return { isValid: false, errors };
  }

  if (formData.label_type === LABEL_TYPES.SSCC_ONLY) {
    return { isValid: true, errors };
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

  if (formData.contents_are_homogeneous !== true) {
    errors.contents_are_homogeneous = 'Confirm that every contained trade item has the same GTIN';
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
 *   packaging_level?: string
 * }} formData
 */
export function sanitizeLabelForm(formData) {
  const labelType = String(formData?.label_type || '').trim();

  if (labelType === LABEL_TYPES.SSCC_ONLY) {
    return {
      label_type: labelType,
      template_version: CURRENT_TEMPLATE_VERSION,
      gtin: null,
      lot_number: null,
      production_date: null,
      quantity: null,
      weight_pounds: null,
      packaging_level: null
    };
  }

  return {
    label_type: labelType,
    template_version: CURRENT_TEMPLATE_VERSION,
    gtin: normalizeGTIN(formData.gtin || ''),
    lot_number: null,
    production_date: null,
    quantity: Number(formData.quantity),
    weight_pounds: null,
    packaging_level: String(formData.packaging_level || '').trim()
  };
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
