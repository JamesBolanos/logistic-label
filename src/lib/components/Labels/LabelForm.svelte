<script>
  import { validateLabelForm } from '$lib/validation/formValidation';
  import {
    DEFAULT_PRINT_LAYOUT,
    getLabelTypeName,
    HOMOGENEOUS_DATE_OPTIONS,
    LABEL_TYPES,
    PACKAGING_LEVELS,
    SSCC_PRINT_LAYOUT_OPTIONS
  } from '$lib/labels/workflows.js';

  let { labelType, onsubmit, onback } = $props();

  let formData = $state({
    label_type: '',
    gtin: '',
    packaging_level: '',
    quantity: '',
    lot_number: '',
    date_ai: '',
    date_value: '',
    print_layout: DEFAULT_PRINT_LAYOUT
  });
  let isLoading = $state(false);
  let errors = $state({});
  let formError = $state('');

  $effect(() => {
    formData.label_type = labelType;
  });

  async function handleSubmit() {
    const validation = validateLabelForm(formData);

    if (!validation.isValid) {
      errors = validation.errors;
      return;
    }

    isLoading = true;
    formError = '';
    errors = {};

    try {
      onsubmit?.({ ...formData });
    } catch (error) {
      console.error('Form submission error:', error);
      formError = 'An unexpected error occurred. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    handleSubmit();
  }}
  class="space-y-6 rounded-lg bg-white p-6 shadow-md"
>
  <div>
    <p class="text-sm font-semibold uppercase tracking-wide text-blue-600">Step 2 of 3</p>
    <h2 class="mt-1 text-xl font-bold text-gray-900">{getLabelTypeName(labelType)} label</h2>
  </div>

  {#if formError}
    <div class="rounded-md border border-red-400 bg-red-100 p-4 text-red-700">
      {formError}
    </div>
  {/if}

  {#if labelType === LABEL_TYPES.SSCC_ONLY}
    <div class="space-y-4">
      <div class="rounded-md border border-blue-200 bg-blue-50 p-4">
        <h3 class="font-semibold text-blue-950">This label identifies one logistic unit</h3>
        <p class="mt-2 text-sm text-blue-900">
          The barcode will contain only AI (00) and the allocated SSCC. Products, quantities, lots,
          dates, weights, destinations, and routing are not encoded.
        </p>
      </div>
      <p class="text-sm text-gray-600">
        Use this when another system, shipment message, spreadsheet, or internal process associates
        the SSCC with the logistic unit's contents.
      </p>

      <fieldset>
        <legend class="mb-2 text-sm font-medium text-gray-700">Print layout</legend>
        <div class="grid gap-3">
          {#each SSCC_PRINT_LAYOUT_OPTIONS as layout (layout.value)}
            <label
              class={`flex gap-3 rounded-md border p-3 ${
                layout.available
                  ? 'cursor-pointer border-gray-300 bg-white hover:border-blue-400'
                  : 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-70'
              }`}
            >
              <input
                type="radio"
                name="print_layout"
                value={layout.value}
                bind:group={formData.print_layout}
                disabled={!layout.available}
                class="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                <span class="block text-sm font-medium text-gray-900">{layout.label}</span>
                <span class="mt-1 block text-xs text-gray-600">{layout.description}</span>
              </span>
            </label>
          {/each}
        </div>
        {#if errors.print_layout}
          <p class="mt-2 text-sm text-red-600">{errors.print_layout}</p>
        {/if}
      </fieldset>
    </div>
  {:else}
    <div class="space-y-5">
      <div>
        <label for="gtin" class="mb-1 block text-sm font-medium text-gray-700">
          Contained trade item GTIN
        </label>
        <input
          type="text"
          id="gtin"
          bind:value={formData.gtin}
          class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="00123456789012"
          maxlength="14"
          inputmode="numeric"
          required
        />
        {#if errors.gtin}
          <p class="mt-1 text-sm text-red-600">{errors.gtin}</p>
        {/if}
        <p class="mt-1 text-xs text-gray-500">
          Enter the GTIN assigned to the highest packaging level contained. GTIN-8, GTIN-12, and
          GTIN-13 values are padded to 14 digits when encoded.
        </p>
      </div>

      <div>
        <label for="packaging_level" class="mb-1 block text-sm font-medium text-gray-700">
          What does this GTIN identify?
        </label>
        <select
          id="packaging_level"
          bind:value={formData.packaging_level}
          class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select the contained trade item level</option>
          {#each PACKAGING_LEVELS as level (level.value)}
            <option value={level.value}>{level.label}</option>
          {/each}
        </select>
        {#if errors.packaging_level}
          <p class="mt-1 text-sm text-red-600">{errors.packaging_level}</p>
        {/if}
      </div>

      <div>
        <label for="quantity" class="mb-1 block text-sm font-medium text-gray-700">
          Number of trade items identified by this GTIN
        </label>
        <input
          type="number"
          id="quantity"
          bind:value={formData.quantity}
          class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1"
          max="9999"
          step="1"
          required
        />
        {#if errors.quantity}
          <p class="mt-1 text-sm text-red-600">{errors.quantity}</p>
        {/if}
      </div>

      <fieldset class="space-y-4 rounded-md border border-gray-200 p-4">
        <legend class="px-1 text-sm font-medium text-gray-700">
          Optional product traceability
        </legend>

        <div>
          <label for="lot_number" class="mb-1 block text-sm font-medium text-gray-700">
            Batch or lot number — AI (10)
          </label>
          <input
            type="text"
            id="lot_number"
            bind:value={formData.lot_number}
            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxlength="20"
            autocomplete="off"
          />
          {#if errors.lot_number}
            <p class="mt-1 text-sm text-red-600">{errors.lot_number}</p>
          {/if}
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="date_ai" class="mb-1 block text-sm font-medium text-gray-700">
              GS1 date type
            </label>
            <select
              id="date_ai"
              bind:value={formData.date_ai}
              onchange={(event) => {
                if (!event.currentTarget.value) formData.date_value = '';
              }}
              class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No date</option>
              {#each HOMOGENEOUS_DATE_OPTIONS as option (option.value)}
                <option value={option.value}>{option.label} — AI ({option.value})</option>
              {/each}
            </select>
            {#if errors.date_ai}
              <p class="mt-1 text-sm text-red-600">{errors.date_ai}</p>
            {/if}
          </div>

          <div>
            <label for="date_value" class="mb-1 block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              id="date_value"
              bind:value={formData.date_value}
              disabled={!formData.date_ai}
              required={Boolean(formData.date_ai)}
              class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
            {#if errors.date_value}
              <p class="mt-1 text-sm text-red-600">{errors.date_value}</p>
            {/if}
          </div>
        </div>

        <p class="text-xs text-gray-500">
          Choose the date type printed on the contained trade items. Leave both optional fields
          empty when they do not apply to the whole logistic unit. The preview checks that the
          selected values fit at the supported GS1-128 size.
        </p>
      </fieldset>
    </div>
  {/if}

  <div class="flex items-center justify-between gap-3">
    <button
      type="button"
      onclick={() => onback?.()}
      class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Change workflow
    </button>
    <button
      type="submit"
      class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      disabled={isLoading}
    >
      {isLoading ? 'Preparing...' : 'Review label'}
    </button>
  </div>
</form>
