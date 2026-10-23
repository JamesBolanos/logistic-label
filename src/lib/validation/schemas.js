import { z } from 'zod';

// Mirrors validateLabelSettings in #lib/server/db/settings.js so invalid input
// is reported inline instead of surfacing as a server-side save failure.
export const labelSettingsSchema = z
  .object({
    company_name: z
      .string({ error: 'Company name is required' })
      .trim()
      .min(1, 'Company name is required')
      .max(120, 'Company name must be 120 characters or fewer'),
    gs1_company_prefix: z
      .string({ error: 'GS1 Company Prefix is required' })
      .trim()
      .min(1, 'GS1 Company Prefix is required')
      .regex(/^\d+$/, 'GS1 Company Prefix must contain only digits')
      .min(4, 'GS1 Company Prefix must be 4 to 12 digits')
      .max(12, 'GS1 Company Prefix must be 4 to 12 digits'),
    extension_digit: z
      .string({ error: 'Extension digit is required' })
      .trim()
      .regex(/^[0-9]$/, 'Extension digit must be a single digit'),
    next_serial_reference: z.coerce
      .number({ error: 'Next serial reference must be a number' })
      .int('Next serial reference must be an integer')
      .min(1, 'Next serial reference must be at least 1')
  })
  .superRefine((data, ctx) => {
    // The SSCC serial reference shares 16 digits with the company prefix.
    const serialDigits = 16 - data.gs1_company_prefix.length;
    const maxSerial = 10 ** serialDigits - 1;

    if (data.next_serial_reference > maxSerial) {
      ctx.addIssue({
        code: 'custom',
        path: ['next_serial_reference'],
        message: `Next serial reference must be ${maxSerial} or lower for this prefix length`
      });
    }
  });
