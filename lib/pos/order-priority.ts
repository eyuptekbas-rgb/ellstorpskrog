const PRIORITY_KEY = "pos-priority-order-ids";

function readIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(PRIORITY_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PRIORITY_KEY, JSON.stringify([...ids]));
}

export function getPriorityOrderIds(): Set<string> {
  return readIds();
}

export function isPriorityOrder(orderId: string): boolean {
  return readIds().has(orderId);
}

export function togglePriorityOrder(orderId: string): boolean {
  const ids = readIds();
  if (ids.has(orderId)) {
    ids.delete(orderId);
    writeIds(ids);
    return false;
  }
  ids.add(orderId);
  writeIds(ids);
  return true;
}

export function sortOrdersWithPriority<T extends { id: string; createdAt: string }>(
  orders: T[],
  priorityIds: Set<string>
): T[] {
  return [...orders].sort((a, b) => {
    const aPriority = priorityIds.has(a.id);
    const bPriority = priorityIds.has(b.id);
    if (aPriority !== bPriority) return aPriority ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
