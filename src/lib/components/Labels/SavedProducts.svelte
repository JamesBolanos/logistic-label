<script>
  import { onMount } from 'svelte';
  import { createOperationId, trackProductEvent } from '#lib/analytics/client.ts';
  import { classifyHttpFailure } from '#lib/analytics/events.ts';
  import { validateGTIN } from '#lib/utils/gs1Utils.js';

  const GTIN_PATTERN = /^(?:\d{8}|\d{12}|\d{13}|\d{14})$/;
  const GTIN_WARNING =
    'This number does not pass the GS1 check digit. You can still save it as reference data, but labels require a valid GTIN.';

  let products = $state([]);
  let isLoading = $state(true);
  let listError = $state('');

  let formData = $state({ name: '', internal_reference: '', gtin: '' });
  let errors = $state({});
  let isSaving = $state(false);
  let formError = $state('');

  let editingId = $state(null);
  let editData = $state({ name: '', internal_reference: '', gtin: '' });
  let editErrors = $state({});
  let editSaving = $state(false);

  let confirmDeleteId = $state(null);
  let isDeleting = $state(false);

  let gtinWarning = $derived(gtinWarningFor(formData.gtin));
  let editGtinWarning = $derived(editingId === null ? '' : gtinWarningFor(editData.gtin));

  onMount(loadProducts);

  function gtinWarningFor(value) {
    const gtin = String(value || '').trim();
    return GTIN_PATTERN.test(gtin) && !validateGTIN(gtin) ? GTIN_WARNING : '';
  }

  async function loadProducts() {
    isLoading = true;
    listError = '';

    try {
      const response = await fetch('/api/products');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load products');
      }

      products = data.products || [];
    } catch (error) {
      listError = error.message || 'Failed to load products';
    } finally {
      isLoading = false;
    }
  }

  async function createProduct() {
    const startedAt = Date.now();
    let responseStatus = null;
    isSaving = true;
    errors = {};
    formError = '';

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Operation-ID': createOperationId()
        },
        body: JSON.stringify(formData)
      });
      responseStatus = response.status;
      const data = await response.json();

      if (!response.ok) {
        errors = data.errors || {};
        throw new Error(data.message || 'Failed to save product');
      }

      products = [data.product, ...products];
      formData = { name: '', internal_reference: '', gtin: '' };
      trackProductEvent('product_saved', { setup_type: data.setupType });
    } catch (error) {
      formError = error.message || 'Failed to save product';
      trackProductEvent('workflow_failed', {
        step: 'product_save',
        error_category: responseStatus === null ? 'network' : classifyHttpFailure(responseStatus),
        duration_ms: Date.now() - startedAt
      });
    } finally {
      isSaving = false;
    }
  }

  function startEdit(product) {
    editingId = product.id;
    editData = {
      name: product.name,
      internal_reference: product.internal_reference || '',
      gtin: product.gtin
    };
    editErrors = {};
    confirmDeleteId = null;
  }

  function cancelEdit() {
    editingId = null;
    editData = { name: '', internal_reference: '', gtin: '' };
    editErrors = {};
  }

  async function saveEdit(product) {
    const startedAt = Date.now();
    let responseStatus = null;
    editSaving = true;
    editErrors = {};
    formError = '';

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Operation-ID': createOperationId()
        },
        body: JSON.stringify(editData)
      });
      responseStatus = response.status;
      const data = await response.json();

      if (!response.ok) {
        editErrors = data.errors || {};
        throw new Error(data.message || 'Failed to update product');
      }

      products = products.map((item) => (item.id === product.id ? data.product : item));
      editingId = null;
      trackProductEvent('product_saved', { setup_type: 'update' });
      formError = '';
    } catch (error) {
      formError = error.message || 'Failed to update product';
      trackProductEvent('workflow_failed', {
        step: 'product_save',
        error_category: responseStatus === null ? 'network' : classifyHttpFailure(responseStatus),
        duration_ms: Date.now() - startedAt
      });
    } finally {
      editSaving = false;
    }
  }

  // Deleting a product never changes saved labels: each label stores its own
  // GTIN. A second click confirms so an accidental click cannot remove data.
  async function removeProduct(product) {
    if (confirmDeleteId !== product.id) {
      confirmDeleteId = product.id;
      return;
    }

    isDeleting = true;

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        headers: { 'X-Operation-ID': createOperationId() }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete product');
      }

      products = products.filter((item) => item.id !== product.id);
      if (editingId === product.id) cancelEdit();
    } catch (error) {
      formError = error.message || 'Failed to delete product';
    } finally {
      confirmDeleteId = null;
      isDeleting = false;
    }
  }
</script>

<section
  aria-labelledby="saved-products-heading"
  class="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow"
