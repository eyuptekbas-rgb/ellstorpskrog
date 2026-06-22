"use client";

import { useCallback, useEffect, useState } from "react";
import { OrderStatus } from "@prisma/client";
import { Bell, BellOff, Loader2, RefreshCw, Search } from "lucide-react";
import { ORDER_FILTER_GROUPS } from "@/lib/orders/admin-filters";
import type { OrderFilterGroup } from "@/lib/orders/admin-filters";
import OrderCard from "./OrderCard";
import { useOrderPolling } from "./useOrderPolling";

export default function OrdersAdminClient() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OrderFilterGroup>("NEW");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("Restaurang");

  const {
    orders,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh,
    updateOrderLocally,
    setError,
  } = useOrderPolling({ search, filter, soundEnabled });

  useEffect(() => {
    fetch("/api/admin/context")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.tenant?.name) setRestaurantName(data.tenant.name);
      })
      .catch(() => {});
  }, []);

  const handleAction = useCallback(
    async (orderId: string, status: OrderStatus) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      if (
        status === OrderStatus.CANCELLED &&
        !window.confirm(`Avvisa/avbryt order ${order.orderNumber}?`)
      ) {
        return;
      }

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

  const newCount = orders.filter((o) => o.status === OrderStatus.NEW).length;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4a574]">
            Orderhantering
          </p>
          <h1 className="font-serif text-3xl text-white sm:text-4xl">
            Beställningar
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {loading
              ? "Laddar…"
              : `${orders.length} ordrar`}
            {lastUpdated && !loading && (
              <span className="text-white/35">
                {" "}
                · Uppdaterad {lastUpdated.toLocaleTimeString("sv-SE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            {newCount > 0 && filter !== "NEW" && (
              <span className="ml-2 rounded-full bg-[#b85c38]/20 px-2 py-0.5 text-xs font-semibold text-[#e8c4a8]">
                {newCount} nya
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled((value) => !value)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
              soundEnabled
                ? "border-[#b85c38]/35 bg-[#b85c38]/10 text-[#e8c4a8]"
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
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/75 transition hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Uppdatera
          </button>
        </div>
      </header>

      <div className="relative mb-4">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök ordernummer, kund eller telefon…"
          className="w-full rounded-2xl border border-white/10 bg-[#111] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition focus:border-[#b85c38]/45"
        />
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {ORDER_FILTER_GROUPS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              filter === key
                ? "bg-[#b85c38] text-white shadow-[0_8px_24px_-12px_rgba(184,92,56,0.8)]"
                : "border border-white/8 bg-[#141414] text-white/55 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-white/45">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-white/8 bg-[#141414] px-6 py-16 text-center">
          <p className="text-white/50">Inga beställningar i denna vy.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              restaurantName={restaurantName}
              acting={actingId === order.id}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
