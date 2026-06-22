import type { BarcodeScanEvent, BarcodeScannerProvider } from "../index";
import { createCameraScannerProvider } from "./camera";
import { createKeyboardWedgeScanner } from "./keyboard-wedge";

/** Composite barcode scanner — keyboard wedge (USB) + optional camera. */
export function createCompositeBarcodeScanner(): BarcodeScannerProvider {
  const wedge = createKeyboardWedgeScanner();
  const camera = createCameraScannerProvider();

  return {
    kind: "barcode-scanner",
    id: "composite-barcode",
    label: "Barcode Scanner (USB + Keyboard)",
    status() {
      if (wedge.status() === "available") return "available";
      if (camera.isSupported()) return "available";
      return "unavailable";
    },
    subscribe(onScan: (event: BarcodeScanEvent) => void) {
      const unsubWedge = wedge.subscribe(onScan);
      return () => {
        unsubWedge();
        camera.stop();
      };
    },
  };
}

export { createCameraScannerProvider, createKeyboardWedgeScanner };
