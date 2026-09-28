export interface PdfBuffer {
  readonly length: number;
  toString(encoding?: string): string;
}

export interface BarcodeGeometry {
  modules: Array<{ black: boolean; width: number }>;
  totalModules: number;
  moduleWidthPoints: number;
  moduleWidthMillimeters: number;
  barHeightPoints: number;
  barHeightMillimeters: number;
  quietZoneModules: number;
  quietZoneWidth: number;
  symbolWidth: number;
  requiredWidth: number;
}

export function generateLogisticLabelPDF(
  labelData: Record<string, unknown>,
  options?: { company_name?: string }
): Promise<PdfBuffer>;

export function generateMultipleLogisticLabels(
  labelDataArray: Array<Record<string, unknown>>,
  options?: { company_name?: string }
): Promise<PdfBuffer>;

export function validateGuidedLabelBarcodeFit(
  labelData: Record<string, unknown>,
  elements?: Array<{ ai: string; value: string }>
): void;

export function calculateBarcodeGeometry(
  elements: Array<{ ai: string; value: string }>
): BarcodeGeometry;

declare const labelGenerator: {
  generateLogisticLabelPDF: typeof generateLogisticLabelPDF;
  generateMultipleLogisticLabels: typeof generateMultipleLogisticLabels;
};

export default labelGenerator;
