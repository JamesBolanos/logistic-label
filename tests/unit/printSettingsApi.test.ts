import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getLabelSettings: vi.fn(),
  upsertPrintSettings: vi.fn(),
  upsertLabelSettings: vi.fn()
}));
vi.mock('#lib/server/db/settings.js', () => mocks);
vi.mock('#lib/server/analytics/operationalEvents.js', () => ({
  durationSince: vi.fn(),
  getOperationId: vi.fn(),
  recordOperationalEvent: vi.fn()
}));
import { GET, PATCH } from '../../src/routes/api/settings/+server.js';

function event(body: unknown = {}, user: { id: string } | null = { id: 'owner' }) {
  return {
    request: new Request('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(body)
    }),
    locals: { user }
  };
}
beforeEach(() => vi.resetAllMocks());

describe('printer settings endpoint', () => {
  it('requires authentication for reads and writes', async () => {
    expect((await GET(event({}, null))).status).toBe(401);
    expect((await PATCH(event({}, null))).status).toBe(401);
    expect(mocks.getLabelSettings).not.toHaveBeenCalled();
    expect(mocks.upsertPrintSettings).not.toHaveBeenCalled();
  });
  it('uses the signed-in owner and does not call the SSCC settings writer', async () => {
    mocks.upsertPrintSettings.mockResolvedValue({ printer_port: 9200 });
    const response = await PATCH(event({ user_id: 'another-user', printer_port: 9200 }));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mocks.upsertPrintSettings).toHaveBeenCalledExactlyOnceWith('owner', {
      user_id: 'another-user',
      printer_port: 9200
    });
    expect(mocks.upsertLabelSettings).not.toHaveBeenCalled();
  });
  it('returns validation errors for the form', async () => {
    mocks.upsertPrintSettings.mockRejectedValue({
      validation: { errors: { printer_port: 'Invalid port' } }
    });
    const response = await PATCH(event());
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errors: { printer_port: 'Invalid port' } });
  });
  it.each([null, [], 'text'])('rejects a non-object payload', async (payload) => {
    expect((await PATCH(event(payload))).status).toBe(400);
    expect(mocks.upsertPrintSettings).not.toHaveBeenCalled();
  });
});
