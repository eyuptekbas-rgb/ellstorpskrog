const RECENT_KEY = "pos-recent-order-ids";
const MAX_RECENT = 20;

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecent(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, MAX_RECENT)));
}

export function trackRecentOrder(orderId: string) {
  const current = readRecent().filter((id) => id !== orderId);
  writeRecent([orderId, ...current]);
}

export function getRecentOrderIds(): string[] {
  return readRecent();
}

export function filterRecentOrders<T extends { id: string }>(
  orders: T[],
  recentIds: string[]
): T[] {
  const byId = new Map(orders.map((order) => [order.id, order]));
  return recentIds
    .map((id) => byId.get(id))
    .filter((order): order is T => Boolean(order));
}
