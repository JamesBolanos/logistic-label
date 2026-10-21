import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  defaultPrintSettings,
  sanitizePrintSettings,
  validatePrintSettings
} from '../../src/lib/printing/settings';
import {
  pingPrintBridge,
  printSavedLabel,
  sendZplToPrintBridge
} from '../../src/lib/printing/print-bridge-client';
import { generateLogisticLabelZPL } from '../../src/lib/server/zpl/labelGenerator';

const settings = { ...defaultPrintSettings, printer_hostname: 'printer.test', printer_port: 9200 };
const ok = (value: unknown) => new Response(JSON.stringify(value));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('printer settings validation', () => {
  it('normalizes form values and permits a disabled printer', () => {
    expect(
      sanitizePrintSettings({
        ...settings,
        printer_hostname: ' printer.test ',
        printer_port: '9200'
      })
    ).toEqual(settings);
    expect(validatePrintSettings(defaultPrintSettings)).toEqual({});
  });
  it.each(['https://evil.test', '192.168.1.2', 'localhost/path', 'localhost:8080'])(
    'rejects a non-loopback bridge address: %s',
    (host) => {
      expect(validatePrintSettings({ ...settings, print_bridge_host: host })).toHaveProperty(
        'print_bridge_host'
      );
    }
  );
  it.each(['https://printer.test', 'printer.test:9100', 'printer.test/path', '256.1.1.1'])(
    'rejects malformed printer destinations: %s',
    (host) => {
      expect(validatePrintSettings({ ...settings, printer_hostname: host })).toHaveProperty(
        'printer_hostname'
      );
    }
  );
  it.each(['192.168.1.100', 'printer.local', '2001:db8::1'])(
    'accepts a printer address: %s',
    (host) => {
      expect(validatePrintSettings({ ...settings, printer_hostname: host })).toEqual({});
    }
  );
  it.each(['', 0, 65536, 1.5, true, '9100abc'])('rejects an invalid port: %s', (port) => {
    expect(
      validatePrintSettings(sanitizePrintSettings({ ...settings, printer_port: port }))
    ).toHaveProperty('printer_port');
  });
  it('rejects unsupported resolution', () => {
    expect(validatePrintSettings({ ...settings, printer_dpi: 1200 })).toHaveProperty('printer_dpi');
  });
});

describe('bridge transport', () => {
  it.each([203, 300, 600] as const)(
    'sends the exact existing ZPL at %i dpi with the printer port',
    async (dpi) => {
      const zpl = generateLogisticLabelZPL(
        {
          label_type: 'sscc_only',
          template_version: 'v3',
          print_layout: '4x6_single',
          sscc: '012345670000000015',
          ship_from: 'Synthetic test'
        },
        { dpi }
      );
      const fetchMock = vi.fn().mockResolvedValue(ok({ message: 'OK' }));
      vi.stubGlobal('fetch', fetchMock);
      expect(await sendZplToPrintBridge(settings, zpl)).toBe('sent');
      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        'http://127.0.0.1:8080/print',
        expect.objectContaining({ method: 'POST', credentials: 'omit', redirect: 'error' })
      );
      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
        printerHostname: 'printer.test',
        printerPort: 9200,
        text: zpl
      });
    }
  );
  it('reports virtual capture separately', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(ok({ message: 'OK', destination: 'virtual', jobId: 'capture' }))
    );
    expect(await sendZplToPrintBridge(settings, '^XA^XZ')).toBe('virtual');
  });
  it('does not retry a failed request', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Network error'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(sendZplToPrintBridge(settings, '^XA^XZ')).rejects.toThrow(
      'Check the printer before trying again'
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('aborts a stalled request without retrying', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
          );
        })
    );
    vi.stubGlobal('fetch', fetchMock);
    const pending = expect(sendZplToPrintBridge(settings, '^XA^XZ')).rejects.toThrow(
      'Delivery could not be confirmed'
    );
    await vi.advanceTimersByTimeAsync(15000);
    await pending;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each([new Response('Failed write', { status: 500 }), ok({ message: 'unexpected' })])(
    'does not treat errors or unexpected responses as success',
    async (response) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
      await expect(sendZplToPrintBridge(settings, '^XA^XZ')).rejects.toThrow(
        'Delivery could not be confirmed'
      );
    }
  );
  it('checks listener liveness without printing', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({ message: 'pong' }));
    vi.stubGlobal('fetch', fetchMock);
    await pingPrintBridge(settings);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      'http://127.0.0.1:8080/ping',
      expect.not.objectContaining({ method: 'POST' })
    );
  });
});

describe('saved label printing', () => {
  it('loads current settings and existing ZPL without creating a label', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok({ settings: { ...settings, printer_dpi: 300 } }))
      .mockResolvedValueOnce(new Response('^XA\n^XZ\n'))
      .mockResolvedValueOnce(ok({ message: 'OK' }));
    vi.stubGlobal('fetch', fetchMock);
    await printSavedLabel(12);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/settings',
      '/api/zpl/download/12?dpi=300',
      'http://127.0.0.1:8080/print'
    ]);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body).text).toBe('^XA\n^XZ\n');
  });
  it('does not dispatch when ZPL preparation fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok({ settings }))
      .mockResolvedValueOnce(new Response('Not found', { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(printSavedLabel(12)).rejects.toThrow('No print request was sent');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('requires a configured printer before requesting ZPL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({ settings: defaultPrintSettings }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(printSavedLabel(12)).rejects.toThrow('Configure your printer');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
