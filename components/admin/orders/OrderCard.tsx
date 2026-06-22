"use client";

import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import {
  Check,
  ChefHat,
  Clock,
  Phone,
  Printer,
  Truck,
  User,
  X,
} from "lucide-react";
import { parseOrderItemDisplay } from "@/lib/cart";
import {
  ORDER_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  formatOrderDate,
  formatOrderNumber,
  paymentStatusStyle,
  statusStyle,
} from "@/lib/orders";
import { getOrderActions } from "@/lib/orders/admin-filters";
import { printKitchenTicket, printReceipt, type PrintableOrder } from "@/lib/orders/print";
import { notifyPrintResult } from "@/lib/pos/print-feedback";
import { useToast } from "@/components/notifications/ToastProvider";
import type { AdminOrderListItem } from "./useOrderPolling";

type Props = {
  order: AdminOrderListItem;
  restaurantName: string;
  acting: boolean;
  onAction: (
    orderId: string,
    status: OrderStatus,
    order?: AdminOrderListItem
  ) => Promise<void>;
};

function toPrintable(order: AdminOrderListItem): PrintableOrder {
  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    customerAddress: order.customerAddress,
    orderType: order.orderType,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    note: order.note,
    adminNote: order.adminNote,
    total: order.total,
    status: order.status,
    estimatedReadyMinutes: order.estimatedReadyMinutes,
    createdAt: order.createdAt,
    items: order.items,
  };
}

export default function OrderCard({
  order,
  restaurantName,
  acting,
  onAction,
}: Props) {
  const { pushToast } = useToast();
  const actions = getOrderActions(order.status, order.orderType);
  const printable = toPrintable(order);

  const printKitchen = () => {
    void printKitchenTicket(printable, restaurantName, { stationName: "KÖK" }).then(
      (result) => notifyPrintResult(pushToast, "Köksbiljett", result)
    );
  };

  const printCustomer = () => {
    void printReceipt(printable, restaurantName).then((result) =>
      notifyPrintResult(pushToast, "Kvitto", result)
    );
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-white/8 bg-[#141414] shadow-[0_12px_40px_-24px_rgba(0,0,0,0.9)]">
      <div className="border-b border-white/6 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/admin/orders/${order.id}`} className="group block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d4a574]">
                {formatOrderNumber(order.orderNumber)}
              </p>
              <h2 className="mt-1 truncate font-serif text-xl text-white transition group-hover:text-[#e8c4a8]">
                {order.customerName}
              </h2>
            </Link>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/55">
              <span className="inline-flex items-center gap-1.5">
                <Phone size={14} className="text-white/35" />
                {order.customerPhone}
              </span>
              <span className="h-1 w-1 rounded-full bg-white/20" aria-hidden />
              <span>{ORDER_TYPE_LABELS[order.orderType]}</span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle(order.status)}`}
              >
                {STATUS_LABELS[order.status]}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${paymentStatusStyle(order.paymentStatus)}`}
              >
                {PAYMENT_STATUS_LABELS[order.paymentStatus]}
              </span>
              {order.note && (
                <span className="rounded-full bg-amber-500/12 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                  Kommentar
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="font-serif text-2xl text-[#e8c4a8]">{order.total} kr</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-white/40">
              <Clock size={12} />
              {formatOrderDate(new Date(order.createdAt))}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 px-4 py-4 sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Produkter
        </p>
        <ul className="space-y-2">
          {order.items.map((item) => {
            const { name, options, note } = parseOrderItemDisplay(item.productName);
            return (
              <li
                key={item.id}
                className="rounded-2xl border border-white/6 bg-[#0d0d0d] px-3 py-2.5 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-white">
                      {item.quantity}× {name}
                    </p>
                    {options.length > 0 && (
                      <p className="mt-1 text-xs text-[#d4a574]/80">
                        + {options.join(" · ")}
                      </p>
                    )}
                    {note && (
                      <p className="mt-1 text-xs italic text-white/45">
                        &ldquo;{note}&rdquo;
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 font-semibold text-[#b85c38]">
                    {item.totalPrice} kr
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        {order.note && (
          <div className="rounded-2xl border border-amber-500/15 bg-amber-500/8 px-3 py-2.5 text-sm text-amber-100/90">
            <span className="font-semibold">Anteckning: </span>
            {order.note}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-white/6 bg-[#101010] px-4 py-4 sm:px-5">
        {actions.map((action) => {
          const toneClass =
            action.tone === "danger"
              ? "border-red-500/25 bg-red-500/10 text-red-200 hover:bg-red-500/15"
              : action.tone === "primary"
                ? "border-[#b85c38]/35 bg-[#b85c38]/12 text-[#e8c4a8] hover:bg-[#b85c38]/18"
                : "border-white/10 bg-white/5 text-white/70 hover:text-white";

          const Icon =
            action.key === "accept"
              ? Check
              : action.key === "reject"
                ? X
                : action.key === "preparing"
                  ? ChefHat
                  : action.key === "ready"
                    ? Check
                    : action.key === "delivering" || action.key === "delivered"
                      ? Truck
                      : User;

          return (
            <button
              key={action.key}
              type="button"
              disabled={acting}
              onClick={(event) => {
                event.stopPropagation();
                void onAction(order.id, action.status, order);
              }}
              className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition disabled:opacity-50 sm:flex-none ${toneClass}`}
            >
              <Icon size={16} />
              {action.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            printKitchen();
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white/70 transition hover:text-white"
        >
          <Printer size={16} />
          Kök
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            printCustomer();
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white/70 transition hover:text-white"
        >
          <Printer size={16} />
          Kvitto
        </button>
      </div>
    </article>
  );
}
