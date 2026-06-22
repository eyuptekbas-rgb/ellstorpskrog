"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { OrderStatus, OrderType } from "@prisma/client";
import { MapPin, Truck, User, PackageOpen } from "lucide-react";
import RmsEmptyState from "@/components/rms/RmsEmptyState";
import RmsLoadingState from "@/components/rms/RmsLoadingState";
import RealtimeStatusBadge from "@/components/rms/RealtimeStatusBadge";
import { useOrderPolling } from "@/components/admin/orders/useOrderPolling";
import {
  assignDriver,
  DELIVERY_STATUS_LABELS,
  loadDeliveryQueue,
  updateDeliveryStatus,
  upsertDeliveryFromOrder,
  type DeliveryAssignment,
  type DeliveryStatus,
} from "@/lib/delivery/queue";

const DRIVERS = [
  { id: "d1", name: "Alex" },
  { id: "d2", name: "Sam" },
  { id: "d3", name: "Jordan" },
];

function DeliveryBoard() {
  const { orders, loading, refresh } = useOrderPolling({
    search: "",
    filter: "ALL",
    soundEnabled: false,
  });

  const [queue, setQueue] = useState<DeliveryAssignment[]>([]);

  useEffect(() => {
    const deliveryOrders = orders.filter((o) => o.orderType === OrderType.DELIVERY);
    for (const order of deliveryOrders) {
      if (
        order.status === OrderStatus.READY ||
        order.status === OrderStatus.DELIVERING ||
        order.status === OrderStatus.CONFIRMED ||
        order.status === OrderStatus.PREPARING
      ) {
        upsertDeliveryFromOrder(order);
      }
    }
    queueMicrotask(() => setQueue(loadDeliveryQueue()));
  }, [orders]);

  const sorted = useMemo(
    () =>
      [...queue].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [queue]
  );

  const handleAssign = useCallback((orderId: string, driverId: string) => {
    const driver = DRIVERS.find((d) => d.id === driverId);
    if (!driver) return;
    assignDriver(orderId, driver.id, driver.name);
    setQueue(loadDeliveryQueue());
  }, []);

  const handleStatus = useCallback((orderId: string, status: DeliveryStatus) => {
    updateDeliveryStatus(orderId, status);
    setQueue(loadDeliveryQueue());
  }, []);

  return (
    <div className="flex h-dvh flex-col bg-[#070707] text-white">
      <header className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d4a574]">
            Delivery
          </p>
          <h1 className="font-serif text-3xl">Delivery Screen</h1>
        </div>
        <div className="flex items-center gap-3">
          <RealtimeStatusBadge />
          <button
            type="button"
            onClick={() => void refresh()}
            aria-label="Uppdatera leveranskö"
            className="rms-focus rms-touch-target rounded-xl border border-white/10 px-4 py-2 text-sm"
          >
            Uppdatera
          </button>
        </div>
      </header>

      {loading ? (
        <RmsLoadingState label="Hämtar leveranser…" />
      ) : sorted.length === 0 ? (
        <RmsEmptyState
          icon={PackageOpen}
          title="Inga leveranser i kö"
          description="Nya leveransordrar visas här när de är redo att skickas."
        />
      ) : (
        <div
          className="grid min-h-0 flex-1 gap-4 overflow-auto p-4 lg:grid-cols-2 xl:grid-cols-3"
          role="list"
          aria-label="Leveranskö"
        >
          {sorted.map((row) => (
            <article
              key={row.orderId}
              className="rounded-3xl border border-white/8 bg-[#101010] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/40">#{row.orderNumber}</p>
                  <h2 className="font-serif text-2xl">{row.customerName}</h2>
                </div>
                <span className="rounded-full bg-[#b85c38]/15 px-3 py-1 text-xs font-semibold text-[#e8c4a8]">
                  {DELIVERY_STATUS_LABELS[row.deliveryStatus]}
                </span>
              </div>

              <div className="mt-3 space-y-2 text-sm text-white/65">
                <p className="flex items-center gap-2">
                  <MapPin size={14} />
                  {row.customerAddress ?? "Ingen adress"}
                </p>
                <p className="flex items-center gap-2">
                  <Truck size={14} />
                  ETA {row.etaMinutes ?? "—"} min
                </p>
                {row.driverName ? (
                  <p className="flex items-center gap-2">
                    <User size={14} />
                    {row.driverName}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) handleAssign(row.orderId, e.target.value);
                  }}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs"
                >
                  <option value="">Tilldela chaufför</option>
                  {DRIVERS.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
                {(["picked-up", "en-route", "delivered"] as DeliveryStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatus(row.orderId, status)}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs"
                  >
                    {DELIVERY_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(DeliveryBoard);
