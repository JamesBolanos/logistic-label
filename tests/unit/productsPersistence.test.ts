import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  type MockFn = ReturnType<typeof vi.fn>;
  interface ChainDb {
    resolvedValue: unknown[];
    select: MockFn;
    from: MockFn;
    where: MockFn;
    orderBy: MockFn;
    insert: MockFn;
    values: MockFn;
    update: MockFn;
    set: MockFn;
    delete: MockFn;
    limit: MockFn;
    returning: MockFn;
    then: (onFulfilled: (value: unknown) => unknown) => Promise<unknown>;
  }
  const chainMethods = [
    'select',
    'from',
    'where',
    'orderBy',
    'insert',
    'values',
    'update',
    'set',
    'delete',
    'limit',
    'returning'
  ] as const;

  // Drizzle builders are chainable and awaitable, so the mock node chains
  // every method and resolves to `resolvedValue` when awaited.
  const dbNode = { resolvedValue: [] as unknown[] } as ChainDb;
  for (const method of chainMethods) {
    dbNode[method] = vi.fn(() => dbNode);
  }
  dbNode.then = (onFulfilled) => Promise.resolve(dbNode.resolvedValue).then(onFulfilled);
  return dbNode;
});
vi.mock('#lib/server/db/index.js', () => ({ db: mocks }));
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
  validateProductData
} from '../../src/lib/server/db/products.js';

const storedProduct = {
  id: 7,
  userId: 'owner',
  name: 'Blue case',
  internalReference: 'REF-1',
  gtin: '04006381333931',
  createdAt: new Date('2026-10-21T00:00:00Z'),
  updatedAt: new Date('2026-10-21T00:00:00Z')
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resolvedValue = [];
  mocks.orderBy.mockResolvedValue([storedProduct]);
  mocks.returning.mockResolvedValue([storedProduct]);
});

