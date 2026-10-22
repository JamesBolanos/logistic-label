<script>
  import { onMount } from 'svelte';
  import PrintBridgeSettings from '#lib/components/Labels/PrintBridgeSettings.svelte';
  import SavedProducts from '#lib/components/Labels/SavedProducts.svelte';
  import { createOperationId, trackProductEvent } from '#lib/analytics/client.ts';
  import { classifyHttpFailure } from '#lib/analytics/events.ts';

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

  let exporting = $state(false);
  let exportMessage = $state('');

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
        next_serial_reference:
          data.settings.next_serial_reference || defaultSettings.next_serial_reference
      };
    } catch (error) {
      formError = error.message || 'Failed to load settings';
    } finally {
      isLoading = false;
    }
  }

  async function saveSettings() {
    const startedAt = Date.now();
    let responseStatus = null;
    isSaving = true;
    errors = {};
    formError = '';
    statusMessage = '';

    try {
      const response = await fetch('/api/settings', {
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
        throw new Error(data.message || 'Failed to save settings');
      }

      formData = {
        company_name: data.settings.company_name,
        gs1_company_prefix: data.settings.gs1_company_prefix,
        extension_digit: data.settings.extension_digit,
        next_serial_reference: data.settings.next_serial_reference
      };
      statusMessage = 'Label settings saved.';
      trackProductEvent('company_settings_saved', { setup_type: data.setupType });
    } catch (error) {
      formError = error.message || 'Failed to save settings';
      trackProductEvent('workflow_failed', {
        step: 'settings_save',
        error_category: responseStatus === null ? 'network' : classifyHttpFailure(responseStatus),
        duration_ms: Date.now() - startedAt
      });
    } finally {
      isSaving = false;
    }
  }

  async function exportData() {
    if (exporting) return;
    exporting = true;
    exportMessage = '';

    try {
      const response = await fetch('/api/export/excel');
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition') || '';
      let filename = 'logistic-label-data.xlsx';
      const match = contentDisposition.match(/filename="([^"]+)"/);
      if (match?.[1]) {
        filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      exportMessage = 'Data exported successfully.';
    } catch (err) {
      console.error(err);
      exportMessage = 'Failed to export data. Please try again.';
    } finally {
      exporting = false;
    }
  }
</script>

<svelte:head>
  <title>Settings - GS1-128 Logistic Label Generator</title>
  <meta
    name="description"
    content="Configure GS1 Company Prefix settings, save products, manage your LAN printer, and export your data."
  />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Settings</h1>
    <p class="mt-2 text-sm text-muted-foreground">
      Configure the GS1 Company Prefix used to allocate SSCCs, save the products you ship often,
      manage your LAN printer, and export a copy of your data.
    </p>
  </div>

  {#if formError}
    <div
      class="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300"
      role="alert"
    >
      {formError}
    </div>
  {/if}

  {#if statusMessage}
    <div
      class="rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 p-4 text-sm text-green-700 dark:text-green-300"
    >
      <p>{statusMessage}</p>
      <a
        href="/labels"
        class="mt-2 inline-flex font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:text-blue-300"
      >
        Continue to choose a shipping situation →
      </a>
    </div>
  {/if}

  <section
    aria-labelledby="label-settings-heading"
    class="space-y-6 rounded-lg border border-border-default bg-surface p-6 shadow"
  >
    <div>
      <h2 id="label-settings-heading" class="text-xl font-semibold text-foreground">
        Label settings
      </h2>
      <p class="mt-2 text-sm text-muted-foreground">
        Configure the GS1 Company Prefix used to allocate SSCCs for your logistic labels.
      </p>
    </div>

    <form
      onsubmit={(event) => {
        event.preventDefault();
        saveSettings();
      }}
      class="space-y-6"
    >
      {#if isLoading}
        <div class="flex h-32 items-center justify-center">
          <div
            class="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"
          ></div>
        </div>
      {:else}
        <div>
          <label for="company_name" class="mb-1 block text-sm font-medium text-muted-foreground">
            Company Name
          </label>
          <input
            id="company_name"
            type="text"
            bind:value={formData.company_name}
            class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxlength="120"
            required
          />
          {#if errors.company_name}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.company_name}</p>
          {/if}
        </div>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div class="sm:col-span-2">
            <label
              for="gs1_company_prefix"
              class="mb-1 block text-sm font-medium text-muted-foreground"
            >
              GS1 Company Prefix
            </label>
            <input
              id="gs1_company_prefix"
              type="text"
              inputmode="numeric"
              bind:value={formData.gs1_company_prefix}
              class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1234567"
              maxlength="12"
              required
            />
            {#if errors.gs1_company_prefix}
              <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.gs1_company_prefix}</p>
            {/if}
            <p class="mt-1 text-xs text-subtle-foreground">
              Use the numeric prefix licensed to your organization by a GS1 Member Organisation. Do
              not invent a prefix.
            </p>
          </div>

          <div>
            <label
              for="extension_digit"
              class="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Extension Digit
            </label>
            <input
              id="extension_digit"
              type="text"
              inputmode="numeric"
              bind:value={formData.extension_digit}
              class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxlength="1"
              required
            />
            {#if errors.extension_digit}
              <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.extension_digit}</p>
            {/if}
            <p class="mt-1 text-xs text-subtle-foreground">
              This digit expands SSCC capacity. It does not identify a packaging level.
            </p>
          </div>
        </div>

        <div>
          <label
            for="next_serial_reference"
            class="mb-1 block text-sm font-medium text-muted-foreground"
          >
            Next Serial Reference
          </label>
          <input
            id="next_serial_reference"
            type="number"
            bind:value={formData.next_serial_reference}
            class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            step="1"
            required
          />
          {#if errors.next_serial_reference}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.next_serial_reference}
            </p>
          {/if}
          <p class="mt-1 text-xs text-subtle-foreground">
            The application tries this number next when saving a label, then advances the sequence.
            Change it only when coordinating an existing numbering sequence.
          </p>
        </div>

        <div class="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      {/if}
    </form>
  </section>

  <SavedProducts />

  <PrintBridgeSettings />

  <section
    aria-labelledby="data-export-heading"
    class="space-y-4 rounded-lg border border-border-default bg-surface p-6 shadow"
  >
    <div>
      <h2 id="data-export-heading" class="text-xl font-semibold text-foreground">Data Export</h2>
      <p class="mt-2 text-sm text-muted-foreground">
        Download all of your data as an Excel file for your records.
      </p>
    </div>
    <p class="text-sm leading-6 text-muted-foreground">
      This export includes your account information, company settings (including GS1 company
      prefix), and every label you've created in the system.
    </p>
    <div>
      <button
        type="button"
        onclick={exportData}
        disabled={exporting}
        class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
      >
        {exporting ? 'Exporting...' : 'Download all my data (.XLSX)'}
      </button>
      {#if exportMessage}
        <p class="mt-2 text-sm text-muted-foreground" role="status">{exportMessage}</p>
      {/if}
    </div>
  </section>
</div>
