<script>
  import { onMount } from 'svelte';
  import { localizeHref } from '#lib/paraglide/runtime.js';
  import { m } from '#lib/paraglide/messages.js';
  import {
    defaultPrintSettings,
    sanitizePrintSettings,
    validatePrintSettings
  } from '#lib/printing/settings.ts';
  import { pingPrintBridge } from '#lib/printing/print-bridge-client.ts';

  let form = $state({ ...defaultPrintSettings });
  let errors = $state({});
  let loaded = $state(false);
  let busy = $state(false);
  let errorMessage = $state('');
  let statusMessage = $state('');
  let bridgeStatus = $state('idle'); // 'idle' | 'reachable' | 'unreachable'

  onMount(loadSettings);

  async function loadSettings() {
    busy = true;
    errorMessage = '';
    try {
      const response = await fetch(localizeHref('/api/settings'), { cache: 'no-store' });
      if (!response.ok) throw new Error(m.print_settings_unable_load());
      const { settings } = await response.json();
      form = Object.fromEntries(
        Object.entries(defaultPrintSettings).map(([key, fallback]) => [
          key,
          settings[key] ?? fallback
        ])
      );
      loaded = true;
    } catch (error) {
      errorMessage = error.message || m.print_settings_unable_load();
    } finally {
      busy = false;
    }
  }

  async function runAction(testOnly = false) {
    if (busy) return;
    statusMessage = '';
    errorMessage = '';
    const settings = sanitizePrintSettings(form);
    errors = validatePrintSettings(settings);
    if (Object.keys(errors).length) return;
    busy = true;
    try {
      if (testOnly) {
        await pingPrintBridge(settings);
        bridgeStatus = 'reachable';
        statusMessage =
          'Bridge is reachable. This checks the bridge only; no label was sent to the printer.';
      } else {
        const response = await fetch(localizeHref('/api/settings'), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        });
        const data = await response.json();
        if (!response.ok) {
          errors = data.errors || {};
          throw new Error(data.message || m.print_settings_unable_save());
        }
        form = settings;
        statusMessage = m.print_settings_saved();
      }
    } catch (error) {
      if (testOnly) bridgeStatus = 'unreachable';
      errorMessage = error.message || m.print_settings_unable_complete();
    } finally {
      busy = false;
    }
  }
</script>

<section
  aria-labelledby="printer-settings-heading"
  class="space-y-4 rounded-lg border border-border-default bg-surface p-6 shadow"
