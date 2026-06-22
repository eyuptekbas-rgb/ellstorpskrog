"use client";

import { ReservationStatus } from "@prisma/client";
import {
  ADMIN_RESERVATION_STATUS_LABELS,
  adminReservationStatusStyle,
  formatDateKey,
  type AdminReservationRow,
} from "@/lib/reservations/admin";

const START_HOUR = 11;
const END_HOUR = 23;

type Props = {
  reservations: AdminReservationRow[];
  dateKey?: string;
};

function hourLabel(hour: number) {
  return `${hour.toString().padStart(2, "0")}:00`;
}

export default function ReservationTimelineView({
  reservations,
  dateKey,
}: Props) {
  const targetDate = dateKey ?? formatDateKey(new Date());
  const dayReservations = reservations
    .filter(
      (r) =>
        r.date === targetDate && r.status !== ReservationStatus.CANCELLED
    )
    .sort((a, b) => a.time.localeCompare(b.time));

  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i
  );

  return (
    <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="font-serif text-xl text-white">Tidslinje</h2>
        <p className="mt-0.5 text-sm text-white/45">
          {new Date(`${targetDate}T12:00:00`).toLocaleDateString("sv-SE", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px] space-y-2">
          {hours.map((hour) => {
            const slotReservations = dayReservations.filter((r) => {
              const h = Number.parseInt(r.time.split(":")[0] ?? "0", 10);
              return h === hour;
            });

            return (
              <div key={hour} className="grid grid-cols-[4rem_1fr] gap-3">
                <span className="pt-2 text-xs tabular-nums text-white/35">
                  {hourLabel(hour)}
                </span>
                <div className="min-h-[3rem] rounded-2xl border border-white/6 bg-[#121212] p-2">
                  {slotReservations.length === 0 ? (
                    <p className="px-2 py-1 text-xs text-white/25">—</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {slotReservations.map((r) => (
                        <div
                          key={r.id}
                          className="min-w-[140px] flex-1 rounded-xl border border-[#b85c38]/20 bg-[#b85c38]/10 px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium text-white">
                              {r.name}
                            </p>
                            <span
                              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1 ${adminReservationStatusStyle(r.status)}`}
                            >
                              {ADMIN_RESERVATION_STATUS_LABELS[r.status]}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-white/45">
                            {r.time} · {r.guestCount} gäster
                            {r.table?.name ? ` · ${r.table.name}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
