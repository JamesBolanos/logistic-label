<script>
  import { onMount } from 'svelte';

  const defaultSettings = {
    company_name: 'Company Name',
    gs1_company_prefix: '',
    extension_digit: '0',
    next_serial_reference: 1
  };

  let formData = $state({ ...defaultSettings });
  let errors = $state({});
  let isLoading = $state(true);
  let isSaving = $state(false);
  let statusMessage = $state('');
  let formError = $state('');

  onMount(loadSettings);

  async function loadSettings() {
    isLoading = true;
    formError = '';

    try {
      const response = await fetch('/api/settings');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load settings');
      }

      formData = {
        company_name: data.settings.company_name || defaultSettings.company_name,
        gs1_company_prefix: data.settings.gs1_company_prefix || '',
        extension_digit: data.settings.extension_digit || defaultSettings.extension_digit,
        next_serial_reference: data.settings.next_serial_reference || defaultSettings.next_serial_reference
      };
    } catch (error) {
      formError = error.message || 'Failed to load settings';
    } finally {
      isLoading = false;
    }
  }

  async function saveSettings() {
    isSaving = true;
    errors = {};
    formError = '';
    statusMessage = '';

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (!response.ok) {
        errors = data.errors || {};
        throw new Error(data.message || 'Failed to save settings');
      }

      formData = {
        company_name: data.settings.company_name,
        gs1_company_prefix: data.settings.gs1_company_prefix,
        extension_digit: data.settings.extension_digit,
        next_serial_reference: data.settings.next_serial_reference
      };
      statusMessage = 'Label settings saved.';
    } catch (error) {
      formError = error.message || 'Failed to save settings';
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:head>
  <title>Label Settings - GS1-128 Logistic Label Generator</title>
  <meta name="description" content="Configure GS1 Company Prefix settings for logistic label generation." />
</svelte:head>

<div class="max-w-3xl space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Label Settings</h1>
    <p class="mt-2 text-sm text-gray-600">
      Configure the GS1 Company Prefix used to allocate SSCCs for your logistic labels.
    </p>
  </div>

  {#if formError}
    <div class="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {formError}
    </div>
  {/if}

  {#if statusMessage}
    <div class="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
      {statusMessage}
    </div>
  {/if}

  <form
    onsubmit={(event) => {
      event.preventDefault();
      saveSettings();
    }}
    class="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow"
  >
    {#if isLoading}
      <div class="flex h-32 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    {:else}
      <div>
        <label for="company_name" class="block text-sm font-medium text-gray-700 mb-1">
          Company Name
        </label>
        <input
          id="company_name"
          type="text"
          bind:value={formData.company_name}
          class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxlength="120"
          required
        />
        {#if errors.company_name}
          <p class="mt-1 text-sm text-red-600">{errors.company_name}</p>
        {/if}
      </div>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div class="sm:col-span-2">
          <label for="gs1_company_prefix" class="block text-sm font-medium text-gray-700 mb-1">
            GS1 Company Prefix
          </label>
          <input
            id="gs1_company_prefix"
            type="text"
            inputmode="numeric"
            bind:value={formData.gs1_company_prefix}
            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1234567"
            maxlength="12"
            required
          />
          {#if errors.gs1_company_prefix}
            <p class="mt-1 text-sm text-red-600">{errors.gs1_company_prefix}</p>
          {/if}
          <p class="mt-1 text-xs text-gray-500">
            Use the numeric prefix assigned to your organization by GS1.
          </p>
        </div>

        <div>
          <label for="extension_digit" class="block text-sm font-medium text-gray-700 mb-1">
            Extension Digit
          </label>
          <input
            id="extension_digit"
            type="text"
            inputmode="numeric"
            bind:value={formData.extension_digit}
            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxlength="1"
            required
          />
          {#if errors.extension_digit}
            <p class="mt-1 text-sm text-red-600">{errors.extension_digit}</p>
          {/if}
        </div>
      </div>

      <div>
        <label for="next_serial_reference" class="block text-sm font-medium text-gray-700 mb-1">
          Next Serial Reference
        </label>
        <input
          id="next_serial_reference"
          type="number"
          bind:value={formData.next_serial_reference}
          class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1"
          step="1"
          required
        />
        {#if errors.next_serial_reference}
          <p class="mt-1 text-sm text-red-600">{errors.next_serial_reference}</p>
        {/if}
        <p class="mt-1 text-xs text-gray-500">
          This number increments after each generated SSCC.
        </p>
      </div>

      <div class="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    {/if}
  </form>
</div>