>
  <h2 id="printer-settings-heading" class="text-xl font-semibold text-foreground">
    {m.print_settings_lan_printer()}
  </h2>
  <section
    aria-labelledby="do-you-need-heading"
    class="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30"
  >
    <h3 id="do-you-need-heading" class="text-sm font-semibold text-foreground">
      {m.printbridge_need_this_title()}
    </h3>
    <p class="mt-1 text-sm leading-6 text-muted-foreground">
      {m.printbridge_need_this_body()}
    </p>
  </section>
  <p class="text-sm leading-6 text-muted-foreground">
    {m.print_settings_desc()}
  </p>
  <p
    class="rounded-md bg-blue-50 dark:bg-blue-950/40 px-3 py-2 text-sm font-medium text-blue-900 dark:text-blue-200"
  >
    {m.print_settings_flow()}
  </p>
  <p class="text-sm text-muted-foreground">
    {m.print_settings_need_bridge()}
    <a
      href={localizeHref('/print-bridge')}
      class="font-medium text-blue-700 dark:text-blue-300 underline"
      >{m.print_settings_view_print_bridge()}</a
    >.
  </p>
  <p class="text-sm text-muted-foreground">
    {m.print_settings_saved_account()}
  </p>
  {#if errorMessage}<p
      role="alert"
      class="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300"
    >
      <span aria-hidden="true">⚠</span>
      {errorMessage}
    </p>{/if}
  {#if statusMessage}<p
      role="status"
      class="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700 dark:bg-green-950/40 dark:text-green-300"
    >
      <span aria-hidden="true">✓</span>
      {statusMessage}
    </p>{/if}
  {#if !loaded}
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <span
        class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border-strong border-t-blue-600"
      ></span>
      {busy ? m.print_settings_loading() : m.print_settings_load_button()}
      {#if !busy}
        <button
          type="button"
          onclick={loadSettings}
          class="ml-2 text-sm font-medium text-blue-700 dark:text-blue-300"
          >{m.print_settings_load_button()}</button
        >
      {/if}
    </div>
  {:else}
    <form
      onsubmit={(event) => {
        event.preventDefault();
        runAction();
      }}
    >
      <fieldset disabled={busy} class="space-y-4 disabled:opacity-60">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              for="print_bridge_host"
              class="mb-1 block text-sm font-medium text-muted-foreground"
              >{m.print_settings_bridge_address()}</label
            >
            <select
              id="print_bridge_host"
              bind:value={form.print_bridge_host}
              class="w-full rounded-md border border-border-strong px-3 py-2"
            >
              <option value="127.0.0.1">{m.print_settings_127()}</option>
              <option value="localhost">{m.print_settings_localhost()}</option>
            </select>
            {#if errors.print_bridge_host}<p class="text-sm text-red-600 dark:text-red-400">
                {errors.print_bridge_host}
              </p>{/if}
          </div>
          <div>
            <label
              for="print_bridge_port"
              class="mb-1 block text-sm font-medium text-muted-foreground"
              >{m.print_settings_bridge_port()}</label
            >
            <input
              id="print_bridge_port"
              type="number"
              min="1"
              max="65535"
              step="1"
              required
              bind:value={form.print_bridge_port}
              title="Must match Print Bridge's listening port (default 18080)."
              class="w-full rounded-md border border-border-strong px-3 py-2"
            />
            {#if errors.print_bridge_port}<p class="text-sm text-red-600 dark:text-red-400">
                {errors.print_bridge_port}
              </p>{/if}
          </div>
          <div>
            <label
              for="printer_hostname"
              class="mb-1 block text-sm font-medium text-muted-foreground"
              >{m.print_settings_printer_ip()}</label
            >
            <input
              id="printer_hostname"
              type="text"
              maxlength="253"
              placeholder="192.168.1.100"
              bind:value={form.printer_hostname}
              class="w-full rounded-md border border-border-strong px-3 py-2"
            />
            {#if errors.printer_hostname}<p class="text-sm text-red-600 dark:text-red-400">
                {errors.printer_hostname}
              </p>{/if}
            <p class="mt-1 text-xs text-subtle-foreground">
              {m.print_settings_leave_empty()}
            </p>
          </div>
          <div>
            <label for="printer_port" class="mb-1 block text-sm font-medium text-muted-foreground"
              >{m.print_settings_printer_port()}</label
            >
            <input
              id="printer_port"
              type="number"
              min="1"
              max="65535"
              step="1"
              required
              bind:value={form.printer_port}
              class="w-full rounded-md border border-border-strong px-3 py-2"
            />
            {#if errors.printer_port}<p class="text-sm text-red-600 dark:text-red-400">
                {errors.printer_port}
              </p>{/if}
          </div>
          <div>
            <label for="printer_dpi" class="mb-1 block text-sm font-medium text-muted-foreground"
              >{m.print_settings_printer_resolution()}</label
            >
            <select
              id="printer_dpi"
              bind:value={form.printer_dpi}
              class="w-full rounded-md border border-border-strong px-3 py-2"
            >
              <option value={203}>203 dpi</option>
              <option value={300}>300 dpi</option>
              <option value={600}>600 dpi</option>
            </select>
            <p class="mt-1 text-xs text-subtle-foreground">
              Match this to your printer's DPI (check the printer label).
            </p>
            {#if errors.printer_dpi}<p class="text-sm text-red-600 dark:text-red-400">
                {errors.printer_dpi}
              </p>{/if}
          </div>
        </div>
        <ul class="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Allow local network access if your browser asks.</li>
          <li>Match the resolution and media to your printer.</li>
        </ul>
        <p class="text-sm text-muted-foreground">
          In Print Bridge's own settings, choose Physical mode for paper output.
        </p>
        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            onclick={() => runAction(true)}
            class="rounded-md border border-border-strong px-4 py-2 text-sm font-medium hover:bg-surface-muted"
            >{m.print_settings_test_connection()}</button
          >
          <button
            type="submit"
            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >{m.print_settings_save()}</button
          >
          <button
            type="button"
            onclick={() => {
              form.printer_hostname = '';
              runAction();
            }}
            class="rounded-md border border-border-strong px-4 py-2 text-sm font-medium hover:bg-surface-muted"
            >{m.print_settings_disable_printing()}</button
          >
        </div>
        <p class="text-xs text-subtle-foreground">
          Bridge status: {bridgeStatus === 'idle'
            ? 'not checked yet'
            : bridgeStatus === 'reachable'
              ? 'reachable'
              : 'unreachable'}.
        </p>
        <p class="text-xs text-subtle-foreground">
          {m.print_settings_test_uses_values()}
        </p>
      </fieldset>
    </form>
  {/if}
</section>
