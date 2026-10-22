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

  const NET_CONTENT_UNITS = ['g', 'kg', 'mg', 'lb', 'oz', 'ml', 'l', 'fl oz', 'units', 'm', 'cm'];

  let formData = $state({
    name: '',
    brand: '',
    internal_reference: '',
    gtin: '',
    net_content_value: '',
    net_content_unit: ''
  });
  let errors = $state({});
  let isSaving = $state(false);
  let formError = $state('');

  let editingId = $state(null);
  let editData = $state({
    name: '',
    brand: '',
    internal_reference: '',
    gtin: '',
    net_content_value: '',
    net_content_unit: ''
  });
  let editErrors = $state({});
  let editSaving = $state(false);

  let confirmDeleteId = $state(null);
  let isDeleting = $state(false);

  let gtinWarning = $derived(gtinWarningFor(formData.gtin));
  let editGtinWarning = $derived(editingId === null ? '' : gtinWarningFor(editData.gtin));

  function formatNetContent(product) {
    const value = product.net_content_value;
    const unit = product.net_content_unit;
    if (value && unit) return `${value} ${unit}`;
    if (value) return value;
    if (unit) return unit;
    return '';
  }

  function formatProductMetaLine(product) {
    const parts = [];
    if (product.brand) parts.push(`Brand: ${product.brand}`);
    if (product.gtin) parts.push(`GTIN: ${product.gtin}`);
    const netContent = formatNetContent(product);
    if (netContent) parts.push(netContent);
    if (!parts.length && product.internal_reference)
      parts.push(`Reference: ${product.internal_reference}`);
    if (!parts.length) return '';
    let line = parts.join(' · ');
    if (product.internal_reference && !(product.brand || netContent)) {
      line = `${line} · Reference: ${product.internal_reference}`;
    } else if (product.internal_reference && (product.brand || netContent)) {
      line = `${line} · Reference: ${product.internal_reference}`;
    }
    // Keep reference visible if it's the only extra info beyond what's already shown?
    // We'll show reference separately if present and not duplicating in a weird way
    return line;
  }

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
      formData = {
        name: '',
        brand: '',
        internal_reference: '',
        gtin: '',
        net_content_value: '',
        net_content_unit: ''
      };
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
      brand: product.brand || '',
      internal_reference: product.internal_reference || '',
      gtin: product.gtin,
      net_content_value: product.net_content_value || '',
      net_content_unit: product.net_content_unit || ''
    };
    editErrors = {};
    confirmDeleteId = null;
  }

  function cancelEdit() {
    editingId = null;
    editData = {
      name: '',
      brand: '',
      internal_reference: '',
      gtin: '',
      net_content_value: '',
      net_content_unit: ''
    };
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
  class="space-y-4 rounded-lg border border-border-default bg-surface p-6 shadow"
>
  <div>
    <h2 id="saved-products-heading" class="text-xl font-semibold text-foreground">
      Saved products
    </h2>
    <p class="mt-2 text-sm text-muted-foreground">
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
      <div
        class="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300"
        role="alert"
      >
        {listError}
      </div>
    {/if}

    {#if formError}
      <div
        class="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300"
        role="alert"
      >
        {formError}
      </div>
    {/if}

    {#if products.length === 0}
      <p class="text-sm text-subtle-foreground">No saved products yet. Add your first one below.</p>
    {:else}
      <ul class="divide-y divide-border-default rounded-md border border-border-default">
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
                <div class="space-y-3">
                  <div class="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        for="edit_name_{product.id}"
                        class="mb-1 block text-sm font-medium text-muted-foreground"
                      >
                        Product Name <span class="text-red-600 dark:text-red-400">*</span>
                      </label>
                      <input
                        id="edit_name_{product.id}"
                        type="text"
                        bind:value={editData.name}
                        maxlength="120"
                        required
                        class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {#if editErrors.name}
                        <p class="mt-1 text-sm text-red-600 dark:text-red-400">{editErrors.name}</p>
                      {/if}
                    </div>
                    <div>
                      <label
                        for="edit_brand_{product.id}"
                        class="mb-1 block text-sm font-medium text-muted-foreground"
                      >
                        Brand Name <span class="font-normal text-subtle-foreground">(optional)</span
                        >
                      </label>
                      <input
                        id="edit_brand_{product.id}"
                        type="text"
                        bind:value={editData.brand}
                        maxlength="120"
                        autocomplete="off"
                        class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {#if editErrors.brand}
                        <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                          {editErrors.brand}
                        </p>
                      {/if}
                    </div>
                  </div>
                  <div class="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        for="edit_gtin_{product.id}"
                        class="mb-1 block text-sm font-medium text-muted-foreground"
                      >
                        GTIN <span class="text-red-600 dark:text-red-400">*</span>
                      </label>
                      <input
                        id="edit_gtin_{product.id}"
                        type="text"
                        inputmode="numeric"
                        bind:value={editData.gtin}
                        maxlength="14"
                        required
                        class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {#if editErrors.gtin}
                        <p class="mt-1 text-sm text-red-600 dark:text-red-400">{editErrors.gtin}</p>
                      {/if}
                      {#if editGtinWarning}
                        <p class="mt-1 text-sm text-amber-700 dark:text-amber-300">
                          {editGtinWarning}
                        </p>
                      {/if}
                    </div>
                    <div>
                      <label
                        for="edit_reference_{product.id}"
                        class="mb-1 block text-sm font-medium text-muted-foreground"
                      >
                        Internal Reference/SKU <span class="font-normal text-subtle-foreground"
                          >(optional)</span
                        >
                      </label>
                      <input
                        id="edit_reference_{product.id}"
                        type="text"
                        bind:value={editData.internal_reference}
                        maxlength="50"
                        autocomplete="off"
                        class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {#if editErrors.internal_reference}
                        <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                          {editErrors.internal_reference}
                        </p>
                      {/if}
                    </div>
                  </div>
                  <div>
                    <span class="mb-1 block text-sm font-medium text-muted-foreground">
                      Net Content <span class="font-normal text-subtle-foreground">(optional)</span>
                    </span>
                    <div class="grid grid-cols-[1fr_auto] gap-2 sm:max-w-md">
                      <input
                        type="text"
                        inputmode="decimal"
                        bind:value={editData.net_content_value}
                        placeholder="500"
                        aria-label="Net content value"
                        class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        bind:value={editData.net_content_unit}
                        aria-label="Net content unit"
                        class="rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface text-foreground"
                      >
                        <option value="">Unit</option>
                        {#each NET_CONTENT_UNITS as unit (unit)}
                          <option value={unit}>{unit}</option>
                        {/each}
                      </select>
                    </div>
                    {#if editErrors.net_content_value}
                      <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                        {editErrors.net_content_value}
                      </p>
                    {/if}
                    {#if editErrors.net_content_unit}
                      <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                        {editErrors.net_content_unit}
                      </p>
                    {/if}
                  </div>
                </div>
                <div class="flex gap-2">
                  <button
                    type="submit"
                    disabled={editSaving}
                    class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
                  >
                    {editSaving ? 'Saving...' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onclick={cancelEdit}
                    class="inline-flex items-center justify-center rounded-md border border-border-strong bg-surface px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            {:else}
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-medium text-foreground">{product.name}</p>
                  <p class="text-sm text-muted-foreground">
                    {#if product.brand}
                      Brand: {product.brand}
                      {#if product.gtin || formatNetContent(product) || product.internal_reference}
                        ·
                      {/if}
                    {/if}
                    {#if product.gtin}
                      GTIN: {product.gtin}
                      {#if formatNetContent(product) || product.internal_reference}
                        ·
                      {/if}
                    {/if}
                    {#if formatNetContent(product)}
                      {formatNetContent(product)}
                      {#if product.internal_reference}
                        ·
                      {/if}
                    {/if}
                    {#if product.internal_reference}
                      Reference: {product.internal_reference}
                    {/if}
                  </p>
                  {#if product.gs1_valid === false}
                    <p class="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                      Not a valid GS1 GTIN — correct it before encoding it on a label.
                    </p>
                  {/if}
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    onclick={() => startEdit(product)}
                    class="inline-flex items-center justify-center rounded-md border border-border-strong bg-surface px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
                  >
                    Edit
                  </button>
                  {#if confirmDeleteId === product.id}
                    <span class="text-xs text-subtle-foreground">Delete saved product?</span>
                    <button
                      type="button"
                      onclick={() => removeProduct(product)}
                      disabled={isDeleting}
                      class="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
                    >
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      onclick={() => (confirmDeleteId = null)}
                      class="inline-flex items-center justify-center rounded-md border border-border-strong bg-surface px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
                    >
                      Cancel
                    </button>
                  {:else}
                    <button
                      type="button"
                      onclick={() => removeProduct(product)}
                      class="inline-flex items-center justify-center rounded-md border border-border-strong bg-surface px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
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
      class="space-y-3 border-t border-border-default pt-4"
    >
      <h3 class="text-sm font-semibold text-foreground">Add a product</h3>
      <div class="space-y-3">
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label for="product_name" class="mb-1 block text-sm font-medium text-muted-foreground">
              Product Name <span class="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              id="product_name"
              type="text"
              bind:value={formData.name}
              maxlength="120"
              required
              class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {#if errors.name}
              <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            {/if}
          </div>
          <div>
            <label for="product_brand" class="mb-1 block text-sm font-medium text-muted-foreground">
              Brand Name <span class="font-normal text-subtle-foreground">(optional)</span>
            </label>
            <input
              id="product_brand"
              type="text"
              bind:value={formData.brand}
              maxlength="120"
              autocomplete="off"
              class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {#if errors.brand}
              <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.brand}</p>
            {/if}
          </div>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label for="product_gtin" class="mb-1 block text-sm font-medium text-muted-foreground">
              GTIN <span class="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              id="product_gtin"
              type="text"
              inputmode="numeric"
              bind:value={formData.gtin}
              maxlength="14"
              placeholder="00123456789012"
              required
              class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {#if errors.gtin}
              <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.gtin}</p>
            {/if}
            {#if gtinWarning}
              <p class="mt-1 text-sm text-amber-700 dark:text-amber-300">{gtinWarning}</p>
            {/if}
          </div>
          <div>
            <label
              for="product_reference"
              class="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Internal Reference/SKU <span class="font-normal text-subtle-foreground"
                >(optional)</span
              >
            </label>
            <input
              id="product_reference"
              type="text"
              bind:value={formData.internal_reference}
              maxlength="50"
              autocomplete="off"
              class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {#if errors.internal_reference}
              <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.internal_reference}</p>
            {/if}
          </div>
        </div>
        <div>
          <span class="mb-1 block text-sm font-medium text-muted-foreground">
            Net Content <span class="font-normal text-subtle-foreground">(optional)</span>
          </span>
          <div class="grid grid-cols-[1fr_auto] gap-2 sm:max-w-md">
            <input
              type="text"
              inputmode="decimal"
              bind:value={formData.net_content_value}
              placeholder="500"
              aria-label="Net content value"
              class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              bind:value={formData.net_content_unit}
              aria-label="Net content unit"
              class="rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface text-foreground"
            >
              <option value="">Unit</option>
              {#each NET_CONTENT_UNITS as unit (unit)}
                <option value={unit}>{unit}</option>
              {/each}
            </select>
          </div>
          {#if errors.net_content_value}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.net_content_value}</p>
          {/if}
          {#if errors.net_content_unit}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.net_content_unit}</p>
          {/if}
        </div>
      </div>
      <div class="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save product'}
        </button>
      </div>
    </form>
  {/if}
</section>
