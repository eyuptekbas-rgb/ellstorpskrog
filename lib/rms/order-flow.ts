import { OrderStatus } from "@prisma/client";

export type OrderFlowColumn = {
  key: string;
  label: string;
  statuses: OrderStatus[];
  accent: string;
};

/** Kanban columns for drag-and-drop order flow. */
export const ORDER_FLOW_COLUMNS: OrderFlowColumn[] = [
  {
    key: "new",
    label: "NEW",
    statuses: [OrderStatus.NEW],
    accent: "#f59e0b",
  },
  {
    key: "accepted",
    label: "ACCEPTED",
    statuses: [OrderStatus.CONFIRMED],
    accent: "#60a5fa",
  },
  {
    key: "cooking",
    label: "COOKING",
    statuses: [OrderStatus.PREPARING],
    accent: "#b85c38",
  },
  {
    key: "ready",
    label: "READY",
    statuses: [OrderStatus.READY, OrderStatus.DELIVERING],
    accent: "#34d399",
  },
  {
    key: "completed",
    label: "COMPLETED",
    statuses: [OrderStatus.COMPLETED],
    accent: "#a78bfa",
  },
];

export function statusForFlowColumn(columnKey: string): OrderStatus | null {
  switch (columnKey) {
    case "new":
      return OrderStatus.NEW;
    case "accepted":
      return OrderStatus.CONFIRMED;
    case "cooking":
      return OrderStatus.PREPARING;
    case "ready":
      return OrderStatus.READY;
    case "completed":
      return OrderStatus.COMPLETED;
    default:
      return null;
  }
}

export function flowColumnForStatus(status: OrderStatus): string {
  const column = ORDER_FLOW_COLUMNS.find((c) => c.statuses.includes(status));
  return column?.key ?? "new";
}

export const ACTIVE_FLOW_STATUSES: OrderStatus[] = ORDER_FLOW_COLUMNS.flatMap(
  (c) => c.statuses
);
