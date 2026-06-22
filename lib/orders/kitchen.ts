import { OrderStatus } from "@prisma/client";

/** Kitchen display column mapping */
export const KITCHEN_COLUMNS = [
  {
    key: "new",
    label: "Nya",
    statuses: [OrderStatus.NEW] as OrderStatus[],
    accent: "#f59e0b",
  },
  {
    key: "preparing",
    label: "Tillagas",
    statuses: [OrderStatus.CONFIRMED, OrderStatus.PREPARING] as OrderStatus[],
    accent: "#b85c38",
  },
  {
    key: "ready",
    label: "Klara",
    statuses: [OrderStatus.READY, OrderStatus.DELIVERING] as OrderStatus[],
    accent: "#34d399",
  },
] as const;

/** Minutes before urgency escalates */
export const KITCHEN_URGENCY_WARN_MIN = 5;
export const KITCHEN_URGENCY_CRITICAL_MIN = 10;

/** Flash indicator after this many minutes (configurable) */
export const KITCHEN_FLASH_AFTER_MIN = 8;

export type KitchenUrgency = "normal" | "warn" | "critical";

export function getKitchenUrgency(createdAt: string, now = Date.now()): KitchenUrgency {
  const elapsedMin = (now - new Date(createdAt).getTime()) / 60_000;
  if (elapsedMin >= KITCHEN_URGENCY_CRITICAL_MIN) return "critical";
  if (elapsedMin >= KITCHEN_URGENCY_WARN_MIN) return "warn";
  return "normal";
}

export function shouldFlashOrder(createdAt: string, now = Date.now()): boolean {
  const elapsedMin = (now - new Date(createdAt).getTime()) / 60_000;
  return elapsedMin >= KITCHEN_FLASH_AFTER_MIN;
}

export function urgencyBorderClass(urgency: KitchenUrgency, flashing: boolean): string {
  if (flashing) {
    return "border-amber-400/70 shadow-[0_0_24px_-4px_rgba(251,191,36,0.55)] animate-pulse";
  }
  switch (urgency) {
    case "critical":
      return "border-red-500/50 shadow-[0_0_20px_-6px_rgba(239,68,68,0.45)]";
    case "warn":
      return "border-amber-500/40 shadow-[0_0_16px_-8px_rgba(245,158,11,0.35)]";
    default:
      return "border-white/10";
  }
}

export function urgencyTimerClass(urgency: KitchenUrgency): string {
  switch (urgency) {
    case "critical":
      return "text-red-300 bg-red-500/15";
    case "warn":
      return "text-amber-200 bg-amber-500/12";
    default:
      return "text-white/70 bg-white/8";
  }
}

export function formatElapsedTimer(createdAt: string, now = Date.now()): string {
  const totalSec = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
