import { json } from '@sveltejs/kit';
import { deleteProduct, updateProduct } from '#lib/server/db/products.js';
import {
  durationSince,
  getOperationId,
  recordOperationalEvent
} from '#lib/server/analytics/operationalEvents.js';

// Fields a PATCH may change; at least one must be present so an empty
// payload cannot produce an empty UPDATE statement.
const UPDATABLE_FIELDS = ['name', 'internal_reference', 'gtin'];

export async function PATCH({ request, params, locals }) {
  const startedAt = Date.now();
  const operationId = getOperationId(request);
  if (!locals.user) {
    return json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error();
  } catch {
    return json({ success: false, message: 'Invalid product' }, { status: 400 });
  }

  const providedFields = UPDATABLE_FIELDS.filter((field) => payload[field] !== undefined);
  if (providedFields.length === 0) {
    return json({ success: false, message: 'Provide a product field to update' }, { status: 400 });
  }

  try {
    const product = await updateProduct(locals.user.id, params.id, payload);

    if (!product) {
      return json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    await recordOperationalEvent({
      eventName: 'product_saved',
      userId: locals.user.id,
      operationId,
      setupType: 'update',
      durationMs: durationSince(startedAt)
    });

    return json({ success: true, product, setupType: 'update' });
  } catch (error) {
    if (error.validation) {
      await recordOperationalEvent({
        eventName: 'workflow_failed',
        userId: locals.user.id,
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

    console.error('Product update error:', error);
    await recordOperationalEvent({
      eventName: 'workflow_failed',
      userId: locals.user.id,
      operationId,
      workflowStep: 'product_save',
      errorCategory: 'database',
      durationMs: durationSince(startedAt)
    });
    return json({ success: false, message: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE({ params, locals }) {
  if (!locals.user) {
    return json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  try {
    const product = await deleteProduct(locals.user.id, params.id);

    if (!product) {
      return json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    return json({ success: true, product });
  } catch (error) {
    console.error('Product delete error:', error);
    return json({ success: false, message: 'Failed to delete product' }, { status: 500 });
  }
}
