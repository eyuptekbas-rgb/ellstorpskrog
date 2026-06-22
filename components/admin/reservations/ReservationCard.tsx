"use client";

import { ReservationStatus } from "@prisma/client";
import { Bell, Mail, Phone, Users } from "lucide-react";
import {
  ADMIN_RESERVATION_STATUS_LABELS,
  adminReservationStatusStyle,
  getReservationActions,
  groupTablesByMerge,
  isReminderWindow,
  isUpcomingArrival,
  mergedTableCapacity,
  mergedTableLabel,
  type AdminReservationRow,
  type AdminTableRow,
} from "@/lib/reservations/admin";
import { formatReservationDate } from "@/lib/reservations";

type Props = {
  reservation: AdminReservationRow;
  tables: AdminTableRow[];
  acting: boolean;
  onAction: (id: string, status: ReservationStatus) => void;
  onAssignTable: (id: string, tableId: string | null) => void;
};

export default function ReservationCard({
  reservation,
  tables,
  acting,
  onAction,
  onAssignTable,
}: Props) {
  const actions = getReservationActions(reservation.status);
  const upcoming = isUpcomingArrival(reservation.date, reservation.time);
  const reminder = isReminderWindow(reservation.date, reservation.time);
  const tableGroups = groupTablesByMerge(tables.filter((t) => t.active));

  return (
    <article className="rounded-3xl border border-white/8 bg-gradient-to-b from-[#1a1a1a] to-[#141414] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-lg text-white">{reservation.name}</h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${adminReservationStatusStyle(reservation.status)}`}
            >
              {ADMIN_RESERVATION_STATUS_LABELS[reservation.status]}
            </span>
            {upcoming && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                <Bell size={10} />
                Ankomst snart
              </span>
            )}
            {reminder && !upcoming && (
              <span className="rounded-full bg-[#b85c38]/15 px-2 py-0.5 text-[10px] font-medium text-[#e8c4a8]">
                Påminnelse
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-white/45">
            {formatReservationDate(reservation.date)} · {reservation.time}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-[#b85c38]/10 px-3 py-1.5 text-sm text-[#e8c4a8]">
          <Users size={14} />
          {reservation.guestCount} gäster
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <p className="flex items-center gap-2 text-white/65">
          <Phone size={14} className="shrink-0 text-white/35" />
          {reservation.phone}
        </p>
        <p className="flex items-center gap-2 truncate text-white/65">
          <Mail size={14} className="shrink-0 text-white/35" />
          {reservation.email}
        </p>
      </div>

      {reservation.comment && (
        <p className="mt-3 rounded-2xl border border-white/6 bg-black/20 px-3 py-2 text-sm text-white/55">
          {reservation.comment}
        </p>
      )}

      <div className="mt-4">
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/35">
          Tilldela bord
        </label>
        <select
          value={reservation.tableId ?? ""}
          disabled={acting}
          onChange={(e) =>
            onAssignTable(reservation.id, e.target.value ? e.target.value : null)
          }
          className="w-full rounded-xl border border-white/8 bg-[#121212] px-3 py-2.5 text-sm text-white focus:border-[#b85c38]/40 focus:outline-none"
        >
          <option value="">Inget bord</option>
          {tableGroups.map((group) => {
            const primary = group[0];
            const label =
              group.length > 1 ? mergedTableLabel(group) : primary.name;
            const capacity = mergedTableCapacity(group);
            return (
              <option key={primary.id} value={primary.id}>
                {label} ({capacity} platser)
              </option>
            );
          })}
        </select>
      </div>

      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              disabled={acting}
              onClick={() => onAction(reservation.id, action.status)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                action.tone === "primary"
                  ? "bg-[#b85c38] text-white hover:bg-[#c96a45]"
                  : action.tone === "danger"
                    ? "border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
