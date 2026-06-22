"use client";

import { useCallback, useMemo, useState } from "react";
import { ReservationStatus } from "@prisma/client";
import {
  Bell,
  CalendarDays,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  Volume2,
  VolumeX,
} from "lucide-react";
import ReservationCard from "@/components/admin/reservations/ReservationCard";
import ReservationCalendarView from "@/components/admin/reservations/ReservationCalendarView";
import ReservationStatsWidgets from "@/components/admin/reservations/ReservationStatsWidgets";
import ReservationTimelineView from "@/components/admin/reservations/ReservationTimelineView";
import TableManagementPanel from "@/components/admin/reservations/TableManagementPanel";
import { useReservationPolling } from "@/components/admin/reservations/useReservationPolling";
import {
  RESERVATION_DATE_RANGES,
  formatDateKey,
  isUpcomingArrival,
  type ReservationDateRange,
} from "@/lib/reservations/admin";

type ViewMode = "list" | "calendar" | "timeline";

export default function ReservationsAdminClient() {
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<ReservationDateRange>("week");
  const [view, setView] = useState<ViewMode>("list");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));

  const { data, loading, refreshing, error, lastUpdated, refresh, setError } =
    useReservationPolling({ range, search, soundEnabled });

  const todayKey = formatDateKey(new Date());

  const todayReservations = useMemo(
    () => data?.reservations.filter((r) => r.date === todayKey) ?? [],
    [data?.reservations, todayKey]
  );

  const upcomingReservations = useMemo(
    () =>
      (data?.reservations ?? []).filter(
        (r) =>
          r.date >= todayKey &&
          r.status !== ReservationStatus.CANCELLED &&
          r.status !== ReservationStatus.COMPLETED &&
          r.status !== ReservationStatus.NO_SHOW
      ),
    [data?.reservations, todayKey]
  );

  const reminderReservations = useMemo(
    () =>
      todayReservations.filter(
        (r) =>
          (r.status === ReservationStatus.NEW ||
            r.status === ReservationStatus.CONFIRMED) &&
          isUpcomingArrival(r.date, r.time)
      ),
    [todayReservations]
  );

  const handleAction = useCallback(
    async (id: string, status: ReservationStatus) => {
      setActingId(id);
      setError("");
      try {
        const res = await fetch(`/api/reservations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error();
        await refresh();
      } catch {
        setError("Kunde inte uppdatera status.");
      } finally {
        setActingId(null);
      }
    },
    [setError, refresh]
  );

  const handleAssignTable = useCallback(
    async (id: string, tableId: string | null) => {
      setActingId(id);
      setError("");
      try {
        const res = await fetch(`/api/reservations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tableId }),
        });
        if (!res.ok) throw new Error();
        await refresh();
      } catch {
        setError("Kunde inte tilldela bord.");
      } finally {
        setActingId(null);
      }
    },
    [setError, refresh]
  );

  const handleCreateTable = useCallback(
    async (name: string, capacity: number) => {
      setError("");
      const res = await fetch("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, capacity }),
      });
      if (!res.ok) {
        setError("Kunde inte skapa bord.");
        return;
      }
      await refresh();
    },
    [setError, refresh]
  );

  const handleMergeTables = useCallback(
    async (tableIds: string[]) => {
      setError("");
      const res = await fetch("/api/admin/tables/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableIds }),
      });
      if (!res.ok) {
        setError("Kunde inte slå ihop bord.");
        return;
      }
      await refresh();
    },
    [setError, refresh]
  );

  const stats = data?.stats ?? {
    todayCount: 0,
    availableTables: 0,
    occupiedTables: 0,
    upcomingArrivals: 0,
    totalCapacity: 0,
    totalTables: 0,
  };

  return (
    <div className="px-4 py-6 pb-12 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-white/[0.05] pb-8 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="section-label mb-3">Bokningar</p>
          <h1 className="font-serif text-3xl text-white sm:text-4xl">Reservationer</h1>
          <p className="mt-3 text-sm text-white/45">
            {loading
              ? "Laddar…"
              : `${data?.reservations.length ?? 0} bokningar · uppdaterad ${
                  lastUpdated
                    ? lastUpdated.toLocaleTimeString("sv-SE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"
                }`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            Ljud
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Uppdatera
          </button>
        </div>
      </header>

      <div className="mb-6">
        <ReservationStatsWidgets stats={stats} />
      </div>

      {(reminderReservations.length > 0 || stats.upcomingArrivals > 0) && (
        <section className="mb-6 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-amber-200">
            <Bell size={16} />
            <h2 className="font-serif text-lg">Kommande ankomster & påminnelser</h2>
          </div>
          <ul className="mt-3 space-y-2">
            {reminderReservations.slice(0, 5).map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-amber-500/15 bg-black/20 px-3 py-2 text-sm"
              >
                <span className="text-white">
                  {r.name} · {r.time} · {r.guestCount} gäster
                </span>
                <span className="text-xs text-amber-200/80">Inom 2 h</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
        />
        <input
          type="search"
          placeholder="Sök namn eller telefon…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-white/8 bg-[#1a1a1a] py-3 pl-11 pr-4 text-white placeholder:text-white/40 focus:border-[#b85c38]/50 focus:outline-none"
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          {RESERVATION_DATE_RANGES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                range === key
                  ? "bg-[#b85c38] text-white"
                  : "bg-white/5 text-white/55 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-xl border border-white/8 bg-[#121212] p-1">
          {(
            [
              { key: "list" as const, icon: List, label: "Lista" },
              { key: "calendar" as const, icon: CalendarDays, label: "Kalender" },
              { key: "timeline" as const, icon: LayoutGrid, label: "Tidslinje" },
            ] as const
          ).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                view === key
                  ? "bg-[#b85c38] text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {view === "calendar" && data && (
        <div className="mb-8">
          <ReservationCalendarView
            reservations={data.reservations}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
      )}

      {view === "timeline" && data && (
        <div className="mb-8">
          <ReservationTimelineView
            reservations={data.reservations}
            dateKey={selectedDate}
          />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {view === "list" && (
            <>
              <section>
                <h2 className="mb-3 font-serif text-lg text-white">Dagens reservationer</h2>
                {loading ? (
                  <p className="text-sm text-white/45">Laddar…</p>
                ) : todayReservations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-white/40">
                    Inga bokningar idag.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayReservations.map((reservation) => (
                      <ReservationCard
                        key={reservation.id}
                        reservation={reservation}
                        tables={data?.tables ?? []}
                        acting={actingId === reservation.id}
                        onAction={handleAction}
                        onAssignTable={handleAssignTable}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="mb-3 font-serif text-lg text-white">Kommande reservationer</h2>
                {loading ? (
                  <p className="text-sm text-white/45">Laddar…</p>
                ) : upcomingReservations.filter((r) => r.date !== todayKey).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-white/40">
                    Inga kommande bokningar i valt filter.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingReservations
                      .filter((r) => r.date !== todayKey)
                      .map((reservation) => (
                        <ReservationCard
                          key={reservation.id}
                          reservation={reservation}
                          tables={data?.tables ?? []}
                          acting={actingId === reservation.id}
                          onAction={handleAction}
                          onAssignTable={handleAssignTable}
                        />
                      ))}
                  </div>
                )}
              </section>
            </>
          )}

          {view !== "list" && !loading && (data?.reservations.length ?? 0) > 0 && (
            <section>
              <h2 className="mb-3 font-serif text-lg text-white">Alla i urvalet</h2>
              <div className="space-y-3">
                {data!.reservations.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    tables={data?.tables ?? []}
                    acting={actingId === reservation.id}
                    onAction={handleAction}
                    onAssignTable={handleAssignTable}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <div>
          <TableManagementPanel
            tables={data?.tables ?? []}
            stats={stats}
            onCreate={handleCreateTable}
            onMerge={handleMergeTables}
            busy={!!actingId || refreshing}
          />
        </div>
      </div>
    </div>
  );
}
