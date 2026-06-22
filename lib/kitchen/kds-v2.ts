import { OrderStatus } from "@prisma/client";
import type { AdminOrderListItem } from "@/components/admin/orders/useOrderPolling";
import type { KitchenScreenId } from "./screens";

export type KdsColumnKey = "new" | "cooking" | "ready";

export type KdsCard = {
  orderId: string;
  order: AdminOrderListItem;
  column: KdsColumnKey;
  station: KitchenScreenId;
  priority: "normal" | "high" | "rush";
  startedAt: string;
};

const STORAGE_KEY = "rms-kds-layout";

export function statusToKdsColumn(status: OrderStatus): KdsColumnKey {
  if (status === OrderStatus.NEW) return "new";
  if (status === OrderStatus.CONFIRMED || status === OrderStatus.PREPARING) {
    return "cooking";
  }
  return "ready";
}

export function kdsColumnToStatus(column: KdsColumnKey): OrderStatus {
  if (column === "new") return OrderStatus.NEW;
  if (column === "cooking") return OrderStatus.PREPARING;
  return OrderStatus.READY;
}

export function priorityColor(priority: KdsCard["priority"]): string {
  if (priority === "rush") return "#ef4444";
  if (priority === "high") return "#f59e0b";
  return "#34d399";
}

export function loadKdsLayout(): Record<string, KdsColumnKey> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, KdsColumnKey>) : {};
  } catch {
    return {};
  }
}

export function saveKdsLayout(layout: Record<string, KdsColumnKey>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

export function elapsedMinutes(iso: string, now = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
}

export function timerClass(minutes: number): string {
  if (minutes >= 20) return "text-red-300";
  if (minutes >= 12) return "text-amber-200";
  return "text-emerald-200";
}
