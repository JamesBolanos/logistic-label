// src/lib/server/pdf/labelGenerator.js
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateGS1Barcode } from './barcodeGenerator';
import { formatGS1Date } from '$lib/utils/gs1Utils';

/**
 * Generate a 4x6 inch logistic label PDF
 * 
 * @param {Object} labelData - Label data to include on the label
 * @param {Object} options - Additional options for the label
 * @returns {Promise<Buffer>} - PDF document as buffer
 */
export async function generateLogisticLabelPDF(labelData, options = {}) {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Set the page size to 4x6 inches (converted to points: 1 inch = 72 points)
  const pageWidth = 4 * 72;
  const pageHeight = 6 * 72;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Get fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Set margins
  const margin = 18; // 0.25 inch margin
  
  // Extract label data
  const { 
    gtin, 
    lot_number, 
    production_date, 
    quantity, 
    weight_pounds, 
    sscc, 
    company_name = options.company_name || 'COMPANY NAME' 
  } = labelData;
  
  // Format dates properly
  const formattedProductionDate = new Date(production_date).toLocaleDateString();
  
  // Calculate sections
  const headerHeight = pageHeight * 0.15; // Top 15%
  const midHeight = pageHeight * 0.35;    // Middle 35%
  // Draw header section (company info)
  page.drawText(company_name, {
    x: margin,
    y: pageHeight - margin - 15,
    size: 15,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  // Draw horizontal line below header
  page.drawLine({
    start: { x: margin, y: pageHeight - headerHeight },
    end: { x: pageWidth - margin, y: pageHeight - headerHeight },
    thickness: 1,
    color: rgb(0, 0, 0)
  });
  
  // Draw human-readable information in middle section
  const textY = pageHeight - headerHeight - 20;
  const textXLeft = margin;
  const textXRight = pageWidth / 2 + 10;
  const lineHeight = 20;
  
  // Left column
  page.drawText('GTIN:', {
    x: textXLeft,
    y: textY,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  page.drawText(gtin, {
    x: textXLeft + 70,
    y: textY,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  page.drawText('LOT:', {
    x: textXLeft,
    y: textY - lineHeight,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  page.drawText(lot_number, {
    x: textXLeft + 70,
    y: textY - lineHeight,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  page.drawText('PROD DATE:', {
    x: textXLeft,
    y: textY - lineHeight * 2,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  page.drawText(formattedProductionDate, {
    x: textXLeft + 70,
    y: textY - lineHeight * 2,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // Right column
  page.drawText('QUANTITY:', {
    x: textXRight,
    y: textY,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  page.drawText(quantity.toString(), {
    x: textXRight + 70,
    y: textY,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  page.drawText('WEIGHT:', {
    x: textXRight,
    y: textY - lineHeight,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  page.drawText(`${weight_pounds} lb`, {
    x: textXRight + 70,
    y: textY - lineHeight,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  page.drawText('SSCC:', {
    x: textXRight,
    y: textY - lineHeight * 2,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  page.drawText(sscc, {
    x: textXRight + 70,
    y: textY - lineHeight * 2,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // Draw horizontal line below middle section
  page.drawLine({
    start: { x: margin, y: pageHeight - headerHeight - midHeight },
    end: { x: pageWidth - margin, y: pageHeight - headerHeight - midHeight },
    thickness: 1,
    color: rgb(0, 0, 0)
  });
  
  // Generate and add barcodes
  
  // 1. SSCC Barcode
  const ssccData = { SSCC: sscc };
  const ssccBarcode = await generateGS1Barcode(ssccData, {
    scale: 3,
    height: 12,
    textsize: 10
  });
  
  const ssccImage = await pdfDoc.embedPng(ssccBarcode);
  const ssccDims = ssccImage.scale(0.7); // Scale to fit
  
  page.drawImage(ssccImage, {
    x: (pageWidth - ssccDims.width) / 2,
    y: pageHeight - headerHeight - midHeight - ssccDims.height - 20,
    width: ssccDims.width,
    height: ssccDims.height
  });
  
  // 2. GTIN/Lot/Date Barcode (combine these data elements)
  const productData = {
    GTIN: gtin,
    BATCH_LOT: lot_number,
    PROD_DATE: formatGS1Date(production_date)
  };
  
  const productBarcode = await generateGS1Barcode(productData, {
    scale: 3,
    height: 12,
    textsize: 10
  });
  
  const productImage = await pdfDoc.embedPng(productBarcode);
  const productDims = productImage.scale(0.7); // Scale to fit
  
  page.drawImage(productImage, {
    x: (pageWidth - productDims.width) / 2,
    y: pageHeight - headerHeight - midHeight - ssccDims.height - productDims.height - 40,
    width: productDims.width,
    height: productDims.height
  });
  
  // 3. Quantity/Weight Barcode
  const quantityData = {
    QTY: quantity.toString(),
    WEIGHT_LB: (Math.round(weight_pounds * 10) / 10).toFixed(1).replace('.', '')
  };
  
  const quantityBarcode = await generateGS1Barcode(quantityData, {
    scale: 3,
    height: 12,
    textsize: 10
  });
  
  const quantityImage = await pdfDoc.embedPng(quantityBarcode);
  const quantityDims = quantityImage.scale(0.7); // Scale to fit
  
  page.drawImage(quantityImage, {
    x: (pageWidth - quantityDims.width) / 2,
    y: pageHeight - headerHeight - midHeight - ssccDims.height - productDims.height - quantityDims.height - 60,
    width: quantityDims.width,
    height: quantityDims.height
  });
  
  // Generate PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generate a PDF with multiple logistic labels
 * 
 * @param {Array} labelDataArray - Array of label data objects
 * @param {Object} options - Additional options
 * @returns {Promise<Buffer>} - PDF document as buffer
 */
export async function generateMultipleLogisticLabels(labelDataArray, options = {}) {
  if (!Array.isArray(labelDataArray) || labelDataArray.length === 0) {
    throw new Error('No label data provided');
  }
  
  // Create a document with all labels
  const pdfDoc = await PDFDocument.create();
  
  // Add each label as a separate page
  for (const labelData of labelDataArray) {
    // Generate individual label
    const labelPdfBytes = await generateLogisticLabelPDF(labelData, options);
    const labelPdf = await PDFDocument.load(labelPdfBytes);
    
    // Copy pages from label PDF to main document
    const [labelPage] = await pdfDoc.copyPages(labelPdf, [0]);
    pdfDoc.addPage(labelPage);
  }
  
  // Generate final PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export default {
  generateLogisticLabelPDF,
  generateMultipleLogisticLabels
};
