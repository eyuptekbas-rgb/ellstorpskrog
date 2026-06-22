import type { PrinterRole } from "./printer-registry";

const STORAGE_KEY = "rms-print-dedup";
const MAX_KEYS = 500;

export type PrintDedupKey = {
  orderId: string;
  role: PrinterRole | "receipt";
  documentType: "receipt" | "kitchen-ticket";
  source: "auto" | "manual";
};

function storageKey(key: PrintDedupKey): string {
  return `${key.source}:${key.orderId}:${key.role}:${key.documentType}`;
}

function loadKeys(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function saveKeys(keys: Record<string, string>) {
  if (typeof window === "undefined") return;
  const entries = Object.entries(keys)
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, MAX_KEYS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
}

/** Returns true if this auto-print job already completed successfully. */
export function hasAutoPrintCompleted(key: Omit<PrintDedupKey, "source">): boolean {
  const keys = loadKeys();
  return Boolean(keys[storageKey({ ...key, source: "auto" })]);
}

export function markAutoPrintCompleted(key: Omit<PrintDedupKey, "source">) {
  const keys = loadKeys();
  keys[storageKey({ ...key, source: "auto" })] = new Date().toISOString();
  saveKeys(keys);
}

export function clearAutoPrintForOrder(orderId: string) {
  const keys = loadKeys();
  for (const k of Object.keys(keys)) {
    if (k.includes(`:${orderId}:`)) delete keys[k];
  }
  saveKeys(keys);
}
