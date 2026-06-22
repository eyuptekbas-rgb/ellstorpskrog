"use client";

import { useCallback, useRef, useState } from "react";
import { OrderStatus } from "@prisma/client";
import {
  enqueueOfflineAction,
  isBrowserOnline,
} from "@/lib/offline/queue";
import type { AdminOrderListItem } from "./useOrderPolling";

type Options = {
  orders: AdminOrderListItem[];
  refresh: () => Promise<void>;
  updateOrderLocally: (
    orderId: string,
    patch: Partial<AdminOrderListItem>
  ) => void;
  setError: (message: string) => void;
  confirmCancel?: boolean;
};

export function useOrderStatusUpdate({
  orders,
  refresh,
  updateOrderLocally,
  setError,
  confirmCancel = true,
}: Options) {
  const [actingId, setActingId] = useState<string | null>(null);
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  const handleAction = useCallback(
    async (
      orderId: string,
      status: OrderStatus,
      orderHint?: AdminOrderListItem
    ) => {
      const order =
        orderHint ?? ordersRef.current.find((o) => o.id === orderId);
      if (!order) {
        setError("Ordern hittades inte. Uppdatera listan och försök igen.");
        return;
      }

      if (
        confirmCancel &&
        status === OrderStatus.CANCELLED &&
        !window.confirm(`Avvisa/avbryt order ${order.orderNumber}?`)
      ) {
        return;
      }

      setActingId(orderId);
      setError("");
      updateOrderLocally(orderId, { status });

      if (!isBrowserOnline()) {
        enqueueOfflineAction({
          type: "order-status-update",
          payload: {
            orderId,
            status,
            previousStatus: order.status,
          },
        });
        setActingId(null);
        return;
      }

      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
        void refresh();
      } catch (error) {
        updateOrderLocally(orderId, { status: order.status });
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Kunde inte uppdatera ordern.";
        setError(message);
      } finally {
        setActingId(null);
      }
    },
    [refresh, setError, updateOrderLocally, confirmCancel]
  );

  return { actingId, handleAction };
}
