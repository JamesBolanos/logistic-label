<script>
  import { onMount } from 'svelte';
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

  onMount(loadSettings);

  async function loadSettings() {
    busy = true;
    errorMessage = '';
    try {
      const response = await fetch('/api/settings', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load printer settings.');
      const { settings } = await response.json();
      form = Object.fromEntries(
        Object.entries(defaultPrintSettings).map(([key, fallback]) => [
          key,
          settings[key] ?? fallback
        ])
      );
      loaded = true;
    } catch (error) {
      errorMessage = error.message || 'Unable to load printer settings.';
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
        statusMessage =
          'Bridge is reachable. This checks the bridge only; no label was sent to the printer.';
      } else {
        const response = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        });
        const data = await response.json();
        if (!response.ok) {
          errors = data.errors || {};
          throw new Error(data.message || 'Unable to save printer settings.');
        }
        form = settings;
        statusMessage = 'Printer settings saved.';
      }
    } catch (error) {
      errorMessage = error.message || 'Unable to complete this action.';
    } finally {
      busy = false;
    }
  }
</script>

<section
  aria-labelledby="printer-settings-heading"
  class="space-y-4 rounded-lg border border-border-default bg-surface p-6 shadow"
>
  <h2 id="printer-settings-heading" class="text-xl font-semibold text-foreground">LAN printer</h2>
  <p class="text-sm leading-6 text-muted-foreground">
    When you choose Print via bridge, your browser sends the saved label to Print Bridge running on
    this computer. The bridge then sends it over your local network to your ZPL-compatible printer.
    Keep the bridge open while printing.
  </p>
  <p
    class="rounded-md bg-blue-50 dark:bg-blue-950/40 px-3 py-2 text-sm font-medium text-blue-900 dark:text-blue-200"
  >
    SSCC Labels → Print Bridge on this computer → Network printer
  </p>
  <p class="text-sm text-muted-foreground">
    <a
      href="https://github.com/JamesBolanos/print-bridge/releases/latest"
      target="_blank"
      rel="noopener noreferrer"
      class="font-medium text-blue-700 dark:text-blue-300 underline"
      >Download Print Bridge from GitHub</a
    >
    for macOS (Apple silicon) or Windows (64-bit).
    <a
      href="https://github.com/JamesBolanos/print-bridge/blob/main/DOCS/sscc-labels-setup.md"
      target="_blank"
      rel="noopener noreferrer"
      class="ml-1 font-medium text-blue-700 dark:text-blue-300 underline">Setup guide</a
    > covers installation, configuration, and your first label.
  </p>
  <p class="text-sm text-muted-foreground">
    These printer settings are saved to your account and used on every computer where you sign in.
    The bridge address identifies this computer; the printer address identifies the printer on your
    network.
  </p>
  {#if errorMessage}<p role="alert" class="text-sm text-red-700 dark:text-red-300">
      {errorMessage}
    </p>{/if}
  {#if statusMessage}<p role="status" class="text-sm text-green-700 dark:text-green-300">
      {statusMessage}
    </p>{/if}
  {#if !loaded}
    <button
      type="button"
      onclick={loadSettings}
      disabled={busy}
      class="text-sm font-medium text-blue-700 dark:text-blue-300 disabled:opacity-50"
    >
      {busy ? 'Loading printer settings...' : 'Reload printer settings'}
    </button>
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
              class="mb-1 block text-sm font-medium text-muted-foreground">Bridge address</label
            >
            <select
              id="print_bridge_host"
              bind:value={form.print_bridge_host}
              class="w-full rounded-md border border-border-strong px-3 py-2"
            >
              <option value="127.0.0.1">127.0.0.1 (this computer)</option>
              <option value="localhost">localhost (this computer)</option>
            </select>
            {#if errors.print_bridge_host}<p class="text-sm text-red-600 dark:text-red-400">
                {errors.print_bridge_host}
              </p>{/if}
          </div>
          <div>
            <label
              for="print_bridge_port"
              class="mb-1 block text-sm font-medium text-muted-foreground">Bridge HTTP port</label
            >
            <input
              id="print_bridge_port"
              type="number"
              min="1"
              max="65535"
              step="1"
              required
              bind:value={form.print_bridge_port}
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
              >Printer IP address or hostname</label
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
              Leave empty to disable printing through the bridge.
            </p>
          </div>
          <div>
            <label for="printer_port" class="mb-1 block text-sm font-medium text-muted-foreground"
              >Printer TCP port</label
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
              >Printer resolution</label
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
            {#if errors.printer_dpi}<p class="text-sm text-red-600 dark:text-red-400">
                {errors.printer_dpi}
              </p>{/if}
          </div>
        </div>
        <p class="text-sm text-muted-foreground">
          New installations of Print Bridge v1.0.0-beta.4 or later already allow sscc-labels.com and
          www.sscc-labels.com. If you are upgrading, add this website's origin in the bridge's
          Settings if needed. Choose Physical mode for paper output. Allow local network access if
          your browser asks. Match the resolution and media to your printer.
        </p>
        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            onclick={() => runAction(true)}
            class="rounded-md border border-border-strong px-4 py-2 text-sm font-medium hover:bg-surface-muted"
            >Test bridge connection</button
          >
          <button
            type="submit"
            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >Save printer settings</button
          >
        </div>
        <p class="text-xs text-subtle-foreground">
          Test uses the values shown above. Save them before printing from Saved labels.
        </p>
      </fieldset>
    </form>
  {/if}
</section>
