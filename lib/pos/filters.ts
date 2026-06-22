import type { OrderFilterGroup } from "@/lib/orders/admin-filters";

/** POS sidebar tabs mapped to keyboard shortcuts F1–F4. */
export const POS_FILTER_GROUPS: {
  key: OrderFilterGroup;
  label: string;
  shortcut: string;
}[] = [
  { key: "NEW", label: "Nya ordrar", shortcut: "F1" },
  { key: "KITCHEN", label: "Kök", shortcut: "F2" },
  { key: "READY", label: "Klara", shortcut: "F3" },
  { key: "COMPLETED", label: "Slutförda", shortcut: "F4" },
];

export const POS_FILTER_SHORTCUTS: Record<string, OrderFilterGroup> = {
  F1: "NEW",
  F2: "KITCHEN",
  F3: "READY",
  F4: "COMPLETED",
};
