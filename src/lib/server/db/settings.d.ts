import type { PrintSettings } from '#lib/printing/settings.ts';

type CompanySettings = {
  company_name: string;
  gs1_company_prefix: string;
  extension_digit: string;
  next_serial_reference: number;
};

export type LabelSettings = CompanySettings &
  PrintSettings & {
    user_id: string;
    is_configured: boolean;
    created_at?: string;
    updated_at?: string;
  };

export function getLabelSettings(userId: string): Promise<LabelSettings>;
export function upsertLabelSettings(
  userId: string,
  data: Record<string, unknown>
): Promise<LabelSettings>;
export function upsertPrintSettings(
  userId: string,
  data: Record<string, unknown>
): Promise<LabelSettings>;
export function allocateSSCC(userId: string): Promise<string>;
export function sanitizeSettings(data: Record<string, unknown>): CompanySettings;
export function validateLabelSettings(settings: CompanySettings): {
  isValid: boolean;
  errors: Record<string, string>;
};
