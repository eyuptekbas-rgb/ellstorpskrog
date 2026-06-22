import type { PrintDocument, PrintResult, PrintableOrder } from "./types";
import type { PrinterRole } from "./printer-registry";
import { isPosEmergencyDebug, posDebugLog } from "@/lib/debug/pos-emergency-debug";

export type PrintQueueItem = {
  id: string;
  role: PrinterRole;
  documentType: "receipt" | "kitchen-ticket";
  orderNumber: string;
  categoryId?: string;
  payload: PrintableOrder;
  restaurantName: string;
  attempts: number;
  createdAt: string;
  lastAttemptAt?: string;
  lastError?: string;
};

const STORAGE_KEY = "rms-print-retry-queue";
const MAX_ATTEMPTS = 5;

export function loadPrintQueue(): PrintQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PrintQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePrintQueue(items: PrintQueueItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function enqueuePrintRetry(item: Omit<PrintQueueItem, "id" | "attempts" | "createdAt">) {
  if (isPosEmergencyDebug()) {
    posDebugLog("PRINT RETRY ENQUEUE BYPASS", item.orderNumber);
    return;
  }
  const queue = loadPrintQueue();
  queue.push({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    attempts: 0,
    createdAt: new Date().toISOString(),
  });
  savePrintQueue(queue);
}

export function dequeuePrintItem(id: string) {
  savePrintQueue(loadPrintQueue().filter((item) => item.id !== id));
}

export function markPrintAttempt(id: string, result: PrintResult) {
  const queue = loadPrintQueue();
  const next = queue
    .map((item) => {
      if (item.id !== id) return item;
      const attempts = item.attempts + 1;
      if (result.success || attempts >= MAX_ATTEMPTS) return null;
      return {
        ...item,
        attempts,
        lastAttemptAt: new Date().toISOString(),
        lastError: result.errorMessage,
      };
    })
    .filter((item): item is PrintQueueItem => item !== null);
  savePrintQueue(next);
}

export function clearPrintQueue() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export type PrintExecutor = (
  item: PrintQueueItem
) => Promise<PrintResult>;

let queueProcessing = false;

export async function processPrintQueue(executor: PrintExecutor): Promise<number> {
  if (isPosEmergencyDebug()) {
    posDebugLog("PRINT QUEUE BYPASS");
    return 0;
  }

  if (queueProcessing) return 0;
  queueProcessing = true;

  try {
    const queue = loadPrintQueue();
    let processed = 0;
    for (const item of queue) {
      const result = await executor(item);
      processed += 1;
      if (result.success) {
        dequeuePrintItem(item.id);
      } else {
        markPrintAttempt(item.id, result);
      }
    }
    return processed;
  } finally {
    queueProcessing = false;
  }
}

export type { PrintDocument };
