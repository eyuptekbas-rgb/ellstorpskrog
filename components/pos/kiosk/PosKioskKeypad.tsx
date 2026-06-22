"use client";

import { memo } from "react";
import { OrderStatus } from "@prisma/client";
import {
  POS_WAIT_TIME_MINUTES,
  type PosWaitTimeMinutes,
} from "@/lib/pos/wait-time";
import { formatPosOrderNumber } from "@/lib/pos/display";
import {
  getPosStatusAction,
  isPosCompletedOrder,
  isPosNewOrder,
} from "@/lib/pos/order-actions";
import type { AdminOrderListItem } from "@/components/admin/orders/useOrderPolling";

type Props = {
  order: AdminOrderListItem | null;
  selectedMinutes: PosWaitTimeMinutes | null;
  busy: boolean;
  printing: boolean;
  onPick: (minutes: PosWaitTimeMinutes) => void;
  onAccept: () => void;
  onStatusAction: (status: OrderStatus) => void;
  onPrint: () => void;
};

function PosKioskKeypad({
  order,
  selectedMinutes,
  busy,
  printing,
  onPick,
  onAccept,
  onStatusAction,
  onPrint,
}: Props) {
  const statusAction = order ? getPosStatusAction(order) : null;
  const isNew = order ? isPosNewOrder(order) : false;
  const isCompleted = order ? isPosCompletedOrder(order) : false;
  const acceptReady = Boolean(
    isNew && order && selectedMinutes && !busy
  );

  if (!order) {
    return (
      <aside className="pos-pro-wait" aria-label="Orderåtgärder">
        <div className="pos-pro-wait__idle">
          <span className="pos-pro-wait__idle-title">Välj en order</span>
          <span className="pos-pro-wait__idle-sub">
            Välj tid och godkänn för att skriva ut till köket
          </span>
        </div>
        <div className="pos-pro-wait__send-wrap">
          <button type="button" className="pos-pro-wait__print" disabled>
            Skriv ut
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="pos-pro-wait" aria-label="Orderåtgärder">
      <div className="pos-pro-wait__head">
        <span className="pos-pro-wait__order-num">
          {formatPosOrderNumber(order.orderNumber)}
        </span>
        <span className="pos-pro-wait__sub">
          {isNew
            ? "Välj tid och godkänn ordern"
            : isCompleted
              ? "Ordern är slutförd"
              : "Uppdatera orderstatus"}
        </span>
      </div>

      {isNew ? (
        <div className="pos-pro-wait__list">
          {POS_WAIT_TIME_MINUTES.map((minutes) => {
            const on = selectedMinutes === minutes;
            return (
              <button
                key={minutes}
                type="button"
                disabled={busy}
                className={`pos-pro-wait__btn${on ? " pos-pro-wait__btn--on" : ""}`}
                onClick={() => onPick(minutes)}
              >
                <span className="pos-pro-wait__btn-value">{minutes}</span>
                <span className="pos-pro-wait__btn-unit">min</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="pos-pro-wait__stage">
          {statusAction && !isCompleted ? (
            <button
              type="button"
              className="pos-pro-wait__stage-btn"
              disabled={busy}
              onClick={() => onStatusAction(statusAction.status)}
            >
              {busy ? "Uppdaterar…" : statusAction.label}
            </button>
          ) : (
            <div className="pos-pro-wait__stage-done">
              {isCompleted ? "Slutförd" : "Ingen åtgärd"}
            </div>
          )}
        </div>
      )}

      <div className="pos-pro-wait__send-wrap">
        {isNew ? (
          <button
            type="button"
            className="pos-pro-wait__send"
            disabled={!acceptReady}
            onClick={onAccept}
          >
            <span className="pos-pro-wait__send-label">
              {busy ? "Skickar…" : "Godkänn och skriv ut"}
            </span>
            {selectedMinutes && !busy ? (
              <span className="pos-pro-wait__send-meta">
                {selectedMinutes} minuter · skrivare
              </span>
            ) : null}
          </button>
        ) : null}

        <button
          type="button"
          className="pos-pro-wait__print"
          disabled={!order || busy || printing}
          onClick={onPrint}
        >
          {printing ? "Skriver ut…" : "Skriv ut"}
        </button>
      </div>
    </aside>
  );
}

export default memo(PosKioskKeypad);
