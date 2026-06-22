import type { BarcodeScanEvent } from "../index";
import { getBarcodeDetector } from "./detector-types";

export type CameraScannerStatus =
  | "idle"
  | "starting"
  | "scanning"
  | "unavailable";

export type CameraScannerProvider = {
  readonly id: "camera";
  readonly label: string;
  status(): CameraScannerStatus;
  isSupported(): boolean;
  start(onScan: (event: BarcodeScanEvent) => void): Promise<{ success: boolean; error?: string }>;
  stop(): void;
};

/** Camera barcode scanner abstraction — uses BarcodeDetector when available. */
export function createCameraScannerProvider(): CameraScannerProvider {
  let stream: MediaStream | null = null;
  let raf = 0;
  let listener: ((event: BarcodeScanEvent) => void) | null = null;
  let state: CameraScannerStatus = "idle";

  const isSupported = () => getBarcodeDetector() !== null;

  return {
    id: "camera",
    label: "Camera scanner",
    status: () => state,
    isSupported,
    async start(onScan) {
      if (!isSupported()) {
        state = "unavailable";
        return {
          success: false,
          error: "Camera barcode scanning not supported in this browser.",
        };
      }

      listener = onScan;
      state = "starting";

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        state = "scanning";

        const Detector = getBarcodeDetector();
        if (!Detector) {
          state = "unavailable";
          return { success: false, error: "BarcodeDetector unavailable." };
        }
        const detector = new Detector({
          formats: ["ean_13", "ean_8", "code_128", "qr_code"],
        });
        const video = document.createElement("video");
        video.srcObject = stream;
        video.playsInline = true;
        await video.play();

        const tick = async () => {
          if (!listener || state !== "scanning") return;
          try {
            const codes = await detector.detect(video);
            const match = codes[0];
            if (match?.rawValue) {
              listener({
                code: match.rawValue,
                format: match.format,
                at: new Date().toISOString(),
              });
            }
          } catch {
            // Ignore frame detection errors.
          }
          raf = requestAnimationFrame(() => void tick());
        };

        void tick();
        return { success: true };
      } catch (err) {
        state = "unavailable";
        return {
          success: false,
          error: err instanceof Error ? err.message : "Camera access denied.",
        };
      }
    },
    stop() {
      state = "idle";
      listener = null;
      if (raf) cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
    },
  };
}
