// src/lib/utils/gs1Utils.js

// GS1 mod-10 check digit for GTINs, SSCCs, and other numeric GS1 keys.
export function calculateCheckDigit(valueWithoutCheckDigit) {
  const digits = String(valueWithoutCheckDigit).split('').map(Number);
  const sum = digits.reduce((acc, digit, idx) => {
    const positionFromRight = digits.length - idx;
    return acc + digit * (positionFromRight % 2 === 1 ? 3 : 1);
  }, 0);
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

export function validateGTIN(gtin) {
  if (!/^\d{14}$/.test(gtin)) return false;
  const body = gtin.slice(0, 13);
  const check = Number(gtin[13]);
  return calculateCheckDigit(body) === check;
}

export function validateGS1CompanyPrefix(prefix) {
  return /^\d{4,12}$/.test(prefix || '');
}

export function validateSSCC(sscc) {
  if (!/^\d{18}$/.test(sscc || '')) return false;
  const body = sscc.slice(0, 17);
  const check = Number(sscc[17]);
  return calculateCheckDigit(body) === check;
}

export function validateLotNumber(lot) {
  return /^[A-Za-z0-9]{1,20}$/.test(lot || '');
}

export function formatGS1Date(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

export function generateSSCC(options = {}) {
  const {
    gs1CompanyPrefix = '',
    serialReference = 1,
    extensionDigit = '0'
  } = typeof options === 'string' ? { gs1CompanyPrefix: options } : options;

  const prefix = String(gs1CompanyPrefix).replace(/\D/g, '');

  if (!validateGS1CompanyPrefix(prefix)) {
    throw new Error('GS1 Company Prefix must be 4 to 12 digits');
  }

  const extension = String(extensionDigit).replace(/\D/g, '').slice(0, 1) || '0';
  const serialDigits = 16 - prefix.length;
  const serial = String(Number.parseInt(serialReference, 10) || 0).padStart(serialDigits, '0');

  if (!/^\d$/.test(extension)) {
    throw new Error('SSCC extension digit must be a single digit');
  }

  if (serial.length > serialDigits) {
    throw new Error('Serial reference is too large for this GS1 Company Prefix length');
  }

  const body = `${extension}${prefix}${serial}`;
  return `${body}${calculateCheckDigit(body)}`;
}

export default {
  calculateCheckDigit,
  validateGTIN,
  validateGS1CompanyPrefix,
  validateSSCC,
  validateLotNumber,
  formatGS1Date,
  generateSSCC
};
