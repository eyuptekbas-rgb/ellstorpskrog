"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
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
import { filterRecentOrders, getRecentOrderIds, trackRecentOrder } from "@/lib/pos/recent-orders";
import { findProductByBarcode, type PosCatalogProduct } from "@/lib/pos/quick-sale";

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
  const [toolsOpen, setToolsOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Array<{ id: string; name: string; email: string; phone: string | null }>>([]);
  const [catalog, setCatalog] = useState<PosCatalogProduct[]>([]);
  const [scannerMessage, setScannerMessage] = useState("");
  const [splitFirst, setSplitFirst] = useState("");

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
    autoPrintMode: "pos",
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

  const recentOrders = filterRecentOrders(orders, getRecentOrderIds()).slice(0, 8);

  const selectedMinutes =
    waitSelection?.orderId === activeOrderId ? waitSelection.minutes : null;

  const { actingId, handleAction } = useOrderStatusUpdate({
    orders: visibleOrders,
    refresh,
    updateOrderLocally,
    setError,
    confirmCancel: false,
    restaurantName,
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
    void fetch("/api/admin/pos/catalog")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setCatalog(data?.products ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let buffer = "";
    let last = 0;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const nowMs = Date.now();
      if (nowMs - last > 100) buffer = "";
      last = nowMs;
      if (event.key === "Enter" && buffer.length >= 3) {
        const product = findProductByBarcode(catalog, buffer);
        setScannerMessage(product ? `Skannad: ${product.name} · ${product.price} kr` : `Okänd streckkod: ${buffer}`);
        buffer = "";
      } else if (event.key.length === 1) buffer += event.key;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [catalog]);

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
      trackRecentOrder(orderId);
      setWaitSelection(null);
      setError("");
    },
    [setError]
  );

  const handleSplitPayment = useCallback(async () => {
    if (!selectedOrder || sending) return;
    const first = Number(splitFirst);
    const second = selectedOrder.total - first;
    if (!(first > 0 && second > 0)) {
      setError("Ange ett giltigt första delbelopp.");
      return;
    }
    setSending(true);
    try {
    const res = await fetch("/api/admin/pos/split-payment", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: selectedOrder.id, lines: [
        { method: PaymentMethod.ON_PICKUP, amount: first.toFixed(2) },
        { method: PaymentMethod.CARD, amount: second.toFixed(2) },
      ] }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error ?? "Kunde inte spara delbetalningen.");
    else {
      updateOrderLocally(selectedOrder.id, { paymentStatus: PaymentStatus.PAID });
      setSplitFirst("");
      await refresh();
    }
    } catch {
      setError("Kunde inte spara delbetalningen. Försök igen.");
    } finally {
      setSending(false);
    }
  }, [selectedOrder, sending, splitFirst, refresh, setError, updateOrderLocally]);

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
      confirmedAt: new Date().toISOString(),
    });
    setWaitSelection(null);

    try {
      const confirmed = await sendCustomerWaitTime({ orderId, minutes });
      updateOrderLocally(orderId, { confirmedAt: confirmed.confirmedAt });
    } catch (err) {
      updateOrderLocally(orderId, {
        status: OrderStatus.NEW,
        estimatedReadyMinutes: null,
        confirmedAt: null,
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

        <div className="hidden">
          <button type="button" className="hidden" onClick={() => setToolsOpen((value) => !value)}>
            Kassaverktyg · kunder · senaste · skanner · delbetalning
          </button>
          {scannerMessage ? <span className="ml-3 text-sm text-[#e8c4a8]">{scannerMessage}</span> : null}
          {toolsOpen ? (
            <div className="mt-2 grid gap-3 rounded-xl border border-white/10 bg-[#101010] p-3 lg:grid-cols-3">
              <div>
                <label className="text-xs text-white/60">Kundsökning</label>
                <input value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Namn, telefon eller e-post" className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 text-sm" />
                {customerResults.slice(0, 5).map((customer) => (
                  <button key={customer.id} type="button" className="block w-full border-b border-white/5 px-2 py-2 text-left text-xs" onClick={() => {
                    const match = orders.find((order) => order.customerEmail.toLowerCase() === customer.email.toLowerCase() || (customer.phone && order.customerPhone === customer.phone));
                    if (match) handleSelect(match.id); else setError("Kunden har ingen order i den aktuella POS-kön.");
                  }}>{customer.name} · {customer.phone ?? customer.email}</button>
                ))}
              </div>
              <div>
                <p className="text-xs text-white/60">Senaste valda ordrar</p>
                {recentOrders.length ? recentOrders.map((order) => <button key={order.id} type="button" onClick={() => handleSelect(order.id)} className="block w-full border-b border-white/5 px-2 py-2 text-left text-xs">#{order.orderNumber} · {order.customerName}</button>) : <p className="mt-2 text-xs text-white/40">Inga senaste ordrar.</p>}
              </div>
              <div>
                <p className="text-xs text-white/60">Delbetalning · kontant + kort</p>
                <p className="mt-1 text-xs">{selectedOrder ? `Order #${selectedOrder.orderNumber}, ${selectedOrder.total} kr` : "Välj en order"}</p>
                <input inputMode="decimal" value={splitFirst} onChange={(event) => setSplitFirst(event.target.value)} placeholder="Kontant belopp" className="mt-2 w-full rounded-lg bg-white/10 px-3 py-2 text-sm" />
                <button type="button" disabled={!selectedOrder || sending} onClick={() => void handleSplitPayment()} className="mt-2 rounded-lg bg-[#b85c38] px-3 py-2 text-sm disabled:opacity-50">Spara delbetalning</button>
                <p className="mt-2 text-[11px] text-white/45">Streckkodsläsare stöds som tangentbordsenhet: skanna och avsluta med Enter.</p>
              </div>
            </div>
          ) : null}
        </div>

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
              <PosKioskOrder order={selectedOrder} nowMs={now} />
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
