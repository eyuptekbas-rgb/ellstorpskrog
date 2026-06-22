export function formatPosOrderNumber(orderNumber: string): string {
  const numeric = orderNumber.replace(/^EK-0*/, "").replace(/\D/g, "");
  if (numeric) return `#${numeric}`;
  return `#${orderNumber}`;
}

/** Sidebar queue — numeric only, e.g. 1042 */
export function formatPosQueueNumber(orderNumber: string): string {
  const numeric = orderNumber.replace(/^EK-0*/, "").replace(/\D/g, "");
  if (numeric) return numeric.replace(/^0+/, "") || numeric;
  return orderNumber.replace(/\D/g, "") || orderNumber;
}

export function formatPosClock(nowMs: number): string {
  return new Date(nowMs).toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPosDate(nowMs: number): string {
  return new Date(nowMs).toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatWaitingTimer(createdAt: string, nowMs: number): string {
  const elapsedSec = Math.max(
    0,
    Math.floor((nowMs - new Date(createdAt).getTime()) / 1000)
  );
  const min = Math.floor(elapsedSec / 60);
  const sec = elapsedSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}
