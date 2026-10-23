import { and, count, desc, eq, ne } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { product } from '#lib/server/db/schema.js';
import { validateGTIN } from '#lib/utils/gs1Utils.js';

const MAX_PRODUCTS_PER_USER = 100;
const MAX_NAME_LENGTH = 120;
const MAX_BRAND_LENGTH = 120;
const MAX_REFERENCE_LENGTH = 50;
const MAX_NET_CONTENT_VALUE_LENGTH = 32;
const PRODUCT_NUMBER_PATTERN = /^(?:\d{8}|\d{12}|\d{13}|\d{14})$/;

const NET_CONTENT_UNITS = new Set([
  'g',
  'kg',
  'mg',
  'lb',
  'oz',
  'ml',
  'l',
  'fl oz',
  'units',
  'm',
  'cm'
]);

/**
 * List the signed-in user's saved products, newest first. The list feeds the
 * Settings manager and the label-form product picker.
 */
export async function listProducts(userId) {
  ensureDatabase();

  const rows = await db
    .select()
    .from(product)
    .where(eq(product.userId, userId))
    .orderBy(desc(product.createdAt), desc(product.id));

  return rows.map(toApiProduct);
}

/**
 * Count the user's saved products. The products endpoint uses it to classify
 * a save as a first product or an update.
 */
export async function countProducts(userId) {
  ensureDatabase();

  const [{ value: existing }] = await db
    .select({ value: count() })
    .from(product)
    .where(eq(product.userId, userId));

  return Number(existing);
}

/**
 * Create a saved product for the user. Returns the stored product or throws
 * an error with `error.validation` for form display.
 */
export async function createProduct(userId, data) {
  ensureDatabase();

  if ((await countProducts(userId)) >= MAX_PRODUCTS_PER_USER) {
    throw validationError({
      name: `You can save up to ${MAX_PRODUCTS_PER_USER} products`
    });
  }

  const columns = toColumns(data, { partial: false });
  await rejectDuplicateGtin(userId, columns.gtin);

  const [created] = await db
    .insert(product)
    .values({ userId, ...columns })
    .returning();

  return toApiProduct(created);
}

/**
 * Update a saved product owned by the user. Returns null when the product
 * does not exist or belongs to another account.
 */
export async function updateProduct(userId, id, data) {
  ensureDatabase();

  const numericId = parseId(id);
  if (numericId === null) return null;

  const columns = toColumns(data, { partial: true });
  if (columns.gtin !== undefined) {
    await rejectDuplicateGtin(userId, columns.gtin, numericId);
  }

  const [updated] = await db
    .update(product)
    .set(columns)
    .where(and(eq(product.id, numericId), eq(product.userId, userId)))
    .returning();

  return updated ? toApiProduct(updated) : null;
}

/**
 * Delete a saved product owned by the user. Saved labels keep their own GTIN
 * values, so deletion never touches label history. Returns null when the
 * product does not exist or belongs to another account.
 */
export async function deleteProduct(userId, id) {
  ensureDatabase();

  const numericId = parseId(id);
  if (numericId === null) return null;

  const [deleted] = await db
    .delete(product)
    .where(and(eq(product.id, numericId), eq(product.userId, userId)))
    .returning();

  return deleted ? toApiProduct(deleted) : null;
}

/**
 * Sanitize and validate product data. When `partial` is false every field is
 * required; when true the payload may update a subset of fields.
 */
