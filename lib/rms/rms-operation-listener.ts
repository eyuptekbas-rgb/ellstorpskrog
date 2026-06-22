"use client";

import { executeClientRmsOperation } from "./operation-client";
import { isRmsOperationType } from "./operations";
import { isPosEmergencyDebug, posDebugLog } from "@/lib/debug/pos-emergency-debug";

/** Listen for admin-triggered RMS operations via SSE. */
export function startRmsOperationListener(): () => void {
  if (isPosEmergencyDebug()) {
    posDebugLog("RMS OPERATION SSE BYPASS");
    return () => undefined;
  }
  if (typeof window === "undefined") return () => undefined;

  let es: EventSource | null = null;

  try {
    es = new EventSource("/api/realtime/stream");

    es.addEventListener("RmsOperation", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as {
          payload?: { operation?: string };
        };
        const operation = data.payload?.operation;
        if (operation && isRmsOperationType(operation)) {
          window.dispatchEvent(
            new CustomEvent("rms:operation", { detail: operation })
          );
          void executeClientRmsOperation(operation);
        }
      } catch {
        // Ignore malformed operation events.
      }
    });
  } catch {
    return () => undefined;
  }

  return () => {
    es?.close();
    es = null;
  };
}
