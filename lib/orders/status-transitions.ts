import { OrderStatus, OrderType } from "@prisma/client";

const PICKUP_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.NEW]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERING]: [],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

const DELIVERY_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  ...PICKUP_TRANSITIONS,
  [OrderStatus.READY]: [OrderStatus.DELIVERING, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERING]: [OrderStatus.COMPLETED],
};

export class InvalidOrderStatusTransitionError extends Error {
  constructor(
    public readonly from: OrderStatus,
    public readonly to: OrderStatus,
    public readonly orderType: OrderType
  ) {
    super(`Invalid ${orderType.toLowerCase()} order status transition: ${from} -> ${to}`);
    this.name = "InvalidOrderStatusTransitionError";
  }
}

export function isValidOrderStatusTransition(
  from: OrderStatus,
  to: OrderStatus,
  orderType: OrderType
): boolean {
  if (from === to) return true;
  const transitions =
    orderType === OrderType.DELIVERY ? DELIVERY_TRANSITIONS : PICKUP_TRANSITIONS;
  return transitions[from].includes(to);
}

export function assertValidOrderStatusTransition(
  from: OrderStatus,
  to: OrderStatus,
  orderType: OrderType
): void {
  if (!isValidOrderStatusTransition(from, to, orderType)) {
    throw new InvalidOrderStatusTransitionError(from, to, orderType);
  }
}
