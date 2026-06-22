/** BarcodeDetector API (Chrome / Edge). */

export type DetectedBarcode = {
  rawValue?: string;
  format?: string;
};

export type BarcodeDetectorLike = {
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
};

export type BarcodeDetectorConstructor = {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
};

export function getBarcodeDetector(): BarcodeDetectorConstructor | null {
  if (typeof window === "undefined") return null;
  const ctor = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector;
  return ctor ?? null;
}
