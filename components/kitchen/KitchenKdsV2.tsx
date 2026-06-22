"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { OrderStatus } from "@prisma/client";
import { Clock, GripVertical } from "lucide-react";
import type { AdminOrderListItem } from "@/components/admin/orders/useOrderPolling";
import { useOrderStatusUpdate } from "@/components/admin/orders/useOrderStatusUpdate";
import { useOrderPolling } from "@/components/admin/orders/useOrderPolling";
import {
  filterOrdersForKitchenScreen,
  KITCHEN_SCREENS,
  type KitchenScreenId,
} from "@/lib/kitchen/screens";
import {
  elapsedMinutes,
  kdsColumnToStatus,
  loadKdsLayout,
  priorityColor,
  saveKdsLayout,
  statusToKdsColumn,
  timerClass,
  type KdsColumnKey,
} from "@/lib/kitchen/kds-v2";
import { useToast } from "@/components/notifications/ToastProvider";
import { playKitchenAlertSound } from "@/lib/notifications/sounds";

type Props = {
  screenId: KitchenScreenId;
};

const COLUMNS: { key: KdsColumnKey; label: string }[] = [
  { key: "new", label: "NEW" },
  { key: "cooking", label: "COOKING" },
  { key: "ready", label: "READY" },
];

function KitchenKdsV2({ screenId }: Props) {
  const { pushKitchenAlert } = useToast();
  const [layout, setLayout] = useState<Record<string, KdsColumnKey>>(() => loadKdsLayout());
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const { orders, refresh, updateOrderLocally, setError } = useOrderPolling({
    search: "",
    filter: "KITCHEN",
    soundEnabled: true,
  });

  const { handleAction } = useOrderStatusUpdate({
    orders,
    refresh,
    updateOrderLocally,
    setError,
    confirmCancel: false,
  });

  const filtered = useMemo(
    () => filterOrdersForKitchenScreen(orders, screenId),
    [orders, screenId]
  );

  const ordersByColumn = useMemo(() => {
    const map: Record<KdsColumnKey, AdminOrderListItem[]> = {
      new: [],
      cooking: [],
      ready: [],
    };
    for (const order of filtered) {
      const column = layout[order.id] ?? statusToKdsColumn(order.status);
      map[column].push(order);
    }
    return map;
  }, [filtered, layout]);

  const onDrop = useCallback(
    (column: KdsColumnKey) => {
      if (!draggingId) return;
      const order = filtered.find((o) => o.id === draggingId);
      if (!order) return;
      const nextLayout = { ...layout, [draggingId]: column };
      setLayout(nextLayout);
      saveKdsLayout(nextLayout);
      const nextStatus = kdsColumnToStatus(column);
      if (order.status !== nextStatus) {
        void handleAction(draggingId, nextStatus);
        if (column === "ready") {
          pushKitchenAlert(`Order ${order.orderNumber} klar`);
          playKitchenAlertSound();
        }
      }
      setDraggingId(null);
    },
    [draggingId, filtered, handleAction, layout, pushKitchenAlert]
  );

  const screen = KITCHEN_SCREENS.find((s) => s.id === screenId) ?? KITCHEN_SCREENS[0];

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-3">
      {COLUMNS.map((column) => (
        <section
          key={column.key}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDrop(column.key)}
          className="flex min-h-0 flex-col rounded-3xl border border-white/8 bg-[#0d0d0d]/90"
        >
          <header className="border-b border-white/8 px-5 py-4">
            <h2 className="font-serif text-2xl">{column.label}</h2>
            <p className="text-sm text-white/40">{screen.label}</p>
          </header>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {ordersByColumn[column.key].map((order) => {
              const minutes = elapsedMinutes(order.createdAt);
              const priority =
                order.status === OrderStatus.NEW && minutes >= 12
                  ? "rush"
                  : minutes >= 8
                    ? "high"
                    : "normal";
              return (
                <article
                  key={order.id}
                  draggable
                  onDragStart={() => setDraggingId(order.id)}
                  className="cursor-grab rounded-2xl border border-white/10 bg-black/30 p-4 active:cursor-grabbing"
                  style={{ boxShadow: `inset 4px 0 0 ${priorityColor(priority)}` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-white/40">#{order.orderNumber}</p>
                      <p className="font-semibold">{order.customerName}</p>
                    </div>
                    <GripVertical size={16} className="text-white/25" />
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-white/70">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.quantity}× {item.productName}
                      </li>
                    ))}
                  </ul>
                  <p className={`mt-3 flex items-center gap-1 text-sm ${timerClass(minutes)}`}>
                    <Clock size={14} />
                    {minutes} min
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default memo(KitchenKdsV2);
