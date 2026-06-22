"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { OrderStatus } from "@prisma/client";
import { useNow } from "@/components/admin/kitchen/useNow";
import { useOrderPolling } from "@/components/admin/orders/useOrderPolling";
import { useOrderStatusUpdate } from "@/components/admin/orders/useOrderStatusUpdate";
import { POS_POLL_INTERVAL_MS } from "@/lib/orders/admin-filters";
import {
  isPosVisibleOrder,
  partitionPosQueueOrders,
} from "@/lib/pos/queue-columns";
import {
  sendCustomerWaitTime,
  type PosWaitTimeMinutes,
} from "@/lib/pos/wait-time";
import { usePosDevice } from "@/lib/pos/usePosDevice";
import { useRmsStartup } from "@/lib/rms/startup-context";
import { isPosEmergencyDebug, posDebugLog } from "@/lib/debug/pos-emergency-debug";
import { toPrintableOrder } from "@/lib/pos/printable-order";
import { printRoutedReceipt } from "@/lib/printing/routing";
import { autoPrintNewOrder } from "@/lib/printing/auto-print";
import { unlockOrderAudio } from "@/components/admin/orders/playOrderSound";
import PosKioskKeypad from "./kiosk/PosKioskKeypad";
import PosKioskOrder from "./kiosk/PosKioskOrder";
import PosKioskQueue from "./kiosk/PosKioskQueue";
import PosProHeader from "./kiosk/PosProHeader";
import PosTerminalEnhancer from "./PosTerminalEnhancer";
import { usePosFullscreen } from "./usePosFullscreen";

