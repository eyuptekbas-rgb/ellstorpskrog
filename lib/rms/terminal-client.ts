const TERMINAL_ID_KEY = "rms-terminal-id";
const TERMINAL_META_KEY = "rms-terminal-meta";
const TERMINAL_KIND_KEY = "rms-terminal-kind";

export type TerminalMeta = {
  name: string;
  location: string;
  kitchen: string;
};

export type TerminalDeviceKind = "pos" | "kitchen" | "customer-display" | "delivery";

const DEFAULT_META: TerminalMeta = {
  name: "POS Terminal",
  location: "Front",
  kitchen: "Main",
};

export function getOrCreateTerminalId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(TERMINAL_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `term-${Date.now()}`;
    localStorage.setItem(TERMINAL_ID_KEY, id);
  }
  return id;
}

export function loadTerminalMeta(): TerminalMeta {
  if (typeof window === "undefined") return DEFAULT_META;
  try {
    const raw = localStorage.getItem(TERMINAL_META_KEY);
    if (!raw) return DEFAULT_META;
    return { ...DEFAULT_META, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_META;
  }
}

export function saveTerminalMeta(meta: TerminalMeta) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TERMINAL_META_KEY, JSON.stringify(meta));
}

export function detectTerminalDeviceKind(): TerminalDeviceKind {
  if (typeof window === "undefined") return "pos";
  const stored = localStorage.getItem(TERMINAL_KIND_KEY);
  if (stored === "kitchen" || stored === "customer-display" || stored === "delivery") {
    return stored;
  }
  const path = window.location.pathname;
  if (path.includes("/kitchen")) return "kitchen";
  if (path.includes("/customer-display")) return "customer-display";
  if (path.includes("/delivery")) return "delivery";
  return "pos";
}

function collectTelemetry() {
  if (typeof window === "undefined") return {};

  let printQueueLength = 0;
  let offlineQueueLength = 0;
  try {
    const printRaw = localStorage.getItem("rms-print-retry-queue");
    if (printRaw) {
      const parsed = JSON.parse(printRaw) as unknown[];
      printQueueLength = Array.isArray(parsed) ? parsed.length : 0;
    }
    const offlineRaw = localStorage.getItem("rms-offline-queue");
    if (offlineRaw) {
      const parsed = JSON.parse(offlineRaw) as unknown[];
      offlineQueueLength = Array.isArray(parsed) ? parsed.length : 0;
    }
  } catch {
    // Ignore telemetry parse errors.
  }

  return {
    deviceKind: detectTerminalDeviceKind(),
    printQueueLength,
    offlineQueueLength,
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0",
  };
}

import { isPosEmergencyDebug, posDebugLog } from "@/lib/debug/pos-emergency-debug";

export function sendTerminalHeartbeat(): void {
  if (isPosEmergencyDebug()) {
    posDebugLog("HEARTBEAT BYPASS");
    return;
  }
  if (typeof window === "undefined") return;

  const meta = loadTerminalMeta();
  const telemetry = collectTelemetry();

  void fetch("/api/admin/terminals/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: getOrCreateTerminalId(),
      ...meta,
      ...telemetry,
    }),
  }).catch(() => undefined);
}

export function startTerminalHeartbeat(intervalMs = 20_000): () => void {
  if (isPosEmergencyDebug()) {
    posDebugLog("HEARTBEAT START BYPASS");
    return () => undefined;
  }
  if (typeof window === "undefined") return () => undefined;

  sendTerminalHeartbeat();
  const timer = setInterval(sendTerminalHeartbeat, intervalMs);
  return () => clearInterval(timer);
}
