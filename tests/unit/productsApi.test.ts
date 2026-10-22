import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listProducts: vi.fn(),
  countProducts: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  recordOperationalEvent: vi.fn(),
  getOperationId: vi.fn(),
  durationSince: vi.fn()
}));
vi.mock('#lib/server/db/products.js', () => mocks);
vi.mock('#lib/server/analytics/operationalEvents.js', () => mocks);
import { GET, POST } from '../../src/routes/api/products/+server.js';
import { DELETE, PATCH } from '../../src/routes/api/products/[id]/+server.js';

const savedProduct = {
  id: 1,
  name: 'Blue case',
  internal_reference: 'REF-1',
  gtin: '04006381333931'
};

function postEvent(body: unknown, user: { id: string } | null = { id: 'owner' }) {
  return {
    request: new Request('http://localhost/api/products', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    locals: { user }
  };
}

function patchEvent(body: unknown, id = '1', user: { id: string } | null = { id: 'owner' }) {
  return {
    request: new Request(`http://localhost/api/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    }),
    params: { id },
    locals: { user }
  };
}

function deleteEvent(id = '1', user: { id: string } | null = { id: 'owner' }) {
  return {
    request: new Request(`http://localhost/api/products/${id}`, { method: 'DELETE' }),
    params: { id },
    locals: { user }
  };
}

beforeEach(() => vi.resetAllMocks());

describe('saved products endpoint', () => {
  it('requires authentication for every method', async () => {
    expect((await GET({ locals: { user: null } })).status).toBe(401);
    expect((await POST(postEvent({}, null))).status).toBe(401);
    expect((await PATCH(patchEvent({}, '1', null))).status).toBe(401);
    expect((await DELETE(deleteEvent('1', null))).status).toBe(401);
    expect(mocks.listProducts).not.toHaveBeenCalled();
    expect(mocks.createProduct).not.toHaveBeenCalled();
    expect(mocks.updateProduct).not.toHaveBeenCalled();
    expect(mocks.deleteProduct).not.toHaveBeenCalled();
  });

  it('lists products privately for the signed-in user', async () => {
    mocks.listProducts.mockResolvedValue([savedProduct]);
    const response = await GET({ locals: { user: { id: 'owner' } } });
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toMatchObject({ success: true, products: [savedProduct] });
    expect(mocks.listProducts).toHaveBeenCalledExactlyOnceWith('owner');
  });

  it('returns a generic failure when the list cannot be read', async () => {
    mocks.listProducts.mockRejectedValue(new Error('database offline'));
    const response = await GET({ locals: { user: { id: 'owner' } } });
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ success: false });
  });

  it('creates a product for the signed-in owner and records the event', async () => {
    mocks.countProducts.mockResolvedValue(0);
    mocks.createProduct.mockResolvedValue(savedProduct);
    const response = await POST(
      postEvent({ user_id: 'another-user', name: 'Blue case', gtin: '04006381333931' })
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ success: true, product: savedProduct });
    expect(mocks.createProduct).toHaveBeenCalledExactlyOnceWith('owner', {
      user_id: 'another-user',
      name: 'Blue case',
      gtin: '04006381333931'
    });
    expect(mocks.recordOperationalEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'product_saved',
        userId: 'owner',
        setupType: 'first_setup'
      })
    );
  });

  it('classifies later saves as updates', async () => {
    mocks.countProducts.mockResolvedValue(3);
    mocks.createProduct.mockResolvedValue(savedProduct);
    await POST(postEvent({ name: 'Blue case', gtin: '04006381333931' }));
    expect(mocks.recordOperationalEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'product_saved', setupType: 'update' })
    );
  });

  it.each([null, [], 'text'])('rejects a non-object product payload', async (payload) => {
    expect((await POST(postEvent(payload))).status).toBe(400);
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });

  it('records validation failures without saving', async () => {
    mocks.createProduct.mockRejectedValue({
      validation: { errors: { gtin: 'Enter a valid GTIN-8, GTIN-12, GTIN-13, or GTIN-14' } }
    });
    const response = await POST(postEvent({ name: 'Blue case', gtin: '123' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errors: { gtin: expect.any(String) } });
    expect(mocks.recordOperationalEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'workflow_failed',
        workflowStep: 'product_save',
        errorCategory: 'validation'
      })
    );
  });

  it('records database failures without saving', async () => {
    mocks.createProduct.mockRejectedValue(new Error('database offline'));
    const response = await POST(postEvent({ name: 'Blue case', gtin: '04006381333931' }));
    expect(response.status).toBe(500);
    expect(mocks.recordOperationalEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'workflow_failed',
        workflowStep: 'product_save',
        errorCategory: 'database'
      })
    );
  });

  it('updates an owned product and rejects empty updates', async () => {
    mocks.updateProduct.mockResolvedValue(savedProduct);
    const response = await PATCH(patchEvent({ name: 'Blue case XL' }));
    expect(response.status).toBe(200);
    expect(mocks.updateProduct).toHaveBeenCalledExactlyOnceWith('owner', '1', {
      name: 'Blue case XL'
    });
    expect(mocks.recordOperationalEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'product_saved', setupType: 'update' })
    );

    const emptyResponse = await PATCH(patchEvent({}));
    expect(emptyResponse.status).toBe(400);
    expect(mocks.updateProduct).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when the product is missing or owned by another account', async () => {
    mocks.updateProduct.mockResolvedValue(null);
    expect((await PATCH(patchEvent({ name: 'Blue case XL' }))).status).toBe(404);
    expect(mocks.updateProduct).toHaveBeenCalledExactlyOnceWith('owner', '1', {
      name: 'Blue case XL'
    });

    mocks.deleteProduct.mockResolvedValue(null);
    expect((await DELETE(deleteEvent('999'))).status).toBe(404);
  });

  it('rejects invalid identifiers and invalid payloads before writing', async () => {
    expect((await PATCH(patchEvent({ name: 'x' }, 'abc'))).status).toBe(404);
    expect(mocks.updateProduct).toHaveBeenCalledExactlyOnceWith('owner', 'abc', { name: 'x' });
    expect((await PATCH(patchEvent([1, 2]))).status).toBe(400);
    expect((await PATCH(patchEvent({}, '1'))).status).toBe(400);
    expect(mocks.updateProduct).toHaveBeenCalledTimes(1);
    expect(mocks.deleteProduct).not.toHaveBeenCalled();
  });

  it('deletes an owned product without touching labels', async () => {
    mocks.deleteProduct.mockResolvedValue(savedProduct);
    const response = await DELETE(deleteEvent('1'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, product: savedProduct });
    expect(mocks.deleteProduct).toHaveBeenCalledExactlyOnceWith('owner', '1');
  });
});
