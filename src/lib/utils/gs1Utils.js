// src/lib/utils/gs1Utils.js

// Basic mod-10 check digit for GTIN-14
function calculateCheckDigit(gtin13) {
  const digits = gtin13.split('').map(Number);
  const sum = digits.reduce((acc, digit, idx) => acc + digit * (idx % 2 === 0 ? 3 : 1), 0);
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

export function validateGTIN(gtin) {
  if (!/^\d{14}$/.test(gtin)) return false;
  const body = gtin.slice(0, 13);
  const check = Number(gtin[13]);
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

export function generateSSCC(prefix = '000000') {
  const base = `${prefix}${Date.now()}`.slice(-17); // keep 17 digits before check digit
  const check = calculateCheckDigit(base.slice(1)); // skip extension digit when computing
  return `${base}${check}`;
}

export default {
  validateGTIN,
  validateLotNumber,
  formatGS1Date,
  generateSSCC
};
