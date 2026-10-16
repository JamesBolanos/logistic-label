export const defaultPrintSettings = {
  print_bridge_host: '127.0.0.1',
  print_bridge_port: 8080,
  printer_hostname: '',
  printer_port: 9100,
  printer_dpi: 203
};

export type PrintSettings = typeof defaultPrintSettings;

export function sanitizePrintSettings(input: Record<string, unknown>): PrintSettings {
  return {
    print_bridge_host: String(input.print_bridge_host ?? '')
      .trim()
      .toLowerCase(),
    print_bridge_port: parseInteger(input.print_bridge_port),
    printer_hostname: String(input.printer_hostname ?? '').trim(),
    printer_port: parseInteger(input.printer_port),
    printer_dpi: parseInteger(input.printer_dpi)
  };
}

function parseInteger(value: unknown): number {
  return /^(0|[1-9]\d*)$/.test(String(value ?? '')) ? Number(value) : NaN;
}

export function validatePrintSettings(settings: PrintSettings): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!['127.0.0.1', 'localhost'].includes(settings.print_bridge_host)) {
    errors.print_bridge_host = 'Choose 127.0.0.1 or localhost for the bridge on this computer.';
  }
  for (const field of ['print_bridge_port', 'printer_port'] as const) {
    if (!Number.isInteger(settings[field]) || settings[field] < 1 || settings[field] > 65535) {
      errors[field] = 'Enter a port from 1 to 65535.';
    }
  }
  if (settings.printer_hostname && !isPrinterHostname(settings.printer_hostname)) {
    errors.printer_hostname = 'Enter a printer IP address or hostname without a URL or port.';
  }
  if (![203, 300, 600].includes(settings.printer_dpi)) {
    errors.printer_dpi = 'Choose 203, 300, or 600 dpi.';
  }
  return errors;
}

function isPrinterHostname(host: string): boolean {
  if (host.length > 253) return false;
  if (host.includes(':')) {
    try {
      // The bridge accepts an unbracketed IPv6 address and adds the port itself.
      return new URL(`http://[${host}]/`).hostname.startsWith('[');
    } catch {
      return false;
    }
  }
  if (/^[\d.]+$/.test(host)) {
    const parts = host.split('.');
    return (
      parts.length === 4 &&
      parts.every((part) => /^(0|[1-9]\d{0,2})$/.test(part) && Number(part) <= 255)
    );
  }
  return host.split('.').every((part) => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(part));
}
