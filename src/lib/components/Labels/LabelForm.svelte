<!-- src/lib/components/Labels/LabelForm.svelte -->
<script>
  import { validateLabelForm } from '$lib/validation/formValidation';

  const today = new Date().toISOString().split('T')[0];
  const defaultFormData = {
    gtin: '',
    lot_number: '',
    production_date: today,
    quantity: '',
    weight_pounds: ''
  };

  let { onsubmit } = $props();

  let formData = $state({ ...defaultFormData });
  let isLoading = $state(false);
  let errors = $state({});
  let formError = $state('');

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

  function resetForm() {
    formData = { ...defaultFormData };
    errors = {};
    formError = '';
  }
</script>

<form onsubmit={(event) => { event.preventDefault(); handleSubmit(); }} class="space-y-6 bg-white p-6 rounded-lg shadow-md">
  <h2 class="text-xl font-bold mb-6">Create GS1-128 Logistic Label</h2>

  {#if formError}
    <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
      {formError}
    </div>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- GTIN Field -->
    <div>
      <label for="gtin" class="block text-sm font-medium text-gray-700 mb-1">
        GTIN (14 digits)
      </label>
      <input
        type="text"
        id="gtin"
        bind:value={formData.gtin}
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="00123456789012"
        maxlength="14"
        pattern="[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]"
        required
      />
      {#if errors.gtin}
        <p class="mt-1 text-sm text-red-600">{errors.gtin}</p>
      {/if}
      <p class="mt-1 text-xs text-gray-500">
        Enter the 14-digit Global Trade Item Number
      </p>
    </div>

    <!-- Lot Number Field -->
    <div>
      <label for="lot_number" class="block text-sm font-medium text-gray-700 mb-1">
        Lot Number
      </label>
      <input
        type="text"
        id="lot_number"
        bind:value={formData.lot_number}
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="LOT123ABC"
        maxlength="20"
        required
      />
      {#if errors.lot_number}
        <p class="mt-1 text-sm text-red-600">{errors.lot_number}</p>
      {/if}
      <p class="mt-1 text-xs text-gray-500">
        Enter the batch or lot number (alphanumeric, max 20 chars)
      </p>
    </div>

    <!-- Production Date Field -->
    <div>
      <label for="production_date" class="block text-sm font-medium text-gray-700 mb-1">
        Production Date
      </label>
      <input
        type="date"
        id="production_date"
        bind:value={formData.production_date}
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        max={today}
        required
      />
      {#if errors.production_date}
        <p class="mt-1 text-sm text-red-600">{errors.production_date}</p>
      {/if}
    </div>

    <!-- Quantity Field -->
    <div>
      <label for="quantity" class="block text-sm font-medium text-gray-700 mb-1">
        Quantity
      </label>
      <input
        type="number"
        id="quantity"
        bind:value={formData.quantity}
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        min="1"
        max="99999999"
        step="1"
        required
      />
      {#if errors.quantity}
        <p class="mt-1 text-sm text-red-600">{errors.quantity}</p>
      {/if}
      <p class="mt-1 text-xs text-gray-500">
        Enter the number of items in the logistic unit
      </p>
    </div>

    <!-- Weight Field -->
    <div>
      <label for="weight_pounds" class="block text-sm font-medium text-gray-700 mb-1">
        Weight (lbs)
      </label>
      <input
        type="number"
        id="weight_pounds"
        bind:value={formData.weight_pounds}
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        min="0.1"
        max="9999.9"
        step="0.1"
        required
      />
      {#if errors.weight_pounds}
        <p class="mt-1 text-sm text-red-600">{errors.weight_pounds}</p>
      {/if}
      <p class="mt-1 text-xs text-gray-500">
        Enter the weight in pounds (max 9,999.9)
      </p>
    </div>
  </div>

  <div class="flex items-center justify-end space-x-3">
    <button
      type="button"
      onclick={resetForm}
      class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      Reset
    </button>
    <button
      type="submit"
      class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      disabled={isLoading}
    >
      {#if isLoading}
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Saving...
      {:else}
        Save and Preview
      {/if}
    </button>
  </div>
</form>
