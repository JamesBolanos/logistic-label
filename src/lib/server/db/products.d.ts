export type SavedProduct = {
  id: number;
  name: string;
  internal_reference: string | null;
  gtin: string;
  gs1_valid: boolean;
  created_at?: string;
  updated_at?: string;
};

export function listProducts(userId: string): Promise<SavedProduct[]>;
export function countProducts(userId: string): Promise<number>;
export function createProduct(userId: string, data: Record<string, unknown>): Promise<SavedProduct>;
export function updateProduct(
  userId: string,
  id: string | number,
  data: Record<string, unknown>
): Promise<SavedProduct | null>;
export function deleteProduct(userId: string, id: string | number): Promise<SavedProduct | null>;
export function validateProductData(
  data: Record<string, unknown>,
  options?: { partial?: boolean }
): {
  isValid: boolean;
  errors: Record<string, string>;
  values: Record<string, unknown>;
};