>
  <div>
    <h2 id="saved-products-heading" class="text-xl font-semibold text-gray-900">Saved products</h2>
    <p class="mt-2 text-sm text-gray-600">
      Save the products you ship often. When creating a label, select one to fill its GTIN. Shipment
      details such as lot, date, count, and addresses stay on each label.
    </p>
  </div>

  {#if isLoading}
    <div class="flex h-24 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
    </div>
  {:else}
    {#if listError}
      <div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
        {listError}
      </div>
    {/if}

    {#if formError}
      <div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
        {formError}
      </div>
    {/if}

    {#if products.length === 0}
      <p class="text-sm text-gray-500">No saved products yet. Add your first one below.</p>
    {:else}
      <ul class="divide-y divide-gray-200 rounded-md border border-gray-200">
        {#each products as product (product.id)}
          <li data-product-id={product.id} class="p-3">
            {#if editingId === product.id}
              <form
                onsubmit={(event) => {
                  event.preventDefault();
                  saveEdit(product);
                }}
                class="space-y-3"
              >
                <div class="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label
                      for="edit_name_{product.id}"
                      class="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Product Name
                    </label>
                    <input
                      id="edit_name_{product.id}"
                      type="text"
                      bind:value={editData.name}
                      maxlength="120"
                      required
                      class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {#if editErrors.name}
                      <p class="mt-1 text-sm text-red-600">{editErrors.name}</p>
                    {/if}
                  </div>
                  <div>
                    <label
                      for="edit_reference_{product.id}"
                      class="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Internal Reference
                    </label>
                    <input
                      id="edit_reference_{product.id}"
                      type="text"
                      bind:value={editData.internal_reference}
                      maxlength="50"
                      autocomplete="off"
                      class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {#if editErrors.internal_reference}
                      <p class="mt-1 text-sm text-red-600">{editErrors.internal_reference}</p>
                    {/if}
                  </div>
                  <div>
                    <label
                      for="edit_gtin_{product.id}"
                      class="mb-1 block text-sm font-medium text-gray-700"
                    >
                      GTIN
                    </label>
                    <input
                      id="edit_gtin_{product.id}"
                      type="text"
                      inputmode="numeric"
                      bind:value={editData.gtin}
                      maxlength="14"
                      required
                      class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {#if editErrors.gtin}
                      <p class="mt-1 text-sm text-red-600">{editErrors.gtin}</p>
                    {/if}
                    {#if editGtinWarning}
                      <p class="mt-1 text-sm text-amber-700">{editGtinWarning}</p>
                    {/if}
                  </div>
                </div>
                <div class="flex gap-2">
                  <button
                    type="submit"
                    disabled={editSaving}
                    class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {editSaving ? 'Saving...' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onclick={cancelEdit}
                    class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            {:else}
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-medium text-gray-900">{product.name}</p>
                  <p class="text-sm text-gray-600">
                    GTIN {product.gtin}
                    {#if product.internal_reference}
                      · Reference {product.internal_reference}
                    {/if}
                  </p>
                  {#if product.gs1_valid === false}
                    <p class="mt-1 text-xs font-medium text-amber-700">
                      Not a valid GS1 GTIN — correct it before encoding it on a label.
                    </p>
                  {/if}
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    onclick={() => startEdit(product)}
                    class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Edit
                  </button>
                  {#if confirmDeleteId === product.id}
                    <span class="text-xs text-gray-500">Delete saved product?</span>
                    <button
                      type="button"
                      onclick={() => removeProduct(product)}
                      disabled={isDeleting}
                      class="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      onclick={() => (confirmDeleteId = null)}
                      class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                  {:else}
                    <button
                      type="button"
                      onclick={() => removeProduct(product)}
                      class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Delete
                    </button>
                  {/if}
                </div>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}

    <form
      onsubmit={(event) => {
        event.preventDefault();
        createProduct();
      }}
      class="space-y-3 border-t border-gray-200 pt-4"
    >
      <h3 class="text-sm font-semibold text-gray-900">Add a product</h3>
      <div class="grid gap-3 sm:grid-cols-3">
        <div>
          <label for="product_name" class="mb-1 block text-sm font-medium text-gray-700">
            Product Name
          </label>
          <input
            id="product_name"
            type="text"
            bind:value={formData.name}
            maxlength="120"
            required
            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {#if errors.name}
            <p class="mt-1 text-sm text-red-600">{errors.name}</p>
          {/if}
        </div>
        <div>
          <label for="product_reference" class="mb-1 block text-sm font-medium text-gray-700">
            Internal Reference <span class="font-normal text-gray-500">(optional)</span>
          </label>
          <input
            id="product_reference"
            type="text"
            bind:value={formData.internal_reference}
            maxlength="50"
            autocomplete="off"
            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {#if errors.internal_reference}
            <p class="mt-1 text-sm text-red-600">{errors.internal_reference}</p>
          {/if}
        </div>
        <div>
          <label for="product_gtin" class="mb-1 block text-sm font-medium text-gray-700">GTIN</label
          >
          <input
            id="product_gtin"
            type="text"
            inputmode="numeric"
            bind:value={formData.gtin}
            maxlength="14"
            placeholder="00123456789012"
            required
            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {#if errors.gtin}
            <p class="mt-1 text-sm text-red-600">{errors.gtin}</p>
          {/if}
          {#if gtinWarning}
            <p class="mt-1 text-sm text-amber-700">{gtinWarning}</p>
          {/if}
        </div>
      </div>
      <div class="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save product'}
        </button>
      </div>
    </form>
  {/if}
</section>
