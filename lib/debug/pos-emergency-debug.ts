import type { PrintResult } from "@/lib/printing/types";

/**
 * When true, POS skips printer/SSE/background work (local debugging only).
 * Set NEXT_PUBLIC_POS_EMERGENCY_DEBUG=1 to enable — never in production.
 */
export const POS_EMERGENCY_DEBUG =
  process.env.NEXT_PUBLIC_POS_EMERGENCY_DEBUG === "1";

const PREFIX = "[POS-DEBUG]";

export function posDebugLog(stage: string, detail?: unknown) {
  if (!POS_EMERGENCY_DEBUG) return;
  const ts = new Date().toISOString().slice(11, 23);
  if (detail !== undefined) {
    console.log(`${PREFIX} ${ts} ${stage}`, detail);
  } else {
    console.log(`${PREFIX} ${ts} ${stage}`);
  }
}

export function isPosEmergencyDebug(): boolean {
  return POS_EMERGENCY_DEBUG;
}

export const DEBUG_PRINT_SUCCESS: PrintResult = {
  success: true,
  providerId: "debug",
  printerState: "online",
};

export function debugPrintSuccess(providerId = "debug"): PrintResult {
  return { success: true, providerId, printerState: "online" };
}
