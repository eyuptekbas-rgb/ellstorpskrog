"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OrderStatus } from "@prisma/client";
import type { OrderFilterGroup } from "@/lib/orders/admin-filters";
import { POLL_INTERVAL_MS } from "@/lib/orders/admin-filters";
import {
  pollingOrderUpdatesTransport,
  resolveOrderUpdatesTransport,
  type OrderUpdatesTransport,
} from "@/lib/orders/order-updates";
import { autoPrintNewOrder } from "@/lib/printing/auto-print";
import { isPosEmergencyDebug, posDebugLog } from "@/lib/debug/pos-emergency-debug";
import {
  playNewOrderSound,
  startPersistentNewOrderAlert,
  stopPersistentNewOrderAlert,
  unlockOrderAudio,
} from "./playOrderSound";
import { isPosActionableOrder } from "@/lib/pos/queue-columns";

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string | null;
  orderType: import("@prisma/client").OrderType;
  paymentMethod: import("@prisma/client").PaymentMethod;
  paymentStatus: import("@prisma/client").PaymentStatus;
  total: number;
  status: OrderStatus;
  note: string | null;
  adminNote: string | null;
  estimatedReadyMinutes: number | null;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    productName: string;
    unitPrice: number;
    totalPrice: number;
  }[];
};

type Options = {
  search: string;
  filter: OrderFilterGroup;
  soundEnabled?: boolean;
  transport?: OrderUpdatesTransport;
  /** POS: always auto-print NEW orders. settings: respect terminal toggles. */
  autoPrintMode?: "pos" | "settings" | "off";
  restaurantName?: string;
  /** Defer SSE/realtime subscribe until after the first successful fetch. */
  deferRealtime?: boolean;
  /** Polling interval while SSE is active (POS should use a short value). */
  pollIntervalMs?: number;
  /** Called once after the first successful order fetch (POS background startup). */
  onInitialOrdersLoaded?: () => void;
};

function resolveTransport(explicit?: OrderUpdatesTransport): OrderUpdatesTransport {
  if (explicit) return explicit;
  if (isPosEmergencyDebug()) {
    posDebugLog("ORDER TRANSPORT: polling-only (SSE disabled)");
    return pollingOrderUpdatesTransport;
  }
  return resolveOrderUpdatesTransport();
}

