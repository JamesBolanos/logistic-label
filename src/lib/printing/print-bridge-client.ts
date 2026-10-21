import { validatePrintSettings, type PrintSettings } from './settings';

type BridgeResponse = { message?: string; destination?: string; jobId?: string };

function bridgeUrl(settings: PrintSettings, path: string): string {
  const errors = validatePrintSettings(settings);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return `http://${settings.print_bridge_host}:${settings.print_bridge_port}${path}`;
}

async function requestBridge(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<BridgeResponse> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Bridge returned HTTP ${response.status}.`);
    // Keep the timeout active while reading the response body too.
    return await response.json();
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export async function pingPrintBridge(settings: PrintSettings): Promise<void> {
  const url = bridgeUrl(settings, '/ping');
  try {
    const response = await requestBridge(url, {}, 5000);
    if (response.message !== 'pong') throw new Error('Unexpected bridge response.');
  } catch {
    throw new Error(
      'Cannot reach the bridge. Check that it is running, the port matches, and this site is allowed by the bridge and browser.'
    );
  }
}

export async function sendZplToPrintBridge(
  settings: PrintSettings,
  zpl: string
): Promise<'sent' | 'virtual'> {
  const url = bridgeUrl(settings, '/print');
  if (!settings.printer_hostname)
    throw new Error('Configure your printer in Settings before printing.');
  if (!zpl.trim()) throw new Error('The label contains no ZPL to print.');
  try {
    const response = await requestBridge(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerHostname: settings.printer_hostname,
          printerPort: settings.printer_port,
          text: zpl
        })
      },
      15000
    );
    if (
      response.message !== 'OK' ||
      (response.destination && !['physical', 'virtual'].includes(response.destination))
    ) {
      throw new Error('Unexpected bridge response.');
    }
    return response.destination === 'virtual' ? 'virtual' : 'sent';
  } catch {
    // A missing response or failed write may follow partial/full delivery. Never resend here.
    throw new Error(
      'Delivery could not be confirmed. Check the printer before trying again to avoid duplicate labels. Check the bridge, its allowed origins, and browser permissions.'
    );
  }
}

export async function printSavedLabel(id: string | number): Promise<'sent' | 'virtual'> {
  const settingsResponse = await fetch('/api/settings', { cache: 'no-store' });
  if (!settingsResponse.ok)
    throw new Error('Unable to load printer settings. Check your sign-in and try again.');
  const { settings } = await settingsResponse.json();
  // Validate before loading private label contents or contacting the bridge.
  bridgeUrl(settings, '/print');
  if (!settings.printer_hostname)
    throw new Error('Configure your printer in Settings before printing.');
  const response = await fetch(
    `/api/zpl/download/${encodeURIComponent(id)}?dpi=${settings.printer_dpi}`,
    { cache: 'no-store' }
  );
  if (!response.ok)
    throw new Error(
      'Unable to prepare this label as ZPL. No print request was sent. Try Download ZPL for details.'
    );
  return sendZplToPrintBridge(settings, await response.text());
}
