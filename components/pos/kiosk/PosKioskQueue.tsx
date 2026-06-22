"use client";

import { memo } from "react";
import { OrderType } from "@prisma/client";
import {
  formatPosQueueNumber,
  formatWaitingTimer,
} from "@/lib/pos/display";
import {
  POS_QUEUE_SECTIONS,
  type PosQueueColumnOrders,
} from "@/lib/pos/queue-columns";
import type { AdminOrderListItem } from "@/components/admin/orders/useOrderPolling";
import { IconDelivery, IconPickup } from "./PosProIcons";

type Props = {
  columns: PosQueueColumnOrders;
  selectedOrderId: string | null;
  nowMs: number;
  onSelect: (orderId: string) => void;
};

function QueueTile({
  order,
  active,
  nowMs,
  onSelect,
}: {
  order: AdminOrderListItem;
  active: boolean;
  nowMs: number;
  onSelect: (orderId: string) => void;
}) {
  const delivery = order.orderType === OrderType.DELIVERY;
  const TypeIcon = delivery ? IconDelivery : IconPickup;

  return (
    <button
      type="button"
      className={`pos-pro-tile${active ? " pos-pro-tile--active" : ""}`}
      onClick={() => onSelect(order.id)}
      aria-pressed={active}
    >
      <div className="pos-pro-tile__top">
        <span className="pos-pro-tile__num">
          #{formatPosQueueNumber(order.orderNumber)}
        </span>
        <span
          className={`pos-pro-tile__type ${
            delivery
              ? "pos-pro-tile__type--delivery"
              : "pos-pro-tile__type--pickup"
          }`}
        >
          <TypeIcon />
        </span>
      </div>
      <span className="pos-pro-tile__name">{order.customerName}</span>
      <span className="pos-pro-tile__timer">
        {formatWaitingTimer(order.createdAt, nowMs)}
      </span>
    </button>
  );
}

function PosKioskQueue({ columns, selectedOrderId, nowMs, onSelect }: Props) {
  const totalCount =
    columns.new.length +
    columns.kitchen.length +
    columns.ready.length +
    columns.completed.length;

  return (
    <aside className="pos-pro-queue" aria-label="Orderlista">
      <div className="pos-pro-queue__head">
        <span className="pos-pro-queue__title">Ordrar</span>
        <span className="pos-pro-queue__count">{totalCount}</span>
      </div>

      {totalCount === 0 ? (
        <div className="pos-pro-queue__empty">
          <span className="pos-pro-queue__empty-icon" aria-hidden>
            ✓
          </span>
          <span>Inga aktiva ordrar</span>
        </div>
      ) : (
        <div className="pos-pro-queue__scroll">
          {POS_QUEUE_SECTIONS.map((section) => {
            const sectionOrders = columns[section.key];
            if (sectionOrders.length === 0) return null;

            return (
              <div key={section.key} className="pos-pro-queue__section">
                <div className="pos-pro-queue__section-head">
                  <span className="pos-pro-queue__section-label">
                    {section.label}
                  </span>
                  <span className="pos-pro-queue__section-count">
                    {sectionOrders.length}
                  </span>
                </div>
                <div className="pos-pro-queue__section-list">
                  {sectionOrders.map((order) => (
                    <QueueTile
                      key={order.id}
                      order={order}
                      active={order.id === selectedOrderId}
                      nowMs={nowMs}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}

export default memo(PosKioskQueue);
