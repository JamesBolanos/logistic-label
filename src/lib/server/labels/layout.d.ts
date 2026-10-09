import type { BarcodeGeometry } from '../pdf/labelGenerator.js';

export type BarcodeItem = {
  type: 'barcode';
  elements: Array<{ ai: string; value: string }>;
  x: number;
  y: number;
  width: number;
  height: number;
  compliant: boolean;
};

export type LayoutItem =
  | BarcodeItem
  | { type: 'text'; text: string; x: number; y: number; size: number; bold: boolean }
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number; lineWidth: number }
  | { type: 'outline'; x: number; y: number; width: number; height: number; lineWidth: number }
  | { type: 'cutGuide'; y: number; pageWidth: number }
  | { type: 'circle'; centerX: number; centerY: number; radius: number };

export function generateLogisticLabelLayout(
  labelData: Record<string, unknown>,
  options?: { company_name?: string }
): { content: LayoutItem[]; width: number; height: number };

export function calculateBarcodeGeometry(elements: BarcodeItem['elements']): BarcodeGeometry;
export function validateGuidedLabelBarcodeFit(
  labelData: Record<string, unknown>,
  elements?: BarcodeItem['elements']
): void;
