const CODE128_PATTERNS = [
  '212222',
  '222122',
  '222221',
  '121223',
  '121322',
  '131222',
  '122213',
  '122312',
  '132212',
  '221213',
  '221312',
  '231212',
  '112232',
  '122132',
  '122231',
  '113222',
  '123122',
  '123221',
  '223211',
  '221132',
  '221231',
  '213212',
  '223112',
  '312131',
  '311222',
  '321122',
  '321221',
  '312212',
  '322112',
  '322211',
  '212123',
  '212321',
  '232121',
  '111323',
  '131123',
  '131321',
  '112313',
  '132113',
  '132311',
  '211313',
  '231113',
  '231311',
  '112133',
  '112331',
  '132131',
  '113123',
  '113321',
  '133121',
  '313121',
  '211331',
  '231131',
  '213113',
  '213311',
  '213131',
  '311123',
  '311321',
  '331121',
  '312113',
  '312311',
  '332111',
  '314111',
  '221411',
  '431111',
  '111224',
  '111422',
  '121124',
  '121421',
  '141122',
  '141221',
  '112214',
  '112412',
  '122114',
  '122411',
  '142112',
  '142211',
  '241211',
  '221114',
  '413111',
  '241112',
  '134111',
  '111242',
  '121142',
  '121241',
  '114212',
  '124112',
  '124211',
  '411212',
  '421112',
  '421211',
  '212141',
  '214121',
  '412121',
  '111143',
  '111341',
  '131141',
  '114113',
  '114311',
  '411113',
  '411311',
  '113141',
  '114131',
  '311141',
  '411131',
  '211412',
  '211214',
  '211232',
  '2331112'
];

const START_B = 104;
const CODE_C = 99;
const CODE_B = 100;
const FNC1 = 102;
const STOP = 106;

/** @typedef {{ ai: string, value: string }} Gs1Element */
/** @typedef {{ type: 'data', value: string } | { type: 'fnc1' }} Gs1Chunk */

/** @type {Record<string, { fixedLength?: number, variable?: boolean }>} */
const AI_DEFINITIONS = {
  '00': { fixedLength: 18 },
  '01': { fixedLength: 14 },
  '02': { fixedLength: 14 },
  10: { variable: true },
  11: { fixedLength: 6 },
  13: { fixedLength: 6 },
  15: { fixedLength: 6 },
  16: { fixedLength: 6 },
  17: { fixedLength: 6 },
  30: { variable: true },
  37: { variable: true },
  3201: { fixedLength: 6 }
};

/** @param {Record<string, unknown>} labelData @returns {Gs1Element[]} */
export function buildGs1Elements(labelData) {
  if (labelData.label_type === 'sscc_only') {
    return [{ ai: '00', value: String(labelData.sscc ?? '') }].filter((item) => item.value);
  }

  if (labelData.label_type === 'homogeneous_unit') {
    const dateAi = String(labelData.date_ai ?? '');
    const dateValue = formatDateForAi(labelData.date_value);

    return [
      { ai: '00', value: String(labelData.sscc ?? '') },
      { ai: '02', value: String(labelData.gtin ?? '') },
      { ai: '37', value: String(labelData.quantity ?? '') },
      { ai: dateAi, value: dateValue },
      { ai: '10', value: String(labelData.lot_number ?? '') }
    ].filter((item) => item.ai && item.value);
  }

  const quantity = String(labelData.quantity ?? '').replace(/\D/g, '');
  const weight = String(Math.round(Number(labelData.weight_pounds ?? 0) * 10)).padStart(6, '0');

  return [
    { ai: '00', value: String(labelData.sscc ?? '') },
    { ai: '01', value: String(labelData.gtin ?? '') },
    { ai: '10', value: String(labelData.lot_number ?? '') },
    { ai: '11', value: formatDateForAi(labelData.production_date) },
    { ai: '30', value: quantity },
    { ai: '3201', value: weight }
  ].filter((item) => item.value);
}

/** @param {Gs1Element[]} elements */
export function humanReadable(elements) {
  return elements.map(({ ai, value }) => `(${ai})${value}`).join('');
}

/** @param {Gs1Element[]} elements @returns {Gs1Chunk[]} */
export function encodeGs1Data(elements) {
  /** @type {Gs1Chunk[]} */
  const chunks = [];

  elements.forEach((element, index) => {
    const definition = AI_DEFINITIONS[element.ai];
    const isVariable = definition?.variable;
    chunks.push({ type: 'data', value: `${element.ai}${element.value}` });

    if (isVariable && index < elements.length - 1) {
      chunks.push({ type: 'fnc1' });
    }
  });

  return chunks;
}

/** @param {Gs1Element[]} elements */
export function getBarcodeModules(elements) {
  const values = encodeCode128Values(encodeGs1Data(elements));
  return values.flatMap((value) => patternToModules(CODE128_PATTERNS[value]));
}

/** @param {Gs1Chunk[]} chunks */
function encodeCode128Values(chunks) {
  const values = [START_B, FNC1];
  let set = 'B';

  for (const chunk of chunks) {
    if (chunk.type === 'fnc1') {
      values.push(FNC1);
      continue;
    }

    let text = chunk.value;
    while (text.length > 0) {
      const numericRun = text.match(/^\d{4,}/)?.[0] ?? '';

      if (numericRun.length >= 4) {
        if (set !== 'C') {
          values.push(CODE_C);
          set = 'C';
        }

        const evenLength = numericRun.length - (numericRun.length % 2);
        for (let i = 0; i < evenLength; i += 2) {
          values.push(Number(text.slice(i, i + 2)));
        }
        text = text.slice(evenLength);
        continue;
      }

      if (set !== 'B') {
        values.push(CODE_B);
        set = 'B';
      }

      const charCode = text.charCodeAt(0);
      if (charCode < 32 || charCode > 126) {
        throw new Error(`Unsupported GS1-128 character: ${text[0]}`);
      }
      values.push(charCode - 32);
      text = text.slice(1);
    }
  }

  const check =
    values.reduce((sum, value, index) => sum + value * (index === 0 ? 1 : index), 0) % 103;
  return [...values, check, STOP];
}

/** @param {string} pattern */
function patternToModules(pattern) {
  const modules = [];
  let black = true;

  for (const width of pattern) {
    modules.push({ black, width: Number(width) });
    black = !black;
  }

  return modules;
}

/** @param {unknown} value */
function formatDateForAi(value) {
  const date = new Date(/** @type {string | number | Date} */ (value));
  if (Number.isNaN(date.getTime())) return '';

  return [
    String(date.getUTCFullYear()).slice(-2),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0')
  ].join('');
}
