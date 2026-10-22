import { and, count, desc, eq, ne } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { product } from '#lib/server/db/schema.js';
import { normalizeGTIN, validateGTIN } from '#lib/utils/gs1Utils.js';

const MAX_PRODUCTS_PER_USER = 100;
const MAX_NAME_LENGTH = 120;
const MAX_REFERENCE_LENGTH = 50;

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
    } else if (!validateGTIN(gtin)) {
      errors.gtin = 'Enter a valid GTIN-8, GTIN-12, GTIN-13, or GTIN-14';
    } else {
      // Store the padded 14-digit form so the label form receives the same
      // value the renderer encodes.
      values.gtin = normalizeGTIN(gtin);
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
    internal_reference: row.internalReference,
    gtin: row.gtin,
    created_at: row.createdAt?.toISOString?.() || row.createdAt,
    updated_at: row.updatedAt?.toISOString?.() || row.updatedAt
  };
}

function ensureDatabase() {
  if (!db) {
    throw new Error('Database is not configured. Set LOGISTIC_LABEL_DATABASE_URL.');
  }
}
