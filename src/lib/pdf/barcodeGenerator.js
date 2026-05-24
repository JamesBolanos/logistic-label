// src/lib/pdf/barcodeGenerator.js
// Stubbed barcode generators for build-time compatibility.

export async function generateLogisticLabelBarcode() {
  return Buffer.from('barcode');
}

export async function generateGS1Barcode() {
  return Buffer.from('barcode');
}

export default {
  generateLogisticLabelBarcode,
  generateGS1Barcode
};
