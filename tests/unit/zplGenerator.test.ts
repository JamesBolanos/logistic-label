import { describe, expect, it } from 'vitest';
import { generateLogisticLabelZPL, type ZplDpi } from '../../src/lib/server/zpl/labelGenerator.js';
import { getBarcodeModules } from '../../src/lib/server/pdf/gs1Barcode.js';

const transport = {
  label_type: 'sscc_only',
  template_version: 'v3',
  print_layout: '4x6_single',
  sscc: '012345670000000015',
  ship_from: 'Test Shipper\n10 Origin Road',
  ship_to: 'Customer DC\n20 Destination Road',
  purchase_order: 'PO-100',
  carrier: 'Test Freight',
  transport_count: 12,
  transport_count_type: 'cartons'
};

const homogeneous = {
  ...transport,
  label_type: 'homogeneous_unit',
  template_version: 'v4',
  print_layout: '6x8_single',
  gtin: '00012345600012',
  quantity: 12,
  packaging_level: 'case',
  lot_number: 'LOT-26/09',
  date_ai: '13',
  date_value: '2026-09-28'
};

function barcodeGroups(zpl: string) {
  const groups = new Map<number, Array<{ x: number; width: number; height: number }>>();
  for (const match of zpl.matchAll(/\^FO(\d+),(\d+)\^GB(\d+),(\d+),(\d+),B,0\^FS/g)) {
    const [, x, y, width, height, thickness] = match.map(Number);
    if (width !== thickness || height < 100 || width > 60) continue;
    const bars = groups.get(y) ?? [];
    bars.push({ x, width, height });
    groups.set(y, bars);
  }
  return [...groups.values()].filter((bars) => bars.length > 10);
}

describe('ZPL export', () => {
  it.each<[ZplDpi, number, number, number]>([
    [203, 813, 1219, 4],
    [300, 1219, 1829, 6],
    [600, 2438, 3658, 12]
  ])('preserves SSCC bars and physical dimensions at %i dpi', (dpi, width, height, moduleWidth) => {
    const zpl = generateLogisticLabelZPL(transport, { dpi });
    expect(zpl).toMatch(/^\^XA\n/);
    expect(zpl).toMatch(/\^PQ1\n\^XZ\n$/);
    expect(zpl).toContain(`^PW${width}\n^LL${height}`);
    expect(zpl).toContain('^FD(00)012345670000000015^FS');
    expect(zpl).toContain('^FDTest Shipper^FS');
    expect(zpl).toContain('^FD12 Cartons^FS');

    const [bars] = barcodeGroups(zpl);
    expect(barcodeGroups(zpl)).toHaveLength(1);
    const modules = getBarcodeModules([{ ai: '00', value: transport.sscc }]);
    let cursor = bars[0].x;
    const expectedBars = [];
    for (const module of modules) {
      if (module.black) expectedBars.push({ x: cursor, width: module.width * moduleWidth });
      cursor += module.width * moduleWidth;
    }
    expect(bars.map(({ x, width }) => ({ x, width }))).toEqual(expectedBars);
    expect(bars[0].x).toBeGreaterThanOrEqual(moduleWidth * 10);
    expect(width - cursor).toBeGreaterThanOrEqual(moduleWidth * 10);
    expect(bars.every((bar) => bar.height === 31.75 * (moduleWidth * 2))).toBe(true);
  });

  it.each(['4x3_single', '4x6_two_up'])('preserves compact layout %s', (print_layout) => {
    const zpl = generateLogisticLabelZPL({ ...transport, print_layout });
    expect(zpl).toContain(print_layout === '4x3_single' ? '^LL610\n' : '^LL1219\n');
    const copies = print_layout === '4x3_single' ? 1 : 2;
    expect(zpl.split('^FD(00)012345670000000015^FS')).toHaveLength(copies + 1);
    expect(barcodeGroups(zpl)).toHaveLength(copies);
    if (copies === 2) expect(zpl).toContain('^GC');
  });

  it('retains content/count, traceability and the SSCC at the bottom of a 6 by 8 label', () => {
    const zpl = generateLogisticLabelZPL(homogeneous);
    expect(zpl).toContain('^PW1219\n^LL1626');
    expect(zpl).toContain('^FD(02)00012345600012(37)12^FS');
    expect(zpl).toContain('^FD(13)260928(10)LOT-26/09^FS');
    expect(zpl.indexOf('^FD(00)')).toBeGreaterThan(zpl.indexOf('^FD(13)'));
    expect(barcodeGroups(zpl)).toHaveLength(3);
  });

  it('renders basic 4 by 6 identical contents with two barcodes', () => {
    const zpl = generateLogisticLabelZPL({
      ...homogeneous,
      print_layout: '4x6_single',
      lot_number: '',
      date_ai: '',
      date_value: ''
    });
    expect(barcodeGroups(zpl)).toHaveLength(2);
    expect(zpl).toContain('^FD12 Cases^FS');
  });

  it('retains v2 layouts and legacy application identifiers', () => {
    const v2 = generateLogisticLabelZPL(
      { ...transport, template_version: 'v2' },
      { company_name: 'Old Company' }
    );
    expect(v2).toContain('^FDOld Company^FS');
    expect(v2).not.toContain('SHIP TO');

    const legacy = generateLogisticLabelZPL({
      ...homogeneous,
      label_type: 'legacy_demo',
      template_version: 'v1',
      production_date: '2026-09-28',
      lot_number: 'LEGACY123',
      weight_pounds: 10
    });
    expect(legacy).toContain('^FD(01)00012345600012(11)260928(10)LEGACY123(30)12^FS');
    expect(legacy).not.toContain('(02)');
    expect(barcodeGroups(legacy)).toHaveLength(2);
  });

  it('escapes printer commands, hex indicators, controls, and UTF-8 text', () => {
    const zpl = generateLogisticLabelZPL({ ...transport, ship_from: 'Café ^XZ~JA_41\u0001' });
    expect(zpl).toContain('Caf_C3_A9 _5EXZ_7EJA_5F41_01');
    expect(zpl.match(/\^XZ/g)).toHaveLength(1);
    expect(zpl).not.toContain('~JA');
    expect(zpl).not.toContain('\u0001');
  });

  it('rejects content that cannot preserve barcode dimensions', () => {
    expect(() =>
      generateLogisticLabelZPL({ ...homogeneous, lot_number: 'ABCDEFGHIJKLMNOPQRST' })
    ).toThrow(/too wide/);
  });
});
