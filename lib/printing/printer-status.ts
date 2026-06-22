export type PrinterStatusState =
  | "online"
  | "offline"
  | "printing"
  | "error"
  | "paper_out"
  | "cover_open"
  | "busy";

export type PrinterStatusSnapshot = {
  state: PrinterStatusState;
  message: string;
  updatedAt: string;
  activeJob?: string;
};

const listeners = new Set<(snapshot: PrinterStatusSnapshot) => void>();

let snapshot: PrinterStatusSnapshot = {
  state: "online",
  message: "Skrivare redo",
  updatedAt: new Date().toISOString(),
};

function emit() {
  for (const listener of listeners) listener(snapshot);
}

export function getPrinterStatus(): PrinterStatusSnapshot {
  return snapshot;
}

export function subscribePrinterStatus(
  listener: (state: PrinterStatusSnapshot) => void
): () => void {
  listeners.add(listener);
  listener(snapshot);
  return () => listeners.delete(listener);
}

export function setPrinterStatus(
  state: PrinterStatusState,
  message?: string,
  activeJob?: string
) {
  snapshot = {
    state,
    message: message ?? defaultMessage(state),
    updatedAt: new Date().toISOString(),
    activeJob,
  };
  emit();
}

function defaultMessage(state: PrinterStatusState): string {
  switch (state) {
    case "online":
      return "Skrivare redo";
    case "offline":
      return "Skrivare offline";
    case "printing":
      return "Skriver ut…";
    case "error":
      return "Skrivarfel";
    case "paper_out":
      return "Papper slut";
    case "cover_open":
      return "Lock öppet";
    case "busy":
      return "Skrivare upptagen";
  }
}

export function markPrinterPrinting(jobLabel: string) {
  setPrinterStatus("printing", `Skriver ut ${jobLabel}…`, jobLabel);
}

export function markPrinterResult(
  success: boolean,
  errorMessage?: string,
  printerState?: PrinterStatusState
) {
  if (success) {
    setPrinterStatus("online");
    return;
  }

  if (printerState) {
    setPrinterStatus(printerState, errorMessage);
    return;
  }

  const lower = errorMessage?.toLowerCase() ?? "";
  if (lower.includes("papper")) {
    setPrinterStatus("paper_out", errorMessage);
    return;
  }
  if (lower.includes("lock")) {
    setPrinterStatus("cover_open", errorMessage);
    return;
  }
  if (lower.includes("upptagen") || lower.includes("busy")) {
    setPrinterStatus("busy", errorMessage);
    return;
  }

  const offline =
    lower.includes("timeout") ||
    lower.includes("connection") ||
    lower.includes("offline") ||
    lower.includes("not configured") ||
    lower.includes("konfigurerad");

  setPrinterStatus(offline ? "offline" : "error", errorMessage ?? "Utskrift misslyckades");
}
