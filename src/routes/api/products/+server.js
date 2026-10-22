import { json } from '@sveltejs/kit';
import { countProducts, createProduct, listProducts } from '#lib/server/db/products.js';
import {
  durationSince,
  getOperationId,
  recordOperationalEvent
} from '#lib/server/analytics/operationalEvents.js';

export async function GET({ locals }) {
  if (!locals.user) {
    return json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  try {
    const products = await listProducts(locals.user.id);
    return json({ success: true, products }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Product list error:', error);
    return json({ success: false, message: 'Failed to load products' }, { status: 500 });
  }
}

export async function POST({ request, locals }) {
  const startedAt = Date.now();
  const operationId = getOperationId(request);
  const user = locals.user;
  if (!user) {
    return json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error();
  } catch {
    return json({ success: false, message: 'Invalid product' }, { status: 400 });
  }

  try {
    // Classify the save before creating; a tiny race between two first
    // products only affects this analytics classification, never data.
    const setupType = (await countProducts(user.id)) === 0 ? 'first_setup' : 'update';
    const product = await createProduct(user.id, payload);

    await recordOperationalEvent({
      eventName: 'product_saved',
      userId: user.id,
      operationId,
      setupType,
      durationMs: durationSince(startedAt)
    });

    return json({ success: true, product, setupType }, { status: 201 });
  } catch (error) {
    if (error.validation) {
      await recordOperationalEvent({
        eventName: 'workflow_failed',
        userId: user.id,
        operationId,
        workflowStep: 'product_save',
        errorCategory: 'validation',
        durationMs: durationSince(startedAt)
      });

      return json(
        { success: false, message: 'Invalid product', errors: error.validation.errors },
        { status: 400 }
      );
    }

    console.error('Product save error:', error);
    await recordOperationalEvent({
      eventName: 'workflow_failed',
      userId: user.id,
      operationId,
      workflowStep: 'product_save',
      errorCategory: 'database',
      durationMs: durationSince(startedAt)
    });
    return json({ success: false, message: 'Failed to save product' }, { status: 500 });
  }
}
