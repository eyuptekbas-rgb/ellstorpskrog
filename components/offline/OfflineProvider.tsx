"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  incrementOfflineAttempt,
  isBrowserOnline,
  loadOfflineQueue,
  pendingOfflineCount,
  removeOfflineAction,
  type SyncState,
} from "@/lib/offline/queue";

type OfflineContextValue = {
  syncState: SyncState;
  pendingCount: number;
  refresh: () => void;
  flushQueue: () => Promise<void>;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

async function executeOfflineAction(
  action: ReturnType<typeof loadOfflineQueue>[number]
): Promise<boolean> {
  if (action.type === "order-status-update") {
    const res = await fetch(`/api/orders/${action.payload.orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action.payload.status }),
    });
    if (res.status === 409) return false;
    return res.ok;
  }
  return false;
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [syncState, setSyncState] = useState<SyncState>(
    isBrowserOnline() ? "online" : "offline"
  );
  const [pendingCount, setPendingCount] = useState(pendingOfflineCount);

  const refresh = useCallback(() => {
    setPendingCount(pendingOfflineCount());
    setSyncState(isBrowserOnline() ? "online" : "offline");
  }, []);

  const flushQueue = useCallback(async () => {
    if (!isBrowserOnline()) {
      setSyncState("offline");
      return;
    }
    const queue = loadOfflineQueue();
    if (queue.length === 0) {
      setSyncState("online");
      setPendingCount(0);
      return;
    }

    setSyncState("syncing");
    for (const action of queue) {
      try {
        const ok = await executeOfflineAction(action);
        if (ok) {
          removeOfflineAction(action.id);
        } else {
          incrementOfflineAttempt(action.id);
          setSyncState("conflict");
        }
      } catch {
        incrementOfflineAttempt(action.id);
      }
    }
    refresh();
    if (pendingOfflineCount() === 0) {
      setSyncState("online");
    }
  }, [refresh]);

  useEffect(() => {
    const onOnline = () => {
      setSyncState("online");
      void flushQueue();
    };
    const onOffline = () => setSyncState("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    queueMicrotask(refresh);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [flushQueue, refresh]);

  useEffect(() => {
    const timer = setInterval(refresh, 5_000);
    return () => clearInterval(timer);
  }, [refresh]);

  const value = useMemo(
    () => ({ syncState, pendingCount, refresh, flushQueue }),
    [syncState, pendingCount, refresh, flushQueue]
  );

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}

export function useOfflineSync() {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    return {
      syncState: "online" as SyncState,
      pendingCount: 0,
      refresh: () => undefined,
      flushQueue: async () => undefined,
    };
  }
  return ctx;
}

export function OfflineSyncBadge() {
  const { syncState, pendingCount } = useOfflineSync();
  if (syncState === "online" && pendingCount === 0) return null;

  const label =
    syncState === "offline"
      ? "Offline"
      : syncState === "syncing"
        ? "Synkar…"
        : syncState === "conflict"
          ? "Synkkonflikt"
          : "Online";

  return (
    <div
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
        syncState === "offline"
          ? "bg-amber-500/15 text-amber-200"
          : syncState === "conflict"
            ? "bg-red-500/15 text-red-200"
            : syncState === "syncing"
              ? "bg-sky-500/15 text-sky-200"
              : "bg-emerald-500/15 text-emerald-200"
      }`}
    >
      {label}
      {pendingCount > 0 ? ` · ${pendingCount}` : ""}
    </div>
  );
}
