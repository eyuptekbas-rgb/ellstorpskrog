import { KITCHEN_SCREENS } from "@/lib/kitchen/screens";
import type { PrinterRole } from "./printer-registry";
import type { PrintableOrder, PrintableOrderItem } from "./types";

const BAR_KEYWORDS =
  KITCHEN_SCREENS.find((s) => s.id === "bar")?.keywords ?? [];
const DESSERT_KEYWORDS =
  KITCHEN_SCREENS.find((s) => s.id === "dessert")?.keywords ?? [];

function matchesKeywords(name: string, keywords: readonly string[]): boolean {
  const haystack = name.toLowerCase();
  return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

function classifyItem(item: PrintableOrderItem): PrinterRole {
  if (matchesKeywords(item.productName, DESSERT_KEYWORDS)) return "dessert";
  if (matchesKeywords(item.productName, BAR_KEYWORDS)) return "bar";
  return "kitchen";
}

/** Split order items across kitchen, bar, and dessert printers. */
export function splitOrderByStation(
  order: PrintableOrder
): Partial<Record<Extract<PrinterRole, "kitchen" | "bar" | "dessert">, PrintableOrder>> {
  const buckets: Record<string, PrintableOrderItem[]> = {
    kitchen: [],
    bar: [],
    dessert: [],
  };

  for (const item of order.items) {
    buckets[classifyItem(item)].push(item);
  }

  const result: Partial<
    Record<Extract<PrinterRole, "kitchen" | "bar" | "dessert">, PrintableOrder>
  > = {};

  for (const role of ["kitchen", "bar", "dessert"] as const) {
    if (buckets[role].length === 0) continue;
    result[role] = { ...order, items: buckets[role] };
  }

  return result;
}

export function stationLabel(role: Extract<PrinterRole, "kitchen" | "bar" | "dessert">): string {
  switch (role) {
    case "kitchen":
      return "KÖK";
    case "bar":
      return "BAR";
    case "dessert":
      return "DESSERT";
  }
}
