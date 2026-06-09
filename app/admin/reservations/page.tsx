"use client";

import { useCallback, useEffect, useState } from "react";
import { ReservationStatus } from "@prisma/client";
import { CalendarDays, RefreshCw, Search } from "lucide-react";
import {
  RESERVATION_STATUS_FILTERS,
  RESERVATION_STATUS_LABELS,
  ReservationStatusFilter,
  formatReservationDate,
  reservationStatusStyle,
} from "@/lib/reservations";

type Reservation = {
  id: string;
  name: string;
  phone: string;
  email: string;
  guestCount: number;
  date: string;
  time: string;
  comment: string | null;
  status: ReservationStatus;
  createdAt: string;
};

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatusFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/reservations?${params.toString()}`);
      if (!res.ok) throw new Error();
      setReservations(await res.json());
    } catch {
      setError("Kunde inte hämta reservationer.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchReservations, 300);
    return () => clearTimeout(timer);
  }, [fetchReservations]);

  const handleStatusChange = async (id: string, status: ReservationStatus) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      await fetchReservations();
    } catch {
      setError("Kunde inte uppdatera status.");
    }
  };

  return (
    <div className="px-5 py-8 pb-12">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-wide">Reservationer</h1>
          <div className="mt-3 mb-2 h-[2px] w-16 rounded-full bg-[#b85c38]" />
          <p className="text-sm text-white/60">
            {loading
              ? "Laddar…"
              : `${reservations.length} bokningar · datumordning`}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchReservations}
          disabled={loading}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 disabled:opacity-50"
          title="Uppdatera"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
        />
        <input
          type="search"
          placeholder="Sök namn, telefon eller e-post…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-white/5 bg-[#1a1a1a] py-3 pl-11 pr-4 text-white placeholder:text-white/40 transition focus:border-[#b85c38]/50 focus:outline-none"
        />
      </div>

      <div className="scrollbar-hide mb-4 flex gap-2 overflow-x-auto pb-2">
        {RESERVATION_STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === key
                ? "bg-[#b85c38] text-white"
                : "bg-white/5 text-white/55 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#111]">
        <div className="hidden grid-cols-[1.2fr_0.7fr_0.9fr_0.7fr_1fr_1fr] gap-3 border-b border-white/5 px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-white/35 lg:grid">
          <span>Namn</span>
          <span>Gäster</span>
          <span>Datum</span>
          <span>Tid</span>
          <span>Telefon</span>
          <span>Status</span>
        </div>

        {loading ? (
          <div className="px-4 py-10 text-center text-sm text-white/45">
            Laddar reservationer…
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center text-white/45">
            <CalendarDays size={28} className="text-white/20" />
            <p className="text-sm">Inga reservationer hittades.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {reservations.map((reservation) => (
              <li
                key={reservation.id}
                className="grid gap-3 px-4 py-4 lg:grid-cols-[1.2fr_0.7fr_0.9fr_0.7fr_1fr_1fr] lg:items-center"
              >
                <div>
                  <p className="font-medium text-white">{reservation.name}</p>
                  <p className="mt-0.5 text-xs text-white/40 lg:hidden">
                    {reservation.guestCount} gäster · {reservation.time}
                  </p>
                </div>
                <p className="text-sm text-white/65">{reservation.guestCount}</p>
                <p className="text-sm text-white/65">
                  {formatReservationDate(reservation.date)}
                </p>
                <p className="text-sm tabular-nums text-white/65">
                  {reservation.time}
                </p>
                <p className="text-sm text-white/65">{reservation.phone}</p>
                <div>
                  <select
                    value={reservation.status}
                    onChange={(e) =>
                      handleStatusChange(
                        reservation.id,
                        e.target.value as ReservationStatus
                      )
                    }
                    className={`w-full rounded-xl border-0 px-3 py-2 text-xs font-semibold ring-1 focus:outline-none focus:ring-[#b85c38]/40 ${reservationStatusStyle(reservation.status)}`}
                  >
                    {Object.values(ReservationStatus).map((status) => (
                      <option key={status} value={status} className="bg-[#1a1a1a]">
                        {RESERVATION_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
