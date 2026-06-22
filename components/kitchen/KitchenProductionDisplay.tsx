"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import {
  Bell,
  BellOff,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
} from "lucide-react";
import KitchenProductionCard from "@/components/kitchen/KitchenProductionCard";
import { useOrderStatusUpdate } from "@/components/admin/orders/useOrderStatusUpdate";
import { useOrderPolling } from "@/components/admin/orders/useOrderPolling";
import { PRODUCTION_KITCHEN_COLUMNS } from "@/lib/kitchen/display";
import {
  KITCHEN_SCREENS,
  filterOrdersForKitchenScreen,
  type KitchenScreenId,
} from "@/lib/kitchen/screens";
import { usePosFullscreen } from "@/components/pos/usePosFullscreen";
import RealtimeStatusBadge from "@/components/rms/RealtimeStatusBadge";
import RmsLoadingState from "@/components/rms/RmsLoadingState";
import dynamic from "next/dynamic";

const KitchenKdsV2 = dynamic(() => import("@/components/kitchen/KitchenKdsV2"), {
  loading: () => (
    <div className="flex flex-1 items-center justify-center text-white/40">
      <Loader2 className="animate-spin" />
    </div>
  ),
  ssr: false,
});

function KitchenProductionDisplay() {
  const searchParams = useSearchParams();
  const screenId = (searchParams.get("screen") ?? "all") as KitchenScreenId;
  const kdsV2 = searchParams.get("kds") === "2";
  const activeScreen = KITCHEN_SCREENS.find((screen) => screen.id === screenId) ?? KITCHEN_SCREENS[0];

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [restaurantName, setRestaurantName] = useState("Restaurang");
  const { rootRef, fullscreen, toggleFullscreen } = usePosFullscreen();

  const {
    orders,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh,
    updateOrderLocally,
    setError,
    transportKind,
  } = useOrderPolling({
    search: "",
    filter: "KITCHEN",
    soundEnabled,
  });

  const { actingId, handleAction } = useOrderStatusUpdate({
    orders,
    refresh,
    updateOrderLocally,
    setError,
    confirmCancel: false,
  });

  useEffect(() => {
    void fetch("/api/admin/context")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.tenant?.name) setRestaurantName(data.tenant.name);
      })
      .catch(() => undefined);
  }, []);

  const onAction = useCallback(
    (orderId: string, status: OrderStatus) => {
      void handleAction(orderId, status);
    },
    [handleAction]
  );

  const filteredOrders = useMemo(
    () => filterOrdersForKitchenScreen(orders, activeScreen.id),
    [orders, activeScreen.id]
  );

  const ordersByColumn = PRODUCTION_KITCHEN_COLUMNS.map((column) => ({
    ...column,
    orders: filteredOrders.filter((order) => column.statuses.includes(order.status)),
  }));

  return (
    <div
      ref={rootRef}
      className="kitchen-root flex h-dvh w-full flex-col overflow-hidden bg-[#070707] text-white"
    >
      <header className="kitchen-topbar flex shrink-0 items-center justify-between gap-4 border-b border-white/8 px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d4a574]">
            Production Kitchen
          </p>
          <h1 className="font-serif text-3xl text-white">{activeScreen.label}</h1>
          <p className="mt-1 text-sm text-white/45">
            {loading ? "Laddar…" : `${filteredOrders.length} aktiva ordrar`}
            {lastUpdated && !loading && (
              <span>
                {" "}
                ·{" "}
                {lastUpdated.toLocaleTimeString("sv-SE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            <span className="ml-2 text-white/30">· {transportKind}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <RealtimeStatusBadge />
          <div className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 lg:flex">
            {KITCHEN_SCREENS.map((screen) => (
              <a
                key={screen.id}
                href={screen.id === "all" ? "/kitchen" : `/kitchen?screen=${screen.id}`}
                className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                  activeScreen.id === screen.id
                    ? "bg-[#b85c38]/20 text-[#e8c4a8]"
                    : "text-white/55 hover:text-white"
                }`}
              >
                {screen.label}
              </a>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSoundEnabled((value) => !value)}
            className={`kitchen-action-btn inline-flex min-h-14 min-w-14 items-center justify-center rounded-2xl border ${
              soundEnabled
                ? "border-[#b85c38]/35 bg-[#b85c38]/12 text-[#e8c4a8]"
                : "border-white/10 bg-white/5 text-white/55"
            }`}
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? <Bell size={22} /> : <BellOff size={22} />}
          </button>
          <button
            type="button"
            onClick={() => refresh()}
            disabled={refreshing}
            className="kitchen-action-btn inline-flex min-h-14 min-w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/75 disabled:opacity-50"
          >
            <RefreshCw
              size={22}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
          <button
            type="button"
            onClick={() => toggleFullscreen()}
            className="kitchen-action-btn inline-flex min-h-14 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/75"
          >
            {fullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
            {fullscreen ? "Exit" : "Fullscreen"}
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-5 mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <RmsLoadingState label="Hämtar köksordrar…" />
      ) : kdsV2 ? (
        <KitchenKdsV2 screenId={activeScreen.id} />
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-3 lg:p-5">
          {ordersByColumn.map((column) => (
            <section
              key={column.key}
              className="flex min-h-0 flex-col rounded-3xl border border-white/8 bg-[#0d0d0d]/90"
            >
              <div
                className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4"
                style={{ boxShadow: `inset 0 -3px 0 ${column.accent}44` }}
              >
                <h2
                  className="font-serif text-2xl font-bold tracking-wide sm:text-3xl"
                  style={{ color: column.accent }}
                >
                  {column.label}
                </h2>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-lg font-bold tabular-nums">
                  {column.orders.length}
                </span>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
                {column.orders.length === 0 ? (
                  <p className="py-16 text-center text-base text-white/35">
                    No orders
                  </p>
                ) : (
                  column.orders.map((order) => (
                    <KitchenProductionCard
                      key={order.id}
                      order={order}
                      column={column.key}
                      acting={actingId === order.id}
                      restaurantName={restaurantName}
                      onAction={onAction}
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

export default memo(KitchenProductionDisplay);
