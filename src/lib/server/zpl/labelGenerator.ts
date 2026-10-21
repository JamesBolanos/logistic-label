import { generateLogisticLabelLayout, type BarcodeItem } from '../labels/layout.js';
import { getBarcodeModules } from '../pdf/gs1Barcode.js';

// Zebra's nominal DPI names correspond to these physical printhead densities.
const DOTS_PER_MM = { 203: 8, 300: 12, 600: 24 } as const;
export type ZplDpi = keyof typeof DOTS_PER_MM;

export function isZplDpi(value: number): value is ZplDpi {
  return Object.hasOwn(DOTS_PER_MM, value);
}

export function generateLogisticLabelZPL(
  labelData: Record<string, unknown>,
  options: { dpi?: ZplDpi; company_name?: string } = {}
): string {
  const dpi = options.dpi ?? 203;
  if (!isZplDpi(dpi)) throw new Error('Unsupported printer resolution');
  const dpmm = DOTS_PER_MM[dpi];
  const dots = (points: number) => Math.round((points / 72) * 25.4 * dpmm);
  const layout = generateLogisticLabelLayout(labelData, options);
  const pageWidth = dots(layout.width);
  const y = (baseline: number) => dots(layout.height - baseline);
  const commands = [
    '^XA',
    '^CI28',
    '^MUD',
    '^PON',
    '^PMN',
    '^LH0,0',
    '^LS0',
    '^LT0',
    '^FWN',
    '^LRN',
    `^PW${pageWidth}`,
    `^LL${dots(layout.height)}`
  ];

  const box = (x: number, top: number, width: number, height: number, thickness: number) => {
    commands.push(`^FO${x},${top}^GB${width},${height},${thickness},B,0^FS`);
  };

  for (const item of layout.content) {
    switch (item.type) {
      case 'text': {
        const size = Math.max(1, dots(item.size));
        // FT uses the text baseline, matching the shared layout's coordinates.
        commands.push(
          `^FT${dots(item.x)},${y(item.y)}^A0N,${size},${size}^FH_^FD${escapeField(item.text)}^FS`
        );
        break;
      }
      case 'barcode': {
        const geometry = barcodeDots(item, dpmm, pageWidth, dots);
        let cursor = geometry.x;
        for (const module of geometry.modules) {
          const width = module.width * geometry.moduleWidth;
          if (module.black) box(cursor, y(item.y) - geometry.height, width, geometry.height, width);
          cursor += width;
        }
        break;
      }
      case 'outline':
        box(
          dots(item.x),
          y(item.y + item.height),
          dots(item.width),
          dots(item.height),
          Math.max(1, dots(item.lineWidth))
        );
        break;
      case 'line': {
        const thickness = Math.max(1, dots(item.lineWidth));
        const left = dots(Math.min(item.x1, item.x2));
        const top = y(Math.max(item.y1, item.y2));
        const width = Math.max(thickness, dots(Math.abs(item.x2 - item.x1)));
        const height = Math.max(thickness, dots(Math.abs(item.y2 - item.y1)));
        if (item.x1 === item.x2 || item.y1 === item.y2) {
          box(left, top, width, height, thickness);
        } else {
          const orientation = (item.x2 - item.x1) * (item.y2 - item.y1) > 0 ? 'R' : 'L';
          commands.push(`^FO${left},${top}^GD${width},${height},${thickness},B,${orientation}^FS`);
        }
        break;
      }
      case 'cutGuide':
        for (let x = 32; x < item.pageWidth - 18; x += 8) {
          box(
            dots(x),
            y(item.y),
            dots(Math.min(4, item.pageWidth - 18 - x)),
            Math.max(1, dots(0.8)),
            Math.max(1, dots(0.8))
          );
        }
        break;
      case 'circle':
        commands.push(
          `^FO${dots(item.centerX - item.radius)},${y(item.centerY + item.radius)}^GC${dots(item.radius * 2)},${Math.max(1, dots(0.8))},B^FS`
        );
        break;
    }
  }

  return [...commands, '^PQ1', '^XZ', ''].join('\n');
}

function barcodeDots(
  item: BarcodeItem,
  dpmm: number,
  pageWidth: number,
  dots: (points: number) => number
) {
  const modules = getBarcodeModules(item.elements);
  const totalModules = modules.reduce((sum, module) => sum + module.width, 0);
  // Guided labels retain >= 0.495 mm X dimensions; legacy labels retain their
  // original smaller barcode allocation without claiming modern compliance.
  const moduleWidth = item.compliant
    ? Math.ceil(0.495 * dpmm)
    : Math.floor(dots(item.width) / totalModules);
  const symbolWidth = totalModules * moduleWidth;
  const x = Math.floor(pageWidth / 2 - symbolWidth / 2);
  if (moduleWidth < 1 || x < moduleWidth * 10 || pageWidth - x - symbolWidth < moduleWidth * 10) {
    throw Object.assign(new Error('This barcode does not fit the selected printer resolution.'), {
      code: 'ZPL_BARCODE_TOO_WIDE'
    });
  }
  return {
    modules,
    moduleWidth,
    x,
    height: item.compliant ? Math.ceil(31.75 * dpmm) : dots(item.height)
  };
}

function escapeField(value: string): string {
  // Encode controls, ZPL command prefixes, the hex indicator, and UTF-8 bytes.
  // Keep ordinary ASCII readable in the downloaded file.
  return Array.from(new TextEncoder().encode(value), (byte) =>
    byte >= 32 && byte <= 126 && ![94, 126, 95].includes(byte)
      ? String.fromCharCode(byte)
      : `_${byte.toString(16).padStart(2, '0').toUpperCase()}`
  ).join('');
}