export function validateProductData(data, { partial = false } = {}) {
  const errors = {};
  const values = {};

  const hasName = data?.name !== undefined;
  if (hasName || !partial) {
    const name = normalizeSingleLine(data?.name);
    if (!name) {
      errors.name = 'Product name is required';
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.name = `Product name must be ${MAX_NAME_LENGTH} characters or fewer`;
    } else {
      values.name = name;
    }
  }

  const hasBrand = data?.brand !== undefined;
  if (hasBrand || !partial) {
    const brand = normalizeSingleLine(data?.brand);
    if (brand && brand.length > MAX_BRAND_LENGTH) {
      errors.brand = `Brand must be ${MAX_BRAND_LENGTH} characters or fewer`;
    } else {
      values.brand = brand || null;
    }
  }

  const hasReference = data?.internal_reference !== undefined;
  if (hasReference || !partial) {
    const reference = normalizeSingleLine(data?.internal_reference);
    if (reference.length > MAX_REFERENCE_LENGTH) {
      errors.internal_reference = `Internal reference must be ${MAX_REFERENCE_LENGTH} characters or fewer`;
    } else {
      values.internalReference = reference || null;
    }
  }

  const hasGtin = data?.gtin !== undefined;
  if (hasGtin || !partial) {
    const gtin = String(data?.gtin || '').trim();
    if (!gtin) {
      errors.gtin = 'GTIN is required';
    } else if (!PRODUCT_NUMBER_PATTERN.test(gtin)) {
      errors.gtin = 'GTIN must contain 8, 12, 13, or 14 digits';
    } else {
      // A failed check digit is recorded in the flag instead of blocking the
      // save: the number is kept as reference data and labels still validate
      // their own GTIN. Pad to the 14-digit form the renderer encodes.
      values.gtin = gtin.padStart(14, '0');
      values.gs1Valid = validateGTIN(gtin);
    }
  }

  const hasNetContentValue = data?.net_content_value !== undefined;
  const hasNetContentUnit = data?.net_content_unit !== undefined;
  if (hasNetContentValue || hasNetContentUnit || !partial) {
    const netContentValueRaw = normalizeSingleLine(data?.net_content_value);
    const netContentUnitRaw = normalizeSingleLine(data?.net_content_unit);

    if (netContentValueRaw && !/^-?\d*\.?\d+$/.test(netContentValueRaw.replace(/,/g, '.'))) {
      errors.net_content_value = 'Net content value must be a number';
    } else if (netContentValueRaw && netContentValueRaw.length > MAX_NET_CONTENT_VALUE_LENGTH) {
      errors.net_content_value = `Net content value must be ${MAX_NET_CONTENT_VALUE_LENGTH} characters or fewer`;
    }

    if (netContentUnitRaw && !NET_CONTENT_UNITS.has(netContentUnitRaw)) {
      errors.net_content_unit = 'Select a valid unit of measure';
    }

    if (netContentValueRaw && !netContentUnitRaw) {
      errors.net_content_unit = 'Select a unit of measure for the net content value';
    }

    if (netContentUnitRaw && !netContentValueRaw) {
      errors.net_content_value = 'Enter a net content value';
    }

    if (!errors.net_content_value && !errors.net_content_unit) {
      if (hasNetContentValue || hasNetContentUnit || !partial) {
        values.netContentValue = netContentValueRaw || null;
        values.netContentUnit = netContentUnitRaw || null;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values
  };
}

// The database enforces one product per GTIN per account with a unique
// index; this check turns the common case into a friendly validation error.
async function rejectDuplicateGtin(userId, gtin, excludeId = null) {
  const conditions = [eq(product.userId, userId), eq(product.gtin, gtin)];
  if (excludeId !== null) {
    conditions.push(ne(product.id, excludeId));
  }

  const [duplicate] = await db
    .select({ id: product.id })
    .from(product)
    .where(and(...conditions))
    .limit(1);

  if (duplicate) {
    throw validationError({ gtin: 'You already saved a product with this GTIN' });
  }
}

function toColumns(data, { partial }) {
  const validation = validateProductData(data, { partial });
  if (!validation.isValid) {
    throw validationError(validation.errors);
  }
  return validation.values;
}

function validationError(errors) {
  const error = new Error('Invalid product');
  error.validation = { errors };
  return error;
}

function parseId(id) {
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
}

function normalizeSingleLine(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toApiProduct(row) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    internal_reference: row.internalReference,
    gtin: row.gtin,
    gs1_valid: row.gs1Valid,
    net_content_value: row.netContentValue,
    net_content_unit: row.netContentUnit,
    created_at: row.createdAt?.toISOString?.() || row.createdAt,
    updated_at: row.updatedAt?.toISOString?.() || row.updatedAt
  };
}

function ensureDatabase() {
  if (!db) {
    throw new Error('Database is not configured. Set LOGISTIC_LABEL_DATABASE_URL.');
  }
}