export default function PosClient() {
  posDebugLog("POS RENDER");

  const [restaurantName, setRestaurantName] = useState("Restaurang");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [waitSelection, setWaitSelection] = useState<{
    orderId: string;
    minutes: PosWaitTimeMinutes;
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [printing, setPrinting] = useState(false);

  const now = useNow();
  const { screenSize, isTouch, profile } = usePosDevice();
  const { rootRef } = usePosFullscreen();
  const { notifyOrdersReady } = useRmsStartup();

  const {
    orders,
    loading,
    error,
    refresh,
    updateOrderLocally,
    setError,
  } = useOrderPolling({
    search: "",
    filter: "POS",
    soundEnabled: true,
    autoPrintMode: "off",
    restaurantName,
    deferRealtime: false,
    pollIntervalMs: POS_POLL_INTERVAL_MS,
    onInitialOrdersLoaded: notifyOrdersReady,
  });

  const visibleOrders = useMemo(
    () => orders.filter((order) => isPosVisibleOrder(order, now)),
    [orders, now]
  );

  const queueColumns = useMemo(
    () => partitionPosQueueOrders(visibleOrders),
    [visibleOrders]
  );

  const activeOrderId = useMemo(() => {
    if (visibleOrders.length === 0) return null;
    if (
      selectedOrderId &&
      visibleOrders.some((order) => order.id === selectedOrderId)
    ) {
      return selectedOrderId;
    }
    return visibleOrders[0].id;
  }, [visibleOrders, selectedOrderId]);

  const selectedOrder =
    visibleOrders.find((order) => order.id === activeOrderId) ?? null;

  const selectedMinutes =
    waitSelection?.orderId === activeOrderId ? waitSelection.minutes : null;

  const { actingId, handleAction } = useOrderStatusUpdate({
    orders: visibleOrders,
    refresh,
    updateOrderLocally,
    setError,
    confirmCancel: false,
  });

  useEffect(() => {
    document.documentElement.classList.add("pos-terminal-mode");
    const unlock = () => unlockOrderAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.documentElement.classList.remove("pos-terminal-mode");
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (isPosEmergencyDebug()) return;

    void fetch("/api/admin/context")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.tenant?.name) setRestaurantName(data.tenant.name);
      })
      .catch(() => undefined);

    void fetch("/api/settings/public")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (typeof data?.logo === "string" && data.logo.trim()) {
          setLogoUrl(data.logo.trim());
        }
      })
      .catch(() => undefined);
  }, []);

  const handleSelect = useCallback(
    (orderId: string) => {
      setSelectedOrderId(orderId);
      setWaitSelection(null);
      setError("");
    },
    [setError]
  );

  const handlePickMinutes = useCallback(
    (minutes: PosWaitTimeMinutes) => {
      if (!activeOrderId) return;
      setWaitSelection({ orderId: activeOrderId, minutes });
    },
    [activeOrderId]
  );

  const handleSend = useCallback(async () => {
    if (!selectedOrder || !selectedMinutes || sending) return;

    const orderId = selectedOrder.id;
    const minutes = selectedMinutes;
    const orderSnapshot = selectedOrder;

    setSending(true);
    setError("");
    updateOrderLocally(orderId, {
      status: OrderStatus.CONFIRMED,
      estimatedReadyMinutes: minutes,
    });
    setWaitSelection(null);

    try {
      await sendCustomerWaitTime({ orderId, minutes });
      void autoPrintNewOrder(
        {
          ...orderSnapshot,
          status: OrderStatus.CONFIRMED,
          estimatedReadyMinutes: minutes,
        },
        restaurantName,
        { posMode: true }
      );
    } catch (err) {
      updateOrderLocally(orderId, {
        status: OrderStatus.NEW,
        estimatedReadyMinutes: null,
      });
      setSelectedOrderId(orderId);
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Kunde inte skicka order.";
      setError(message);
      void refresh();
    } finally {
      setSending(false);
    }
  }, [
    selectedOrder,
    selectedMinutes,
    sending,
    setError,
    restaurantName,
    updateOrderLocally,
    refresh,
  ]);

  const handleStatusAction = useCallback(
    (status: OrderStatus) => {
      if (!selectedOrder || sending || printing) return;
      void handleAction(selectedOrder.id, status, selectedOrder);
    },
    [selectedOrder, sending, printing, handleAction]
  );

  const handlePrint = useCallback(async () => {
    if (!selectedOrder || printing || sending) return;

    setPrinting(true);
    setError("");
    try {
      const result = await printRoutedReceipt(
        toPrintableOrder(selectedOrder),
        restaurantName
      );
      if (!result.success) {
        setError(result.errorMessage ?? "Kunde inte skriva ut ordern.");
      }
    } catch {
      setError("Kunde inte skriva ut ordern.");
    } finally {
      setPrinting(false);
    }
  }, [selectedOrder, printing, sending, restaurantName, setError]);

  const busy =
    sending || printing || (actingId !== null && actingId === activeOrderId);

  return (
    <>
      <PosTerminalEnhancer />
      <div
        ref={rootRef}
        className="pos-pro"
        data-pos-screen={screenSize}
        data-pos-profile={profile.id}
        data-pos-touch={isTouch ? "true" : "false"}
      >
        <PosProHeader
          restaurantName={restaurantName}
          logoUrl={logoUrl}
          newOrderCount={queueColumns.new.length}
          nowMs={now}
        />

        {error ? (
          <div className="pos-pro-error" role="alert">
            <span className="pos-pro-error__text">{error}</span>
            <button
              type="button"
              className="pos-pro-error__retry"
              onClick={() => {
                setError("");
                void refresh();
              }}
            >
              Försök igen
            </button>
          </div>
        ) : null}

        <div className="pos-pro-body">
          {loading ? (
            <div className="pos-pro-loading">Laddar ordrar…</div>
          ) : (
            <>
              <PosKioskQueue
                columns={queueColumns}
                selectedOrderId={activeOrderId}
                nowMs={now}
                onSelect={handleSelect}
              />
              <PosKioskOrder order={selectedOrder} />
              <PosKioskKeypad
                order={selectedOrder}
                selectedMinutes={selectedMinutes}
                busy={busy}
                printing={printing}
                onPick={handlePickMinutes}
                onAccept={() => void handleSend()}
                onStatusAction={handleStatusAction}
                onPrint={() => void handlePrint()}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
