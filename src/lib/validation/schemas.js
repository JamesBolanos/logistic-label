import { z } from 'zod';

const GTIN_PATTERN = /^(?:\d{8}|\d{12}|\d{13}|\d{14})$/;

function isValidGTIN(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (![8, 12, 13, 14].includes(digits.length)) return false;
  let sum = 0;
  for (let i = 0; i < digits.length - 1; i += 1) {
    const digit = Number(digits[i]);
    sum += (digits.length - 1 - i) % 2 === 0 ? digit * 3 : digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === Number(digits[digits.length - 1]);
}

export const labelSettingsSchema = z.object({
  company_name: z
    .string({ required_error: 'Company name is required' })
    .trim()
    .min(1, 'Company name is required')
    .max(120, 'Company name must be 120 characters or fewer'),
  gs1_company_prefix: z
    .string({ required_error: 'GS1 Company Prefix is required' })
    .trim()
    .min(1, 'GS1 Company Prefix is required')
    .regex(/^\d+$/, 'GS1 Company Prefix must contain only digits')
    .min(6, 'GS1 Company Prefix must be at least 6 digits')
    .max(12, 'GS1 Company Prefix must be 12 digits or fewer'),
  extension_digit: z
    .string({ required_error: 'Extension digit is required' })
    .trim()
    .regex(/^[0-9]$/, 'Extension digit must be a single digit'),
  next_serial_reference: z
    .coerce.number({ invalid_type_error: 'Next serial reference must be a number' })
    .int('Next serial reference must be an integer')
    .min(1, 'Next serial reference must be at least 1')
});

export const productSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .trim()
    .min(1, 'Product name is required')
    .max(120, 'Product name must be 120 characters or fewer'),
  brand: z
    .string()
    .trim()
    .max(120, 'Brand must be 120 characters or fewer')
    .optional()
    .or(z.literal('')),
  internal_reference: z
    .string()
    .trim()
    .max(50, 'Internal reference must be 50 characters or fewer')
    .optional()
    .or(z.literal('')),
  gtin: z
    .string({ required_error: 'GTIN is required' })
    .trim()
    .min(1, 'GTIN is required')
    .regex(GTIN_PATTERN, 'GTIN must contain 8, 12, 13, or 14 digits')
    .refine(isValidGTIN, {
      message: 'GTIN does not pass the GS1 check digit'
    }),
  net_content_value: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || /^-?\d*\.?\d+$/.test(value.replace(/,/g, '.')), {
      message: 'Net content value must be a number'
    })
    .refine((value) => !value || value.replace(/,/g, '.').length <= 32, {
      message: 'Net content value is too long'
    }),
  net_content_unit: z
    .enum(['g', 'kg', 'mg', 'lb', 'oz', 'ml', 'l', 'fl oz', 'units', 'm', 'cm'])
    .optional()
    .or(z.literal(''))
}).superRefine((data, ctx) => {
  const hasValue = !!data.net_content_value;
  const hasUnit = !!data.net_content_unit;
  if (hasValue && !hasUnit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['net_content_unit'],
      message: 'Select a unit of measure for the net content value'
    });
  }
  if (hasUnit && !hasValue) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['net_content_value'],
      message: 'Enter a net content value'
    });
  }
});
