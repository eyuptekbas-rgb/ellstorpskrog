"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReservationStatus } from "@prisma/client";
import type { ReservationAdminBundle } from "@/lib/reservations/admin-service";
import type { ReservationDateRange } from "@/lib/reservations/admin";
import { RESERVATION_POLL_INTERVAL_MS } from "@/lib/reservations/admin";
import { playNewReservationSound } from "./playReservationSound";

type Options = {
  range: ReservationDateRange;
  search: string;
  soundEnabled?: boolean;
};

export function useReservationPolling({
  range,
  search,
  soundEnabled = true,
}: Options) {
  const [data, setData] = useState<ReservationAdminBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const knownNewIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError("");

      try {
        const params = new URLSearchParams();
        params.set("range", range);
        if (search) params.set("search", search);

        const res = await fetch(`/api/admin/reservations?${params.toString()}`);
        if (!res.ok) throw new Error();
        const bundle: ReservationAdminBundle = await res.json();

        const pending = bundle.reservations.filter(
          (r) => r.status === ReservationStatus.NEW
        );
        const pendingIds = new Set(pending.map((r) => r.id));

        if (initialized.current && soundEnabled) {
          const hasFresh = pending.some((r) => !knownNewIds.current.has(r.id));
          if (hasFresh) playNewReservationSound();
        }

        knownNewIds.current = pendingIds;
        initialized.current = true;
        setData(bundle);
        setLastUpdated(new Date());
      } catch {
        setError("Kunde inte hämta reservationer.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range, search, soundEnabled]
  );

  useEffect(() => {
    const timer = setTimeout(() => void fetchData(false), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, search]);

  useEffect(() => {
    const interval = setInterval(() => void fetchData(true), RESERVATION_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const patchReservation = useCallback(
    (id: string, patch: Partial<ReservationAdminBundle["reservations"][number]>) => {
      setData((prev) =>
        prev
          ? {
              ...prev,
              reservations: prev.reservations.map((r) =>
                r.id === id ? { ...r, ...patch } : r
              ),
            }
          : prev
      );
    },
    []
  );

  return {
    data,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh: () => fetchData(true),
    patchReservation,
    setError,
    setData,
  };
}
