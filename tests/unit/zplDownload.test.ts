import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getLabelById: vi.fn(),
  getLabelSettings: vi.fn(),
  pdfRateLimiter: vi.fn()
}));
vi.mock('$lib/server/db/labels', () => ({ getLabelById: mocks.getLabelById }));
vi.mock('$lib/server/db/settings', () => ({ getLabelSettings: mocks.getLabelSettings }));
vi.mock('$lib/server/auth/ratelimit', () => ({ pdfRateLimiter: mocks.pdfRateLimiter }));

import { GET } from '../../src/routes/api/zpl/download/[id]/+server.js';

const label = {
  id: 'saved-label',
  label_type: 'sscc_only',
  template_version: 'v3',
  print_layout: '4x6_single',
  sscc: '012345670000000015',
  ship_from: 'Test Shipper',
  ship_to: 'Test Destination'
};

function event(query = '', user: { id: string } | null = { id: 'owner' }) {
  const url = new URL(`http://localhost/api/zpl/download/saved-label${query}`);
  return { params: { id: 'saved-label' }, request: new Request(url), url, locals: { user } };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getLabelById.mockResolvedValue(label);
  mocks.getLabelSettings.mockResolvedValue({ company_name: 'Test Company' });
});

describe('saved ZPL download endpoint', () => {
  it('requires authentication before reading a label', async () => {
    expect((await GET(event('', null))).status).toBe(401);
    expect(mocks.getLabelById).not.toHaveBeenCalled();
  });

  it('scopes lookup to the signed-in owner and hides missing or inaccessible labels', async () => {
    mocks.getLabelById.mockResolvedValue(null);
    expect((await GET(event())).status).toBe(404);
    expect(mocks.getLabelById).toHaveBeenCalledWith('saved-label', 'owner');
    expect(mocks.getLabelSettings).not.toHaveBeenCalled();
  });

  it.each(['', '?dpi=203', '?dpi=300', '?dpi=600'])(
    'returns a private ZPL attachment for %s',
    async (query) => {
      const response = await GET(event(query));
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('application/vnd.zebra-zpl');
      expect(response.headers.get('Content-Disposition')).toBe(
        `attachment; filename="gs1_label_saved-label_${query.slice(5) || '203'}dpi.zpl"`
      );
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
      expect(await response.text()).toContain('(00)012345670000000015');
      expect(mocks.getLabelById).toHaveBeenCalledExactlyOnceWith('saved-label', 'owner');
    }
  );

  it.each(['0', 'abc', '', '203.0', '1200'])(
    'rejects invalid DPI %s before reading data',
    async (dpi) => {
      expect((await GET(event(`?dpi=${dpi}`))).status).toBe(400);
      expect(mocks.getLabelById).not.toHaveBeenCalled();
    }
  );

  it('honors rate limiting', async () => {
    mocks.pdfRateLimiter.mockReturnValue(new Response('Too many requests', { status: 429 }));
    expect((await GET(event())).status).toBe(429);
    expect(mocks.getLabelById).not.toHaveBeenCalled();
  });

  it('returns a recoverable error for oversized barcodes', async () => {
    mocks.getLabelById.mockResolvedValue({
      ...label,
      label_type: 'homogeneous_unit',
      template_version: 'v4',
      print_layout: '6x8_single',
      gtin: '00012345600012',
      quantity: 12,
      lot_number: 'ABCDEFGHIJKLMNOPQRST',
      date_ai: '17',
      date_value: '2026-09-28'
    });
    expect((await GET(event())).status).toBe(422);
  });

  it('does not expose database errors or label contents', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      mocks.getLabelById.mockRejectedValue(new Error('private database detail'));
      const response = await GET(event());
      expect(response.status).toBe(500);
      expect(await response.text()).not.toContain('private database detail');
      expect(log).toHaveBeenCalledExactlyOnceWith('ZPL download failed');
    } finally {
      log.mockRestore();
    }
  });
});
