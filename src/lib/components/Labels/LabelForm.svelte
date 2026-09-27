<script>
  import { validateLabelForm } from '$lib/validation/formValidation';
  import { getLabelTypeName, LABEL_TYPES, PACKAGING_LEVELS } from '$lib/labels/workflows.js';

  let { labelType, onsubmit, onback } = $props();

  let formData = $state({
    label_type: '',
    gtin: '',
    packaging_level: '',
    quantity: '',
    contents_are_homogeneous: false
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
    </div>
  {:else}
    <div class="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
      This version encodes the contained trade item GTIN with AI (02) and the number of those trade
      items with AI (37). Lot, date, and weight are not included yet.
    </div>

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

      <div class="rounded-md border border-gray-200 bg-gray-50 p-4">
        <label class="flex items-start gap-3">
          <input
            type="checkbox"
            bind:checked={formData.contents_are_homogeneous}
            class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700">
            I confirm that every trade item counted on this logistic unit has the same GTIN entered
            above.
          </span>
        </label>
        {#if errors.contents_are_homogeneous}
          <p class="mt-2 text-sm text-red-600">{errors.contents_are_homogeneous}</p>
        {/if}
      </div>
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
