"use client";

import type { OrderFilterGroup } from "@/lib/orders/admin-filters";
import { POLL_INTERVAL_MS } from "@/lib/orders/admin-filters";
import type { AdminOrderListItem } from "@/components/admin/orders/useOrderPolling";
import type { OrderUpdatesFetchParams, OrderUpdatesTransport } from "./order-updates";
import { defaultFetchOrdersImpl } from "./order-updates-fetch";

const MAX_RECONNECT_DELAY_MS = 30_000;

function createReconnectDelay(attempt: number): number {
  return Math.min(POLL_INTERVAL_MS * 2 ** attempt, MAX_RECONNECT_DELAY_MS);
}

export type RealtimeConnectionState = "connected" | "reconnecting" | "offline";

type ConnectionListener = (state: RealtimeConnectionState) => void;

const connectionListeners = new Set<ConnectionListener>();
let connectionState: RealtimeConnectionState = "offline";

export function getRealtimeConnectionState(): RealtimeConnectionState {
  return connectionState;
}

export function subscribeRealtimeConnection(listener: ConnectionListener): () => void {
  connectionListeners.add(listener);
  listener(connectionState);
  return () => connectionListeners.delete(listener);
}

function setConnectionState(state: RealtimeConnectionState) {
  if (connectionState === state) return;
  connectionState = state;
  for (const listener of connectionListeners) {
    listener(state);
  }
}

export function createSseOrderUpdatesTransport(): OrderUpdatesTransport {
  return {
    kind: "realtime",
    fetchOrders: defaultFetchOrdersImpl,
    subscribe(_params: OrderUpdatesFetchParams, onTick, fallbackMs = POLL_INTERVAL_MS) {
      if (typeof window === "undefined") {
        const interval = setInterval(onTick, fallbackMs);
        return () => clearInterval(interval);
      }

      let es: EventSource | null = null;
      let polling: ReturnType<typeof setInterval> | null = null;
      let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
      let closed = false;
      let reconnectAttempt = 0;

      const trigger = () => {
        if (!closed) onTick();
      };

      const startPolling = () => {
        if (!polling) {
          polling = setInterval(trigger, fallbackMs);
        }
      };

      const stopPolling = () => {
        if (polling) {
          clearInterval(polling);
          polling = null;
        }
      };

      const connect = () => {
        if (closed) return;

        if (es) {
          es.close();
          es = null;
        }

        if (typeof navigator !== "undefined" && !navigator.onLine) {
          setConnectionState("offline");
          return;
        }

        try {
          es = new EventSource("/api/realtime/stream");
          es.onopen = () => {
            reconnectAttempt = 0;
            setConnectionState("connected");
          };
          es.onmessage = trigger;
          es.addEventListener("NewOrder", trigger);
          es.addEventListener("OrderUpdated", trigger);
          es.addEventListener("KitchenUpdated", trigger);
          es.onerror = () => {
            if (closed) return;
            es?.close();
            es = null;
            setConnectionState("reconnecting");

            if (reconnectTimer) clearTimeout(reconnectTimer);
            const delay = createReconnectDelay(reconnectAttempt++);
            reconnectTimer = setTimeout(connect, delay);
          };
        } catch {
          setConnectionState("reconnecting");
        }
      };

      const onOnline = () => {
        reconnectAttempt = 0;
        connect();
      };

      const onOffline = () => {
        setConnectionState("offline");
        if (es) {
          es.close();
          es = null;
        }
      };

      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      // Always poll — in-memory SSE bus does not reach other server instances.
      startPolling();
      connect();

      return () => {
        closed = true;
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (es) es.close();
        stopPolling();
        setConnectionState("offline");
      };
    },
  };
}

export type { OrderUpdatesFetchParams, OrderUpdatesTransport, AdminOrderListItem, OrderFilterGroup };
