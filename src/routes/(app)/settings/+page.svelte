<script>
  import { page } from '$app/state';
  import { superForm } from 'sveltekit-superforms';
  import AccountPreferences from '#lib/components/Settings/AccountPreferences.svelte';
  import { createOperationId, trackProductEvent } from '#lib/analytics/client.ts';
  import { classifyHttpFailure } from '#lib/analytics/events.ts';

  let { data } = $props();

  const { form, errors, message, enhance, submitting } = superForm(data.form, {
    onUpdated({ form }) {
      if (form.valid && form.message === undefined && form.data) {
        statusMessage = 'Label settings saved.';
        trackProductEvent('company_settings_saved', { setup_type: 'update' });
        formError = '';
      }
    },
    onError({ result }) {
      formError = result.error?.message || 'Failed to save settings';
    }
  });

  let statusMessage = $state('');
  let formError = $state('');
</script>

<svelte:head>
  <title>Settings - GS1-128 Logistic Label Generator</title>
  <meta
    name="description"
    content="Manage your account preferences and configure the GS1 Company Prefix and company profile used on your logistic labels."
  />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Settings</h1>
    <p class="mt-2 text-sm text-muted-foreground">
      Manage your account preferences and the company profile and GS1 license details used on your
      logistic labels.
    </p>
  </div>

  {#if formError || $message}
    <div
      class="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300"
      role="alert"
    >
      {formError || $message}
    </div>
  {/if}

  {#if statusMessage}
    <div
      class="rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 p-4 text-sm text-green-700 dark:text-green-300"
    >
      <p>{statusMessage}</p>
      <a
        href="/labels"
        class="mt-2 inline-flex font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200"
      >
        Continue to choose a shipping situation →
      </a>
    </div>
  {/if}

  <AccountPreferences user={page.data.user} />

  <section
    aria-labelledby="label-settings-heading"
    class="space-y-6 rounded-lg border border-border-default bg-surface p-6 shadow"
  >
    <div>
      <h2 id="label-settings-heading" class="text-xl font-semibold text-foreground">
        Company profile and GS1 license
      </h2>
      <p class="mt-2 text-sm text-muted-foreground">
        Configure the GS1 Company Prefix used to allocate SSCCs for your logistic labels.
      </p>
    </div>

    <form method="POST" action="?/saveSettings" use:enhance class="space-y-6">
      <div>
        <label for="company_name" class="mb-1 block text-sm font-medium text-muted-foreground">
          Company Name
        </label>
        <input
          id="company_name"
          name="company_name"
          type="text"
          bind:value={$form.company_name}
          class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxlength="120"
          required
        />
        {#if $errors.company_name}
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">{$errors.company_name}</p>
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
            name="gs1_company_prefix"
            type="text"
            inputmode="numeric"
            bind:value={$form.gs1_company_prefix}
            class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1234567"
            maxlength="12"
            required
          />
          {#if $errors.gs1_company_prefix}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">{$errors.gs1_company_prefix}</p>
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
            name="extension_digit"
            type="text"
            inputmode="numeric"
            bind:value={$form.extension_digit}
            class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxlength="1"
            required
          />
          {#if $errors.extension_digit}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">{$errors.extension_digit}</p>
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
          name="next_serial_reference"
          type="number"
          bind:value={$form.next_serial_reference}
          class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1"
          step="1"
          required
        />
        {#if $errors.next_serial_reference}
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">
            {$errors.next_serial_reference}
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
          disabled={$submitting}
          class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
        >
          {$submitting ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  </section>
</div>
