// src/lib/validation/formValidation.js
import { validateGTIN, validateLotNumber } from '$lib/utils/gs1Utils';

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
  } else if (Number.isNaN(parseFloat(formData.weight_pounds)) || parseFloat(formData.weight_pounds) <= 0) {
    errors.weight_pounds = 'Weight must be a positive number';
  } else if (parseFloat(formData.weight_pounds) > 9999.9) {
    errors.weight_pounds = 'Weight too large, maximum is 9,999.9 pounds';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function sanitizeLabelForm(formData) {
  return {
    gtin: (formData.gtin || '').trim(),
    lot_number: (formData.lot_number || '').trim(),
    production_date: (formData.production_date || '').trim(),
    quantity: parseInt(formData.quantity || 0),
    weight_pounds: parseFloat(formData.weight_pounds || 0)
  };
}

export function validateLoginForm(formData) {
  const errors = {};

  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
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

export function validateRegistrationForm(formData) {
  const errors = {};

  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.username) {
    errors.username = 'Username is required';
  } else if (formData.username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
    errors.username = 'Username can only contain letters, numbers, and underscores';
  }

  if (!formData.full_name) {
    errors.full_name = 'Full name is required';
  }

  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
    errors.password = 'Password must include uppercase, lowercase, and numbers';
  }

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

export default {
  validateLabelForm,
  sanitizeLabelForm,
  validateLoginForm,
  validateRegistrationForm
};
