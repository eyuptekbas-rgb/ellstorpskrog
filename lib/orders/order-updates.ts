import type { OrderFilterGroup } from "@/lib/orders/admin-filters";
import { POLL_INTERVAL_MS } from "@/lib/orders/admin-filters";
import type { AdminOrderListItem } from "@/components/admin/orders/useOrderPolling";
import { defaultFetchOrdersImpl } from "./order-updates-fetch";
import { createSseOrderUpdatesTransport } from "./sse-transport";

export type OrderUpdatesFetchParams = {
  search: string;
  filter: OrderFilterGroup;
};

export type OrderUpdatesTransport = {
  readonly kind: "polling" | "realtime";
  fetchOrders(params: OrderUpdatesFetchParams): Promise<AdminOrderListItem[]>;
  subscribe(
    params: OrderUpdatesFetchParams,
    onTick: () => void,
    intervalMs?: number
  ): () => void;
};

export const pollingOrderUpdatesTransport: OrderUpdatesTransport = {
  kind: "polling",
  fetchOrders: defaultFetchOrdersImpl,
  subscribe(params, onTick, intervalMs = POLL_INTERVAL_MS) {
    void params;
    const interval = setInterval(onTick, intervalMs);
    return () => clearInterval(interval);
  },
};

let cachedSseTransport: OrderUpdatesTransport | null = null;

function getSseTransport(): OrderUpdatesTransport {
  if (!cachedSseTransport) {
    cachedSseTransport = createSseOrderUpdatesTransport();
  }
  return cachedSseTransport;
}

export function resolveOrderUpdatesTransport(): OrderUpdatesTransport {
  if (typeof window !== "undefined" && typeof EventSource !== "undefined") {
    return getSseTransport();
  }
  return pollingOrderUpdatesTransport;
}

export { POLL_INTERVAL_MS };
