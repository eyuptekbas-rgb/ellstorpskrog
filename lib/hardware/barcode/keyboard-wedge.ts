import type { BarcodeScanEvent } from "../index";

const SCAN_TIMEOUT_MS = 80;
const MIN_BARCODE_LENGTH = 4;

type ScanListener = (event: BarcodeScanEvent) => void;

/** USB/HID and keyboard-wedge scanners emit rapid keydown + Enter. */
export function createKeyboardWedgeScanner(): {
  subscribe(onScan: ScanListener): () => void;
  status(): "available" | "unavailable";
} {
  let buffer = "";
  let timer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<ScanListener>();

  const emit = (code: string) => {
    const event: BarcodeScanEvent = {
      code: code.trim(),
      format: "keyboard-wedge",
      at: new Date().toISOString(),
    };
    for (const listener of listeners) listener(event);
  };

  const flush = () => {
    if (buffer.length >= MIN_BARCODE_LENGTH) emit(buffer);
    buffer = "";
    timer = null;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const target = e.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea" || target?.isContentEditable) {
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      flush();
      return;
    }

    if (e.key.length === 1) {
      buffer += e.key;
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, SCAN_TIMEOUT_MS);
    }
  };

  return {
    status: () =>
      typeof window !== "undefined" ? "available" : "unavailable",
    subscribe(onScan) {
      if (typeof window === "undefined") return () => undefined;
      listeners.add(onScan);
      window.addEventListener("keydown", onKeyDown, true);
      return () => {
        listeners.delete(onScan);
        window.removeEventListener("keydown", onKeyDown, true);
      };
    },
  };
}
