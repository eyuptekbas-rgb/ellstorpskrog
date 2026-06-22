"use client";

import type { CustomerDisplayState } from "./provider";

const STALE_MS = 15_000;
const RECONNECT_POLL_MS = 2_000;

export type CustomerDisplayConnectionState =
  | "connected"
  | "reconnecting"
  | "waiting";

export function subscribeCustomerDisplayWithReconnect(
  onChange: (state: CustomerDisplayState | null) => void,
  onConnection: (state: CustomerDisplayConnectionState) => void,
  subscribe: (cb: (state: CustomerDisplayState | null) => void) => () => void
): () => void {
  let lastUpdate = Date.now();
  let connection: CustomerDisplayConnectionState = "waiting";

  const setConnection = (next: CustomerDisplayConnectionState) => {
    if (connection === next) return;
    connection = next;
    onConnection(next);
  };

  const unsub = subscribe((state) => {
    lastUpdate = Date.now();
    setConnection(state ? "connected" : "waiting");
    onChange(state);
  });

  const poll = setInterval(() => {
    const age = Date.now() - lastUpdate;
    if (age > STALE_MS) {
      setConnection("reconnecting");
      try {
        const raw = localStorage.getItem("rms-customer-display-state");
        if (raw) {
          onChange(JSON.parse(raw) as CustomerDisplayState);
          lastUpdate = Date.now();
          setConnection("connected");
        }
      } catch {
        // Ignore parse errors during reconnect.
      }
    }
  }, RECONNECT_POLL_MS);

  return () => {
    clearInterval(poll);
    unsub();
  };
}