describe('saved product persistence', () => {
  it('lists the user products with API field names', async () => {
    const products = await listProducts('owner');
    expect(products).toEqual([
      {
        id: 7,
        name: 'Blue case',
        internal_reference: 'REF-1',
        gtin: '04006381333931',
        created_at: '2026-10-21T00:00:00.000Z',
        updated_at: '2026-10-21T00:00:00.000Z'
      }
    ]);
    expect(mocks.where).toHaveBeenCalledExactlyOnceWith(expect.anything());
  });

  it('creates a product with a normalized 14-digit GTIN and a valid flag', async () => {
    mocks.where.mockResolvedValueOnce([{ value: 0 }]);
    const product = await createProduct('owner', {
      name: '  Blue   case ',
      internal_reference: ' REF-1 ',
      gtin: '4006381333931'
    });

    expect(mocks.values).toHaveBeenCalledExactlyOnceWith({
      userId: 'owner',
      name: 'Blue case',
      internalReference: 'REF-1',
      gtin: '04006381333931',
      gs1Valid: true
    });
    expect(product).toMatchObject({ id: 7, gtin: '04006381333931' });
  });

  it('stores an uncorrected check digit with the GS1 flag cleared', async () => {
    mocks.where.mockResolvedValueOnce([{ value: 0 }]);
    await createProduct('owner', { name: 'Red case', gtin: '4006381333930' });

    expect(mocks.values).toHaveBeenCalledExactlyOnceWith({
      userId: 'owner',
      name: 'Red case',
      internalReference: null,
      gtin: '04006381333930',
      gs1Valid: false
    });
  });

  it('rejects invalid product data before any database write', async () => {
    mocks.where.mockResolvedValueOnce([{ value: 0 }]);
    mocks.where.mockResolvedValueOnce([{ value: 0 }]);
    mocks.where.mockResolvedValueOnce([{ value: 0 }]);
    await expect(
      createProduct('owner', { name: '', internal_reference: '', gtin: '123' })
    ).rejects.toMatchObject({
      validation: {
        errors: {
          name: 'Product name is required',
          gtin: 'GTIN must contain 8, 12, 13, or 14 digits'
        }
      }
    });
    expect(mocks.insert).not.toHaveBeenCalled();

    await expect(
      createProduct('owner', {
        name: 'x'.repeat(121),
        gtin: '04006381333931'
      })
    ).rejects.toMatchObject({
      validation: { errors: { name: 'Product name must be 120 characters or fewer' } }
    });

    await expect(
      createProduct('owner', {
        name: 'Blue case',
        internal_reference: 'r'.repeat(51),
        gtin: '04006381333931'
      })
    ).rejects.toMatchObject({
      validation: {
        errors: { internal_reference: 'Internal reference must be 50 characters or fewer' }
      }
    });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('enforces the saved-product limit for the account', async () => {
    mocks.where.mockResolvedValueOnce([{ value: 100 }]);
    await expect(
      createProduct('owner', { name: 'Blue case', gtin: '04006381333931' })
    ).rejects.toMatchObject({
      validation: { errors: { name: 'You can save up to 100 products' } }
    });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('rejects a duplicate GTIN before inserting', async () => {
    mocks.where.mockResolvedValueOnce([{ value: 0 }]);
    mocks.limit.mockResolvedValueOnce([{ id: 5 }]);
    await expect(
      createProduct('owner', { name: 'Blue case', gtin: '04006381333931' })
    ).rejects.toMatchObject({
      validation: { errors: { gtin: 'You already saved a product with this GTIN' } }
    });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('rejects an update that reuses another product GTIN', async () => {
    mocks.limit.mockResolvedValueOnce([{ id: 5 }]);
    await expect(updateProduct('owner', '7', { gtin: '04006381333931' })).rejects.toMatchObject({
      validation: { errors: { gtin: 'You already saved a product with this GTIN' } }
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('updates only the provided fields for an owned product', async () => {
    const product = await updateProduct('owner', '7', { name: 'Blue case XL' });
    expect(mocks.set).toHaveBeenCalledExactlyOnceWith({ name: 'Blue case XL' });
    expect(product).toMatchObject({ id: 7 });
  });

  it('updates the optional reference back to empty', async () => {
    await updateProduct('owner', '7', { internal_reference: '' });
    expect(mocks.set).toHaveBeenCalledExactlyOnceWith({ internalReference: null });
  });

  it('recomputes the GS1 flag when the number is updated', async () => {
    await updateProduct('owner', '7', { gtin: '4006381333930' });
    expect(mocks.set).toHaveBeenCalledExactlyOnceWith({
      gtin: '04006381333930',
      gs1Valid: false
    });
  });

  it('returns null for missing, non-numeric, or foreign product updates', async () => {
    mocks.returning.mockResolvedValueOnce([]);
    expect(await updateProduct('owner', '7', { name: 'x' })).toBeNull();

    expect(await updateProduct('owner', 'abc', { name: 'x' })).toBeNull();
    expect(await updateProduct('owner', '0', { name: 'x' })).toBeNull();
    expect(await updateProduct('owner', '-2', { name: 'x' })).toBeNull();
    expect(mocks.update).toHaveBeenCalledTimes(1);
  });

  it('deletes an owned product and returns null for a foreign one', async () => {
    expect(await deleteProduct('owner', '7')).toMatchObject({ id: 7 });

    mocks.returning.mockResolvedValueOnce([]);
    expect(await deleteProduct('owner', '8')).toBeNull();
  });

  it('requires a name and GTIN for creation but allows partial updates', () => {
    const missingGtin = validateProductData({ name: 'Blue case' });
    expect(missingGtin.isValid).toBe(false);
    expect(missingGtin.errors.gtin).toBe('GTIN is required');

    const missingName = validateProductData({ gtin: '4006381333931' });
    expect(missingName.isValid).toBe(false);
    expect(missingName.errors.name).toBe('Product name is required');

    const partial = validateProductData({ name: 'Blue case' }, { partial: true });
    expect(partial).toEqual({
      isValid: true,
      errors: {},
      values: { name: 'Blue case' }
    });
  });
});
