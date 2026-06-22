"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OrderStatus } from "@prisma/client";
import {
  Bell,
  BellOff,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
} from "lucide-react";
import { KITCHEN_COLUMNS } from "@/lib/orders/kitchen";
import { useOrderPolling } from "@/components/admin/orders/useOrderPolling";
import KitchenOrderCard from "./KitchenOrderCard";

export default function KitchenDisplayClient() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const {
    orders,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh,
    updateOrderLocally,
    setError,
  } = useOrderPolling({
    search: "",
    filter: "KITCHEN",
    soundEnabled,
  });

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Fullscreen may require user gesture — ignore.
    }
  };

  const handleAction = useCallback(
    async (orderId: string, status: OrderStatus) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      setActingId(orderId);
      updateOrderLocally(orderId, { status });

      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error();
        await refresh();
      } catch {
        updateOrderLocally(orderId, { status: order.status });
        setError("Kunde inte uppdatera ordern.");
      } finally {
        setActingId(null);
      }
    },
    [orders, refresh, setError, updateOrderLocally]
  );

  const ordersByColumn = KITCHEN_COLUMNS.map((column) => ({
    ...column,
    orders: orders.filter((order) => column.statuses.includes(order.status)),
  }));

  return (
    <div
      ref={rootRef}
      className={`min-h-[calc(100vh-3.5rem)] bg-[#070707] text-white lg:min-h-screen ${
        fullscreen ? "p-4 sm:p-6" : ""
      }`}
    >
      <header className="mb-4 flex flex-col gap-3 border-b border-white/8 pb-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d4a574]">
            Köksdisplay
          </p>
          <h1 className="font-serif text-2xl text-white sm:text-3xl">
            Kitchen Display
          </h1>
          <p className="mt-1 text-sm text-white/45">
            {loading
              ? "Laddar…"
              : `${orders.length} aktiva ordrar`}
            {lastUpdated && !loading && (
              <span>
                {" "}
                · {lastUpdated.toLocaleTimeString("sv-SE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold ${
              soundEnabled
                ? "border-[#b85c38]/35 bg-[#b85c38]/12 text-[#e8c4a8]"
                : "border-white/10 bg-white/5 text-white/55"
            }`}
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? <Bell size={16} /> : <BellOff size={16} />}
            Ljud
          </button>
          <button
            type="button"
            onClick={() => refresh()}
            disabled={refreshing}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/75 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Uppdatera
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/75"
          >
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {fullscreen ? "Avsluta helskärm" : "Helskärm"}
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center text-white/45">
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          {ordersByColumn.map((column) => (
            <section
              key={column.key}
              className="flex min-h-[50vh] flex-col rounded-3xl border border-white/8 bg-[#0d0d0d]/80"
            >
              <div
                className="flex items-center justify-between border-b border-white/8 px-4 py-4 sm:px-5"
                style={{
                  boxShadow: `inset 0 -2px 0 ${column.accent}33`,
                }}
              >
                <h2
                  className="font-serif text-xl font-semibold sm:text-2xl"
                  style={{ color: column.accent }}
                >
                  {column.label}
                </h2>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-bold tabular-nums text-white/70">
                  {column.orders.length}
                </span>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
                {column.orders.length === 0 ? (
                  <p className="py-12 text-center text-sm text-white/35">
                    Inga ordrar
                  </p>
                ) : (
                  column.orders.map((order) => (
                    <KitchenOrderCard
                      key={order.id}
                      order={order}
                      column={column.key}
                      acting={actingId === order.id}
                      onAction={handleAction}
                    />
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
