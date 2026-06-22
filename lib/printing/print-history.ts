export type PrintHistoryEntry = {
  id: string;
  role: string;
  orderNumber: string;
  documentType: "receipt" | "kitchen-ticket";
  providerId: string;
  success: boolean;
  errorMessage?: string;
  at: string;
};

const STORAGE_KEY = "rms-print-history";
const MAX_ENTRIES = 200;

export function loadPrintHistory(): PrintHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PrintHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendPrintHistory(entry: Omit<PrintHistoryEntry, "id" | "at">) {
  if (typeof window === "undefined") return;
  const rows = loadPrintHistory();
  rows.unshift({
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, MAX_ENTRIES)));
}

export function clearPrintHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
