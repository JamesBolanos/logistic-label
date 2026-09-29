<script>
  import { validateLabelForm } from '$lib/validation/formValidation';
  import { getAvailableScenarioForLabelType } from '$lib/labels/scenarios.js';
  import {
    DEFAULT_PRINT_LAYOUT,
    HOMOGENEOUS_DATE_OPTIONS,
    HOMOGENEOUS_PRINT_LAYOUT_OPTIONS,
    LABEL_TYPES,
    PACKAGING_LEVELS,
    PRINT_LAYOUTS,
    SSCC_PRINT_LAYOUT_OPTIONS,
    TRANSPORT_COUNT_TYPES,
    TRANSPORT_WEIGHT_UNITS
  } from '$lib/labels/workflows.js';

  let { labelType, companyName = '', onsubmit, onback } = $props();

  let formData = $state({
    label_type: '',
    gtin: '',
    packaging_level: '',
    quantity: '',
    lot_number: '',
    date_ai: '',
    date_value: '',
    print_layout: DEFAULT_PRINT_LAYOUT,
    ship_from: '',
    ship_to: '',
    purchase_order: '',
    carrier: '',
    gross_weight: '',
    gross_weight_unit: '',
    transport_count: '',
    transport_count_type: ''
  });
  let isLoading = $state(false);
  let errors = $state({});
  let formError = $state('');
  let companyNameApplied = $state(false);
  let selectedScenario = $derived(getAvailableScenarioForLabelType(labelType));

  $effect(() => {
    formData.label_type = labelType;
    if (!companyNameApplied && companyName) {
      formData.ship_from = companyName;
      companyNameApplied = true;
    }
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
    <h2 class="mt-1 text-xl font-bold text-gray-900">
      {selectedScenario?.title || 'Create a logistic label'}
    </h2>
  </div>

  {#if formError}
    <div class="rounded-md border border-red-400 bg-red-100 p-4 text-red-700">
      {formError}
    </div>
  {/if}

  {#if labelType === LABEL_TYPES.SSCC_ONLY}
    <div class="space-y-4">
      <div class="rounded-md border border-blue-200 bg-blue-50 p-4">
        <h3 class="font-semibold text-blue-950">Identify and route one shipping unit</h3>
        <p class="mt-2 text-sm text-blue-900">
          The printed transport information helps people route the shipment. The barcode contains
          only AI (00) and the allocated SSCC, which can link to your WMS, ASN, spreadsheet, or
          another shipment record.
        </p>
      </div>

      <fieldset class="space-y-4 rounded-md border border-gray-200 p-4">
        <legend class="px-1 text-sm font-medium text-gray-700">Transport information</legend>

        <!-- These fields are human-readable. Only the SSCC is encoded in the barcode. -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="ship_from" class="mb-1 block text-sm font-medium text-gray-700">
              Ship From
            </label>
            <textarea
              id="ship_from"
              bind:value={formData.ship_from}
              rows="3"
              maxlength="160"
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Company and origin address"></textarea>
            {#if errors.ship_from}
              <p class="mt-1 text-sm text-red-600">{errors.ship_from}</p>
            {/if}
            <p class="mt-1 text-xs text-gray-500">
              Put the company name on the first line, followed by the origin address.
            </p>
          </div>

          <div>
            <label for="ship_to" class="mb-1 block text-sm font-medium text-gray-700">
              Ship To
            </label>
            <textarea
              id="ship_to"
              bind:value={formData.ship_to}
              rows="3"
              maxlength="160"
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Customer and physical delivery address"></textarea>
            {#if errors.ship_to}
              <p class="mt-1 text-sm text-red-600">{errors.ship_to}</p>
            {/if}
            <p class="mt-1 text-xs text-gray-500">
              Put the destination name on the first line, followed by its physical address.
            </p>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="purchase_order" class="mb-1 block text-sm font-medium text-gray-700">
              PO Number <span class="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="purchase_order"
              type="text"
              bind:value={formData.purchase_order}
              maxlength="50"
              autocomplete="off"
              class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {#if errors.purchase_order}
              <p class="mt-1 text-sm text-red-600">{errors.purchase_order}</p>
            {/if}
          </div>

          <div>
            <label for="carrier" class="mb-1 block text-sm font-medium text-gray-700">
              Carrier <span class="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="carrier"
              type="text"
              bind:value={formData.carrier}
              maxlength="100"
              autocomplete="off"
              class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {#if errors.carrier}
              <p class="mt-1 text-sm text-red-600">{errors.carrier}</p>
            {/if}
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="gross_weight" class="mb-1 block text-sm font-medium text-gray-700">
              Gross Weight <span class="font-normal text-gray-500">(optional)</span>
            </label>
            <div class="grid grid-cols-[minmax(0,1fr)_5rem] gap-2">
              <input
                id="gross_weight"
                type="number"
                bind:value={formData.gross_weight}
                min="0.01"
                max="999999.99"
                step="0.01"
                class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                aria-label="Gross Weight unit"
                bind:value={formData.gross_weight_unit}
                class="w-full rounded-md border border-gray-300 px-2 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unit</option>
                {#each TRANSPORT_WEIGHT_UNITS as unit (unit.value)}
                  <option value={unit.value}>{unit.label}</option>
                {/each}
              </select>
            </div>
            {#if errors.gross_weight}
              <p class="mt-1 text-sm text-red-600">{errors.gross_weight}</p>
            {:else if errors.gross_weight_unit}
              <p class="mt-1 text-sm text-red-600">{errors.gross_weight_unit}</p>
            {/if}
          </div>

          <div>
            <label for="transport_count" class="mb-1 block text-sm font-medium text-gray-700">
              Count <span class="font-normal text-gray-500">(optional)</span>
            </label>
            <div class="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
              <input
                id="transport_count"
                type="number"
                bind:value={formData.transport_count}
                min="1"
                max="99999"
                step="1"
                class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                aria-label="Count type"
                bind:value={formData.transport_count_type}
                class="w-full rounded-md border border-gray-300 px-2 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Type</option>
                {#each TRANSPORT_COUNT_TYPES as type (type.value)}
                  <option value={type.value}>{type.label}</option>
                {/each}
              </select>
            </div>
            {#if errors.transport_count}
              <p class="mt-1 text-sm text-red-600">{errors.transport_count}</p>
            {:else if errors.transport_count_type}
              <p class="mt-1 text-sm text-red-600">{errors.transport_count_type}</p>
            {/if}
          </div>
        </div>

        <p class="text-xs text-gray-500">
          Ship From and Ship To are required. The remaining transport fields may be left empty when
          they do not apply.
        </p>
      </fieldset>

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
      <div class="rounded-md border border-blue-200 bg-blue-50 p-4">
        <h3 class="font-semibold text-blue-950">
          Describe several identical cases or items on one shipping unit
        </h3>
        <p class="mt-2 text-sm text-blue-900">
          The content barcode identifies the contained item with AI (02) and its count with AI (37).
          A separate bottom barcode identifies the complete shipping unit with AI (00) SSCC.
        </p>
      </div>

      <fieldset class="space-y-4 rounded-md border border-gray-200 p-4">
        <legend class="px-1 text-sm font-medium text-gray-700">Transport information</legend>

        <!-- These fields help people route the unit; they are printed but are not GS1 barcode data. -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="ship_from" class="mb-1 block text-sm font-medium text-gray-700">
              Ship From
            </label>
            <textarea
              id="ship_from"
              bind:value={formData.ship_from}
              rows="3"
              maxlength="160"
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Company and origin address"></textarea>
            {#if errors.ship_from}
              <p class="mt-1 text-sm text-red-600">{errors.ship_from}</p>
            {/if}
          </div>

          <div>
            <label for="ship_to" class="mb-1 block text-sm font-medium text-gray-700">
              Ship To
            </label>
            <textarea
              id="ship_to"
              bind:value={formData.ship_to}
              rows="3"
              maxlength="160"
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Customer and physical delivery address"></textarea>
            {#if errors.ship_to}
              <p class="mt-1 text-sm text-red-600">{errors.ship_to}</p>
            {/if}
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="purchase_order" class="mb-1 block text-sm font-medium text-gray-700">
              PO Number <span class="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="purchase_order"
              type="text"
              bind:value={formData.purchase_order}
              maxlength="50"
              autocomplete="off"
              class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {#if errors.purchase_order}
              <p class="mt-1 text-sm text-red-600">{errors.purchase_order}</p>
            {/if}
          </div>

          <div>
            <label for="carrier" class="mb-1 block text-sm font-medium text-gray-700">
              Carrier <span class="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="carrier"
              type="text"
              bind:value={formData.carrier}
              maxlength="100"
              autocomplete="off"
              class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {#if errors.carrier}
              <p class="mt-1 text-sm text-red-600">{errors.carrier}</p>
            {/if}
          </div>
        </div>

        <div class="max-w-sm">
          <label for="gross_weight" class="mb-1 block text-sm font-medium text-gray-700">
            Gross Weight <span class="font-normal text-gray-500">(optional)</span>
          </label>
          <div class="grid grid-cols-[minmax(0,1fr)_5rem] gap-2">
            <input
              id="gross_weight"
              type="number"
              bind:value={formData.gross_weight}
              min="0.01"
              max="999999.99"
              step="0.01"
              class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              aria-label="Gross Weight unit"
              bind:value={formData.gross_weight_unit}
              class="w-full rounded-md border border-gray-300 px-2 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unit</option>
              {#each TRANSPORT_WEIGHT_UNITS as unit (unit.value)}
                <option value={unit.value}>{unit.label}</option>
              {/each}
            </select>
          </div>
          {#if errors.gross_weight}
            <p class="mt-1 text-sm text-red-600">{errors.gross_weight}</p>
          {:else if errors.gross_weight_unit}
            <p class="mt-1 text-sm text-red-600">{errors.gross_weight_unit}</p>
          {/if}
        </div>

        <p class="text-xs text-gray-500">
          Ship From and Ship To are required. PO, carrier, and Gross Weight may be left empty.
        </p>
      </fieldset>

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
            oninput={(event) => {
              if (event.currentTarget.value) {
                formData.print_layout = PRINT_LAYOUTS.SIX_BY_EIGHT_SINGLE;
              }
            }}
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
                else formData.print_layout = PRINT_LAYOUTS.SIX_BY_EIGHT_SINGLE;
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
          Choose the date type printed on the contained trade items. Lot or date traceability needs
          the 6 × 8 layout so all three barcodes retain their full height.
        </p>
      </fieldset>

      <fieldset>
        <legend class="mb-2 text-sm font-medium text-gray-700">Print layout</legend>
        <div class="grid gap-3">
          {#each HOMOGENEOUS_PRINT_LAYOUT_OPTIONS as layout (layout.value)}
            <label
              class="flex cursor-pointer gap-3 rounded-md border border-gray-300 bg-white p-3 hover:border-blue-400"
            >
              <input
                type="radio"
                name="print_layout"
                value={layout.value}
                bind:group={formData.print_layout}
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
  {/if}

  <div class="flex items-center justify-between gap-3">
    <button
      type="button"
      onclick={() => onback?.()}
      class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Choose a different situation
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
