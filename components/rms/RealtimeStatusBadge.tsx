"use client";

import { useEffect, useState } from "react";
import {
  getRealtimeConnectionState,
  subscribeRealtimeConnection,
  type RealtimeConnectionState,
} from "@/lib/orders/sse-transport";
import { isPosEmergencyDebug } from "@/lib/debug/pos-emergency-debug";

const LABELS: Record<RealtimeConnectionState, string> = {
  connected: "Live",
  reconnecting: "Återansluter",
  offline: "Offline",
};

export default function RealtimeStatusBadge() {
  const debug = isPosEmergencyDebug();
  const [state, setState] = useState<RealtimeConnectionState>(() =>
    typeof window !== "undefined" ? getRealtimeConnectionState() : "offline"
  );

  useEffect(() => {
    if (debug) return;
    return subscribeRealtimeConnection(setState);
  }, [debug]);

  if (debug) return null;

  if (state === "connected") return null;

  return (
    <span
      className="rms-status-live rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70"
      data-state={state}
      role="status"
      aria-live="polite"
    >
      {LABELS[state]}
    </span>
  );
}
