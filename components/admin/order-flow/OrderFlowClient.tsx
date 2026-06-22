"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { useOrderPolling } from "@/components/admin/orders/useOrderPolling";
import { useOrderStatusUpdate } from "@/components/admin/orders/useOrderStatusUpdate";
import { formatOrderNumber } from "@/lib/orders";
import {
  ORDER_FLOW_COLUMNS,
  statusForFlowColumn,
} from "@/lib/rms/order-flow";

function OrderFlowClient() {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const {
    orders,
    loading,
    refresh,
    updateOrderLocally,
    setError,
  } = useOrderPolling({ search: "", filter: "ACTIVE", soundEnabled: false });

  const { actingId, handleAction } = useOrderStatusUpdate({
    orders,
    refresh,
    updateOrderLocally,
    setError,
    confirmCancel: false,
  });

  const flowOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status !== OrderStatus.CANCELLED &&
          ORDER_FLOW_COLUMNS.some((c) => c.statuses.includes(o.status))
      ),
    [orders]
  );

  const columns = useMemo(
    () =>
      ORDER_FLOW_COLUMNS.map((column) => ({
        ...column,
        orders: flowOrders.filter((o) => column.statuses.includes(o.status)),
      })),
    [flowOrders]
  );

  const onDrop = useCallback(
    (columnKey: string, orderId: string) => {
      const nextStatus = statusForFlowColumn(columnKey);
      if (!nextStatus) return;
      const order = flowOrders.find((o) => o.id === orderId);
      if (!order || order.status === nextStatus) return;
      void handleAction(orderId, nextStatus);
    },
    [flowOrders, handleAction]
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/45">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-24 pt-6 sm:px-6">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4a574]">
          Orderflöde
        </p>
        <h1 className="font-serif text-3xl text-white">Drag & Drop Board</h1>
        <p className="mt-2 text-sm text-white/45">
          Dra ordrar mellan kolumner för att uppdatera status i realtid.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-5">
        {columns.map((column) => (
          <section
            key={column.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const orderId = e.dataTransfer.getData("text/order-id");
              if (orderId) onDrop(column.key, orderId);
              setDraggingId(null);
            }}
            className="flex min-h-[420px] flex-col rounded-3xl border border-white/8 bg-[#0d0d0d]"
          >
            <div
              className="border-b border-white/8 px-4 py-3"
              style={{ boxShadow: `inset 0 -2px 0 ${column.accent}44` }}
            >
              <h2
                className="font-serif text-lg font-bold"
                style={{ color: column.accent }}
              >
                {column.label}
              </h2>
              <p className="text-xs text-white/40">{column.orders.length} ordrar</p>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {column.orders.map((order) => (
                <article
                  key={order.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/order-id", order.id);
                    setDraggingId(order.id);
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  className={`cursor-grab rounded-2xl border border-white/8 bg-[#141414] p-3 active:cursor-grabbing ${
                    draggingId === order.id ? "opacity-50" : ""
                  } ${actingId === order.id ? "animate-pulse" : ""}`}
                >
                  <p className="font-serif text-lg text-[#e8c4a8]">
                    {formatOrderNumber(order.orderNumber)}
                  </p>
                  <p className="truncate text-sm font-medium text-white">
                    {order.customerName}
                  </p>
                  <p className="mt-1 text-xs text-white/45">{order.total} kr</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default memo(OrderFlowClient);
