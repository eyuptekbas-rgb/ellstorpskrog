"use client";

import { OrderStatus, OrderType } from "@prisma/client";
import { ChefHat, Check, Package, Truck } from "lucide-react";
import { parseOrderItemDisplay } from "@/lib/cart";
import { ORDER_TYPE_LABELS, formatOrderNumber } from "@/lib/orders";
import {
  formatElapsedTimer,
  getKitchenUrgency,
  shouldFlashOrder,
  urgencyBorderClass,
  urgencyTimerClass,
} from "@/lib/orders/kitchen";
import type { AdminOrderListItem } from "@/components/admin/orders/useOrderPolling";
import { useNow } from "./useNow";

type Props = {
  order: AdminOrderListItem;
  column: "new" | "preparing" | "ready";
  acting: boolean;
  onAction: (orderId: string, status: OrderStatus) => void;
};

function KitchenActionButton({
  label,
  icon: Icon,
  tone,
  disabled,
  onClick,
}: {
  label: string;
  icon: typeof Check;
  tone: "copper" | "green" | "blue";
  disabled: boolean;
  onClick: () => void;
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/22"
      : tone === "blue"
        ? "border-sky-400/35 bg-sky-500/15 text-sky-100 hover:bg-sky-500/22"
        : "border-[#b85c38]/40 bg-[#b85c38]/18 text-[#e8c4a8] hover:bg-[#b85c38]/26";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl border px-4 py-3 text-base font-bold transition disabled:opacity-50 sm:text-lg ${toneClass}`}
    >
      <Icon size={22} strokeWidth={2.25} />
      {label}
    </button>
  );
}

export default function KitchenOrderCard({
  order,
  column,
  acting,
  onAction,
}: Props) {
  const now = useNow();
  const urgency = getKitchenUrgency(order.createdAt, now);
  const flashing = shouldFlashOrder(order.createdAt, now);
  const isDelivery = order.orderType === OrderType.DELIVERY;

  return (
    <article
      className={`rounded-3xl border bg-[#121212] p-4 sm:p-5 ${urgencyBorderClass(urgency, flashing)}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-2xl font-bold tracking-tight text-[#e8c4a8] sm:text-3xl">
            {formatOrderNumber(order.orderNumber)}
          </p>
          <p className="mt-1 truncate text-lg font-semibold text-white sm:text-xl">
            {order.customerName}
          </p>
          <p className="mt-1 text-sm font-medium text-white/45 sm:text-base">
            {ORDER_TYPE_LABELS[order.orderType]}
            {isDelivery && order.customerAddress
              ? ` · ${order.customerAddress}`
              : ""}
          </p>
        </div>
        <div
          className={`shrink-0 rounded-2xl px-3 py-2 text-center font-mono text-lg font-bold tabular-nums sm:text-xl ${urgencyTimerClass(urgency)}`}
        >
          {formatElapsedTimer(order.createdAt, now)}
        </div>
      </div>

      <ul className="space-y-3">
        {order.items.map((item) => {
          const { name, options, note } = parseOrderItemDisplay(item.productName);
          return (
            <li
              key={item.id}
              className="rounded-2xl border border-white/8 bg-[#0a0a0a] px-4 py-3"
            >
              <p className="text-xl font-bold leading-tight text-white sm:text-2xl">
                <span className="text-[#d4a574]">{item.quantity}×</span> {name}
              </p>
              {options.length > 0 && (
                <p className="mt-2 text-base font-semibold leading-snug text-[#e8c4a8]/85 sm:text-lg">
                  + {options.join(" · ")}
                </p>
              )}
              {note && (
                <p className="mt-2 text-base italic text-white/50 sm:text-lg">
                  &ldquo;{note}&rdquo;
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {order.note && (
        <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-base font-semibold text-amber-100 sm:text-lg">
          {order.note}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {column === "new" && (
          <KitchenActionButton
            label="Acceptera"
            icon={Check}
            tone="copper"
            disabled={acting}
            onClick={() => onAction(order.id, OrderStatus.CONFIRMED)}
          />
        )}

        {column === "preparing" && order.status === OrderStatus.CONFIRMED && (
          <KitchenActionButton
            label="Tillagas"
            icon={ChefHat}
            tone="copper"
            disabled={acting}
            onClick={() => onAction(order.id, OrderStatus.PREPARING)}
          />
        )}

        {column === "preparing" && order.status === OrderStatus.PREPARING && (
          <KitchenActionButton
            label="Klar"
            icon={Check}
            tone="green"
            disabled={acting}
            onClick={() => onAction(order.id, OrderStatus.READY)}
          />
        )}

        {column === "ready" && (
          <>
            {order.status === OrderStatus.DELIVERING ? (
              <KitchenActionButton
                label="Levererad"
                icon={Truck}
                tone="green"
                disabled={acting}
                onClick={() => onAction(order.id, OrderStatus.COMPLETED)}
              />
            ) : isDelivery ? (
              <>
                <KitchenActionButton
                  label="Levererad"
                  icon={Truck}
                  tone="green"
                  disabled={acting}
                  onClick={() => onAction(order.id, OrderStatus.COMPLETED)}
                />
                <KitchenActionButton
                  label="Under leverans"
                  icon={Truck}
                  tone="blue"
                  disabled={acting}
                  onClick={() => onAction(order.id, OrderStatus.DELIVERING)}
                />
              </>
            ) : (
              <KitchenActionButton
                label="Hämtad"
                icon={Package}
                tone="green"
                disabled={acting}
                onClick={() => onAction(order.id, OrderStatus.COMPLETED)}
              />
            )}
          </>
        )}
      </div>
    </article>
  );
}
