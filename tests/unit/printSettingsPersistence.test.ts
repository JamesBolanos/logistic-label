import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  values: vi.fn(),
  onConflictDoUpdate: vi.fn(),
  returning: vi.fn()
}));
vi.mock('#lib/server/db/index.js', () => ({ db: { insert: mocks.insert } }));
import { upsertPrintSettings } from '../../src/lib/server/db/settings.js';
import { labelSettings } from '../../src/lib/server/db/schema.js';
import { defaultPrintSettings } from '../../src/lib/printing/settings';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.insert.mockReturnValue({ values: mocks.values });
  mocks.values.mockReturnValue({ onConflictDoUpdate: mocks.onConflictDoUpdate });
  mocks.onConflictDoUpdate.mockReturnValue({ returning: mocks.returning });
  mocks.returning.mockResolvedValue([
    {
      userId: 'owner',
      printBridgeHost: '127.0.0.1',
      printBridgePort: 8080,
      printerHostname: 'printer.test',
      printerPort: 9100,
      printerDpi: 300,
      nextSerialReference: 42
    }
  ]);
});

describe('printer settings persistence', () => {
  it('updates only printer fields and preserves the SSCC sequence', async () => {
    const result = await upsertPrintSettings('owner', {
      ...defaultPrintSettings,
      printer_hostname: 'printer.test',
      printer_dpi: 300,
      next_serial_reference: 1,
      user_id: 'other'
    });
    expect(mocks.insert).toHaveBeenCalledWith(labelSettings);
    expect(mocks.values.mock.calls[0][0]).toEqual({
      userId: 'owner',
      printBridgeHost: '127.0.0.1',
      printBridgePort: 8080,
      printerHostname: 'printer.test',
      printerPort: 9100,
      printerDpi: 300,
      updatedAt: expect.any(Date)
    });
    expect(mocks.onConflictDoUpdate.mock.calls[0][0].set).not.toHaveProperty('nextSerialReference');
    expect(mocks.onConflictDoUpdate.mock.calls[0][0].set).not.toHaveProperty('userId');
    expect(result).toMatchObject({
      printer_dpi: 300,
      printer_hostname: 'printer.test',
      next_serial_reference: 42
    });
  });
  it('rejects invalid settings before any database write', async () => {
    await expect(
      upsertPrintSettings('owner', { ...defaultPrintSettings, printer_port: -1 })
    ).rejects.toThrow('Invalid printer settings');
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
