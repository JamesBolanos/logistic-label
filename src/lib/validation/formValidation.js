// src/lib/validation/formValidation.js
import { validateGTIN, validateLotNumber } from '$lib/utils/gs1Utils';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_COMPLEXITY_PATTERN = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/**
 * @param {{
 *   gtin?: string,
 *   lot_number?: string,
 *   production_date?: string,
 *   quantity?: string,
 *   weight_pounds?: string
 * }} formData
 */
export function validateLabelForm(formData) {
  const errors = {};

  if (!formData.gtin) {
    errors.gtin = 'GTIN is required';
  } else if (!validateGTIN(formData.gtin)) {
    errors.gtin = 'Invalid GTIN format. Must be 14 digits with valid check digit';
  }

  if (!formData.lot_number) {
    errors.lot_number = 'Lot number is required';
  } else if (!validateLotNumber(formData.lot_number)) {
    errors.lot_number = 'Invalid lot number. Must be 1-20 alphanumeric characters';
  }

  if (!formData.production_date) {
    errors.production_date = 'Production date is required';
  } else {
    const date = new Date(formData.production_date);
    if (Number.isNaN(date.getTime())) {
      errors.production_date = 'Invalid production date format';
    } else if (date > new Date()) {
      errors.production_date = 'Production date cannot be in the future';
    }
  }

  if (!formData.quantity) {
    errors.quantity = 'Quantity is required';
  } else if (Number.isNaN(parseInt(formData.quantity)) || parseInt(formData.quantity) <= 0) {
    errors.quantity = 'Quantity must be a positive number';
  } else if (parseInt(formData.quantity) > 99999999) {
    errors.quantity = 'Quantity too large, maximum is 99,999,999';
  }

  if (!formData.weight_pounds) {
    errors.weight_pounds = 'Weight is required';
  } else if (
    Number.isNaN(parseFloat(formData.weight_pounds)) ||
    parseFloat(formData.weight_pounds) <= 0
  ) {
    errors.weight_pounds = 'Weight must be a positive number';
  } else if (parseFloat(formData.weight_pounds) > 9999.9) {
    errors.weight_pounds = 'Weight too large, maximum is 9,999.9 pounds';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * @param {{
 *   gtin?: string,
 *   lot_number?: string,
 *   production_date?: string,
 *   quantity?: string,
 *   weight_pounds?: string
 * }} formData
 */
export function sanitizeLabelForm(formData) {
  return {
    gtin: (formData.gtin || '').trim(),
    lot_number: (formData.lot_number || '').trim(),
    production_date: (formData.production_date || '').trim(),
    quantity: parseInt(formData.quantity || '0'),
    weight_pounds: parseFloat(formData.weight_pounds || '0')
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
