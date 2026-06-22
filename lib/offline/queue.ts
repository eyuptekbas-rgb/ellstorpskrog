import { OrderStatus } from "@prisma/client";

export type OfflineActionType = "order-status-update";

export type OfflineAction = {
  id: string;
  type: OfflineActionType;
  createdAt: string;
  attempts: number;
  payload: {
    orderId: string;
    status: OrderStatus;
    previousStatus: OrderStatus;
  };
};

const STORAGE_KEY = "rms-offline-queue";
const MAX_ATTEMPTS = 8;

export function loadOfflineQueue(): OfflineAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OfflineAction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOfflineQueue(actions: OfflineAction[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
}

export function enqueueOfflineAction(
  action: Omit<OfflineAction, "id" | "createdAt" | "attempts">
) {
  const queue = loadOfflineQueue();
  queue.push({
    ...action,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    attempts: 0,
  });
  saveOfflineQueue(queue);
}

export function removeOfflineAction(id: string) {
  saveOfflineQueue(loadOfflineQueue().filter((action) => action.id !== id));
}

export function incrementOfflineAttempt(id: string) {
  const queue = loadOfflineQueue();
  const next = queue
    .map((action) => {
      if (action.id !== id) return action;
      const attempts = action.attempts + 1;
      return attempts >= MAX_ATTEMPTS ? null : { ...action, attempts };
    })
    .filter((action): action is OfflineAction => action !== null);
  saveOfflineQueue(next);
}

export function isBrowserOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export type SyncState = "online" | "offline" | "syncing" | "conflict";

export function pendingOfflineCount() {
  return loadOfflineQueue().length;
}