export function useOrderPolling({
  search,
  filter,
  soundEnabled = true,
  transport: explicitTransport,
  autoPrintMode = "settings",
  restaurantName = "Restaurang",
  deferRealtime = false,
  pollIntervalMs = POLL_INTERVAL_MS,
  onInitialOrdersLoaded,
}: Options) {
  const transport = resolveTransport(explicitTransport);
  const effectiveAutoPrintMode = isPosEmergencyDebug() ? "off" : autoPrintMode;
  const effectiveDeferRealtime = isPosEmergencyDebug() ? true : deferRealtime;

  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState(!effectiveDeferRealtime);
  const knownNewIds = useRef<Set<string>>(new Set());
  const alertUntilAccepted = useRef(false);
  const initialized = useRef(false);
  const initialLoadNotified = useRef(false);
  const fetchGeneration = useRef(0);

  const fetchOrders = useCallback(
    async (silent = false) => {
      const gen = ++fetchGeneration.current;
      posDebugLog("FETCH ORDERS", { silent, gen, search, filter, transport: transport.kind });

      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError("");

      let fetchSucceeded = false;
      try {
        const started = performance.now();
        const data = await transport.fetchOrders({ search, filter });
        posDebugLog("FETCH COMPLETE", {
          gen,
          count: data.length,
          ms: Math.round(performance.now() - started),
        });

        const newOrders = data.filter((o) => o.status === OrderStatus.NEW);
        const notifiableNewOrders =
          filter === "POS"
            ? newOrders.filter(isPosActionableOrder)
            : newOrders;
        const newIds = new Set(notifiableNewOrders.map((o) => o.id));

        if (initialized.current && soundEnabled) {
          const hasFreshNew = notifiableNewOrders.some(
            (o) => !knownNewIds.current.has(o.id)
          );
          if (hasFreshNew) {
            unlockOrderAudio();
            if (filter === "POS") {
              alertUntilAccepted.current = true;
            } else {
              playNewOrderSound();
            }
          }
        }

        if (initialized.current && effectiveAutoPrintMode !== "off") {
          const freshNewOrders = notifiableNewOrders.filter(
            (o) => !knownNewIds.current.has(o.id)
          );
          for (const order of freshNewOrders) {
            void autoPrintNewOrder(order, restaurantName, {
              posMode: effectiveAutoPrintMode === "pos",
            });
          }
        }

        if (gen !== fetchGeneration.current) {
          return;
        }

        knownNewIds.current = newIds;
        initialized.current = true;
        setOrders(data);
        setLastUpdated(new Date());
        fetchSucceeded = true;
      } catch (err) {
        posDebugLog("FETCH ERROR", {
          gen,
          message: err instanceof Error ? err.message : String(err),
        });
        setError("Kunde inte hämta beställningar.");
      } finally {
        posDebugLog("FETCH FINALLY", { gen, loadingWillBeFalse: true });
        if (!initialLoadNotified.current && gen === fetchGeneration.current) {
          initialLoadNotified.current = true;
          if (effectiveDeferRealtime && !isPosEmergencyDebug()) {
            setRealtimeEnabled(true);
          }
          if (fetchSucceeded) {
            posDebugLog("NOTIFY ORDERS READY");
            onInitialOrdersLoaded?.();
          }
        }
        if (gen === fetchGeneration.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [
      transport,
      search,
      filter,
      soundEnabled,
      effectiveAutoPrintMode,
      restaurantName,
      effectiveDeferRealtime,
      onInitialOrdersLoaded,
    ]
  );

  useEffect(() => {
    posDebugLog("FETCH EFFECT SCHEDULED", { search });
    const timer = setTimeout(() => {
      void fetchOrders(false);
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchOrders, search]);

  useEffect(() => {
    if (isPosEmergencyDebug()) {
      posDebugLog("SSE SUBSCRIBE SKIPPED (emergency debug)");
      return;
    }
    if (!realtimeEnabled) {
      posDebugLog("SSE SUBSCRIBE DEFERRED (realtimeEnabled=false)");
      return;
    }
    posDebugLog("SSE SUBSCRIBE START");
    return transport.subscribe({ search, filter }, () => {
      posDebugLog("SSE TICK → silent fetch");
      void fetchOrders(true);
    }, pollIntervalMs);
  }, [transport, search, filter, fetchOrders, realtimeEnabled, pollIntervalMs]);

  useEffect(() => {
    if (filter !== "POS" || !soundEnabled) {
      stopPersistentNewOrderAlert();
      return;
    }

    const pendingNew = orders.filter(
      (order) =>
        order.status === OrderStatus.NEW && isPosActionableOrder(order)
    );

    if (alertUntilAccepted.current && pendingNew.length > 0) {
      unlockOrderAudio();
      startPersistentNewOrderAlert();
    } else {
      if (pendingNew.length === 0) {
        alertUntilAccepted.current = false;
      }
      stopPersistentNewOrderAlert();
    }
  }, [orders, filter, soundEnabled]);

  useEffect(() => () => stopPersistentNewOrderAlert(), []);

  const updateOrderLocally = useCallback(
    (orderId: string, patch: Partial<AdminOrderListItem>) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, ...patch } : order
        )
      );
    },
    []
  );

  const removeOrderLocally = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
  }, []);

  return {
    orders,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh: () => fetchOrders(true),
    updateOrderLocally,
    removeOrderLocally,
    setError,
    transportKind: transport.kind,
  };
}
