import { OrderStatus } from "@prisma/client";

/** Production kitchen display columns (standalone /kitchen). */
export const PRODUCTION_KITCHEN_COLUMNS = [
  {
    key: "new" as const,
    label: "NEW",
    statuses: [OrderStatus.NEW] as OrderStatus[],
    accent: "#f59e0b",
  },
  {
    key: "cooking" as const,
    label: "COOKING",
    statuses: [OrderStatus.CONFIRMED, OrderStatus.PREPARING] as OrderStatus[],
    accent: "#b85c38",
  },
  {
    key: "ready" as const,
    label: "READY",
    statuses: [OrderStatus.READY, OrderStatus.DELIVERING] as OrderStatus[],
    accent: "#34d399",
  },
];

export type ProductionKitchenColumnKey =
  (typeof PRODUCTION_KITCHEN_COLUMNS)[number]["key"];

/** Active kitchen statuses only — excludes completed/cancelled. */
export const ACTIVE_KITCHEN_STATUSES: OrderStatus[] =
  PRODUCTION_KITCHEN_COLUMNS.flatMap((column) => column.statuses);

export function isActiveKitchenOrder(status: OrderStatus): boolean {
  return ACTIVE_KITCHEN_STATUSES.includes(status);
}

export function columnKeyForOrder(
  status: OrderStatus
): ProductionKitchenColumnKey | null {
  const column = PRODUCTION_KITCHEN_COLUMNS.find((entry) =>
    entry.statuses.includes(status)
  );
  return column?.key ?? null;
}
