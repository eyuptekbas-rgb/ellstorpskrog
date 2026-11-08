import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrderStatus, OrderType } from "@prisma/client";
import {
  assertValidOrderStatusTransition,
  InvalidOrderStatusTransitionError,
  isValidOrderStatusTransition,
} from "@/lib/orders/status-transitions";

describe("order status transitions", () => {
  it("allows the complete pickup workflow and cancellation while active", () => {
    const path = [
      OrderStatus.NEW,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.COMPLETED,
    ];
    for (let index = 0; index < path.length - 1; index += 1) {
      assert.equal(
        isValidOrderStatusTransition(path[index], path[index + 1], OrderType.PICKUP),
        true
      );
    }
    assert.equal(
      isValidOrderStatusTransition(OrderStatus.PREPARING, OrderStatus.CANCELLED, OrderType.PICKUP),
      true
    );
  });

  it("requires DELIVERING before a delivery can complete", () => {
    assert.equal(
      isValidOrderStatusTransition(OrderStatus.READY, OrderStatus.DELIVERING, OrderType.DELIVERY),
      true
    );
    assert.equal(
      isValidOrderStatusTransition(OrderStatus.DELIVERING, OrderStatus.COMPLETED, OrderType.DELIVERY),
      true
    );
    assert.equal(
      isValidOrderStatusTransition(OrderStatus.READY, OrderStatus.COMPLETED, OrderType.DELIVERY),
      false
    );
  });

  it("rejects backwards, skipped, cross-type, and terminal transitions", () => {
    const invalid: Array<[OrderStatus, OrderStatus, OrderType]> = [
      [OrderStatus.READY, OrderStatus.PREPARING, OrderType.PICKUP],
      [OrderStatus.NEW, OrderStatus.READY, OrderType.PICKUP],
      [OrderStatus.READY, OrderStatus.DELIVERING, OrderType.PICKUP],
      [OrderStatus.COMPLETED, OrderStatus.NEW, OrderType.PICKUP],
      [OrderStatus.CANCELLED, OrderStatus.CONFIRMED, OrderType.DELIVERY],
    ];
    for (const [from, to, type] of invalid) {
      assert.throws(
        () => assertValidOrderStatusTransition(from, to, type),
        InvalidOrderStatusTransitionError
      );
    }
  });

  it("treats retries to the current state as idempotent", () => {
    assert.equal(
      isValidOrderStatusTransition(OrderStatus.READY, OrderStatus.READY, OrderType.DELIVERY),
      true
    );
  });
});
