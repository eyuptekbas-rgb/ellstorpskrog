"use client";

import { ReservationStatus } from "@prisma/client";
import {
  ADMIN_RESERVATION_STATUS_LABELS,
  adminReservationStatusStyle,
  formatDateKey,
  type AdminReservationRow,
} from "@/lib/reservations/admin";

type Props = {
  reservations: AdminReservationRow[];
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
};

function buildMonthDays(anchor: Date) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ dateKey: string; day: number; inMonth: boolean }> = [];

  for (let i = 0; i < startPad; i++) {
    cells.push({ dateKey: "", day: 0, inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    cells.push({ dateKey: formatDateKey(d), day, inMonth: true });
  }
  return cells;
}

export default function ReservationCalendarView({
  reservations,
  selectedDate,
  onSelectDate,
}: Props) {
  const anchor = selectedDate
    ? new Date(`${selectedDate}T12:00:00`)
    : new Date();
  const monthLabel = anchor.toLocaleDateString("sv-SE", {
    month: "long",
    year: "numeric",
  });
  const counts = new Map<string, number>();
  for (const r of reservations) {
    if (r.status === ReservationStatus.CANCELLED) continue;
    counts.set(r.date, (counts.get(r.date) ?? 0) + 1);
  }
  const cells = buildMonthDays(anchor);
  const todayKey = formatDateKey(new Date());

  return (
    <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="font-serif text-xl capitalize text-white">{monthLabel}</h2>
        <p className="mt-0.5 text-sm text-white/45">Kalendervy — tryck på en dag</p>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-white/30">
        {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell.inMonth) {
            return <div key={`pad-${idx}`} className="aspect-square" />;
          }
          const count = counts.get(cell.dateKey) ?? 0;
          const isSelected = cell.dateKey === selectedDate;
          const isToday = cell.dateKey === todayKey;

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => onSelectDate(cell.dateKey)}
              className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition ${
                isSelected
                  ? "border-[#b85c38]/50 bg-[#b85c38]/20 text-white"
                  : isToday
                    ? "border-[#b85c38]/30 bg-[#b85c38]/10 text-[#e8c4a8]"
                    : "border-white/6 bg-[#121212] text-white/70 hover:border-white/12"
              }`}
            >
              <span className="font-medium">{cell.day}</span>
              {count > 0 && (
                <span className="mt-0.5 text-[10px] font-semibold text-[#d4a574]">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        {reservations
          .filter((r) => r.date === selectedDate)
          .slice(0, 5)
          .map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-white/6 bg-[#121212] px-3 py-2"
            >
              <div>
                <p className="text-sm text-white">{r.name}</p>
                <p className="text-xs text-white/40">
                  {r.time} · {r.guestCount} gäster
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${adminReservationStatusStyle(r.status)}`}
              >
                {ADMIN_RESERVATION_STATUS_LABELS[r.status]}
              </span>
            </div>
          ))}
      </div>
    </section>
  );
}
