import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrderStatus } from "@prisma/client";
import type { AdminOrderListItem } from "@/components/admin/orders/useOrderPolling";
import { getPosStatusAction } from "@/lib/pos/order-actions";
import { getReadyCountdown } from "@/lib/pos/ready-countdown";

describe("POS ready countdown", () => {
  const confirmedAt = "2026-09-01T12:00:00.000Z";

  it("derives a live 15-minute countdown from persisted confirmation time", () => {
    assert.equal(
      getReadyCountdown(OrderStatus.CONFIRMED, confirmedAt, 15, Date.parse(confirmedAt))?.display,
      "15:00"
    );
    assert.equal(
      getReadyCountdown(OrderStatus.PREPARING, confirmedAt, 15, Date.parse(confirmedAt) + 2 * 60_000)?.display,
      "13:00"
    );
  });

  it("reconstructs overdue state and stops after READY", () => {
    const overdue = getReadyCountdown(
      OrderStatus.PREPARING,
      confirmedAt,
      15,
      Date.parse(confirmedAt) + 16 * 60_000
    );
    assert.equal(overdue?.display, "00:00");
    assert.equal(overdue?.overdue, true);
    assert.equal(
      getReadyCountdown(OrderStatus.READY, confirmedAt, 15, Date.parse(confirmedAt) + 2 * 60_000),
      null
    );
  });

  it("keeps the legal Tillagas then early Klar action sequence", () => {
    const confirmed = { status: OrderStatus.CONFIRMED } as AdminOrderListItem;
    const preparing = { status: OrderStatus.PREPARING } as AdminOrderListItem;
    assert.deepEqual(getPosStatusAction(confirmed), {
      label: "Tillagas",
      status: OrderStatus.PREPARING,
    });
    assert.deepEqual(getPosStatusAction(preparing), {
      label: "Klar",
      status: OrderStatus.READY,
    });
  });
});
