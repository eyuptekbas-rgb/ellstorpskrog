"use client";

import { clearPrintQueue } from "@/lib/printing/print-queue";
import { checkNetworkPrinterStatus } from "@/lib/printing/providers/network-escpos";
import type { RmsOperationType } from "@/lib/rms/operations";
import { sendTerminalHeartbeat } from "@/lib/rms/terminal-client";

export type OperationResult = {
  operation: RmsOperationType;
  success: boolean;
  message: string;
};

export async function executeClientRmsOperation(
  operation: RmsOperationType
): Promise<OperationResult> {
  switch (operation) {
    case "restart-realtime": {
      window.dispatchEvent(new CustomEvent("rms:restart-realtime"));
      return {
        operation,
        success: true,
        message: "Realtime-anslutning startas om.",
      };
    }
    case "reconnect-printers": {
      const status = await checkNetworkPrinterStatus();
      window.dispatchEvent(new CustomEvent("rms:reconnect-printers"));
      return {
        operation,
        success: true,
        message: status.configured
          ? `Skrivare kontrollerade (${status.statuses.length}).`
          : "Ingen nätverksskrivare konfigurerad.",
      };
    }
    case "clear-print-queue": {
      clearPrintQueue();
      return {
        operation,
        success: true,
        message: "Utskriftskön rensad på denna terminal.",
      };
    }
    case "resync-terminals": {
      sendTerminalHeartbeat();
      return {
        operation,
        success: true,
        message: "Terminal synkad.",
      };
    }
    case "export-logs": {
      const res = await fetch("/api/admin/operations");
      if (!res.ok) {
        return {
          operation,
          success: false,
          message: "Kunde inte exportera loggar.",
        };
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rms-logs-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return {
        operation,
        success: true,
        message: "Loggar exporterade.",
      };
    }
    default:
      return {
        operation,
        success: false,
        message: "Okänd operation.",
      };
  }
}

export function subscribeRmsOperations(
  onOperation: (operation: RmsOperationType) => void
): () => void {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<RmsOperationType>).detail;
    if (detail) onOperation(detail);
  };

  window.addEventListener("rms:operation", handler);
  return () => window.removeEventListener("rms:operation", handler);
}

export function listenForRmsOperationEvents(): () => void {
  const onRestart = () =>
    window.dispatchEvent(new CustomEvent("rms:restart-realtime"));
  const onReconnect = () =>
    window.dispatchEvent(new CustomEvent("rms:reconnect-printers"));

  window.addEventListener("rms:restart-realtime", onRestart);
  window.addEventListener("rms:reconnect-printers", onReconnect);

  return () => {
    window.removeEventListener("rms:restart-realtime", onRestart);
    window.removeEventListener("rms:reconnect-printers", onReconnect);
  };
}
