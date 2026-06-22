"use client";

import { memo } from "react";
import { OrderType, PaymentStatus } from "@prisma/client";
import { parseOrderItemDisplay } from "@/lib/cart";
import {
  ORDER_TYPE_LABELS,
  PAYMENT_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/orders";
import { formatPosOrderNumber } from "@/lib/pos/display";
import type { AdminOrderListItem } from "@/components/admin/orders/useOrderPolling";

type Props = {
  order: AdminOrderListItem | null;
};

function paymentBadgeClass(status: PaymentStatus): string {
  if (status === PaymentStatus.PAID) return "pos-pro-order__badge--paid";
  if (
    status === PaymentStatus.FAILED ||
    status === PaymentStatus.CANCELLED
  ) {
    return "pos-pro-order__badge--bad";
  }
  return "pos-pro-order__badge--due";
}

function PosKioskOrder({ order }: Props) {
  return (
    <section className="pos-pro-order" aria-label="Aktiv order">
      <div className="pos-pro-order__panel">
        {!order ? (
          <div className="pos-pro-order__idle">
            <span className="pos-pro-order__idle-title">Välj en order</span>
            <span className="pos-pro-order__idle-sub">
              Tryck på en order till vänster för att se detaljer
            </span>
          </div>
        ) : (
          <div className="pos-pro-order__scroll">
            <div className="pos-pro-order__meta">
              <span className="pos-pro-order__label">Order</span>
              <span className="pos-pro-order__id">
                {formatPosOrderNumber(order.orderNumber)}
              </span>
            </div>

            <div className="pos-pro-order__customer">{order.customerName}</div>
            <a className="pos-pro-order__phone" href={`tel:${order.customerPhone}`}>
              {order.customerPhone}
            </a>

            <div className="pos-pro-order__badges">
              <span className="pos-pro-order__badge pos-pro-order__badge--type">
                {ORDER_TYPE_LABELS[order.orderType]}
              </span>
              <span
                className={`pos-pro-order__badge ${paymentBadgeClass(order.paymentStatus)}`}
              >
                {PAYMENT_LABELS[order.paymentMethod]} ·{" "}
                {PAYMENT_STATUS_LABELS[order.paymentStatus]}
              </span>
            </div>

            {order.orderType === OrderType.DELIVERY && order.customerAddress ? (
              <div className="pos-pro-order__addr">{order.customerAddress}</div>
            ) : null}

            <div className="pos-pro-order__section">
              <span className="pos-pro-order__section-label">Produkter</span>
              <ul className="pos-pro-order__items">
                {order.items.map((item) => {
                  const { name, options, note } = parseOrderItemDisplay(
                    item.productName
                  );
                  return (
                    <li key={item.id} className="pos-pro-order__item">
                      <div className="pos-pro-order__row">
                        <span className="pos-pro-order__qty-badge">
                          {item.quantity}
                        </span>
                        <span className="pos-pro-order__product">{name}</span>
                      </div>
                      {note ? (
                        <div className="pos-pro-order__ingredient">{note}</div>
                      ) : null}
                      {options.map((opt) => (
                        <div key={opt} className="pos-pro-order__extra">
                          {opt}
                        </div>
                      ))}
                    </li>
                  );
                })}
              </ul>
            </div>

            {order.note ? (
              <div className="pos-pro-order__note">
                <div className="pos-pro-order__note-label">Kundmeddelande</div>
                <div className="pos-pro-order__note-text">{order.note}</div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(PosKioskOrder);
