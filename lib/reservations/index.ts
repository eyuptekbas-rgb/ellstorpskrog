import { ReservationStatus } from "@prisma/client";
import { isTimeSlotAvailable, isValidGuestCount } from "./booking-ui";

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  NEW: "Ny",
  CONFIRMED: "Bekräftad",
  CANCELLED: "Avbokad",
};

export const RESERVATION_STATUS_FILTERS = [
  { key: "ALL" as const, label: "Alla" },
  { key: ReservationStatus.NEW, label: "Ny" },
  { key: ReservationStatus.CONFIRMED, label: "Bekräftad" },
  { key: ReservationStatus.CANCELLED, label: "Avbokad" },
];

export type ReservationStatusFilter =
  | "ALL"
  | ReservationStatus;

export function reservationStatusStyle(status: ReservationStatus): string {
  switch (status) {
    case ReservationStatus.NEW:
      return "bg-[#b85c38]/15 text-[#e8c4a8] ring-[#b85c38]/30";
    case ReservationStatus.CONFIRMED:
      return "bg-emerald-500/15 text-emerald-200 ring-emerald-500/25";
    case ReservationStatus.CANCELLED:
      return "bg-white/5 text-white/45 ring-white/10";
    default:
      return "bg-white/5 text-white/60 ring-white/10";
  }
}

export function formatReservationDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export type CreateReservationInput = {
  name: string;
  phone: string;
  email: string;
  guestCount: number;
  date: string;
  time: string;
  comment?: string;
};

export function validateReservationInput(body: Partial<CreateReservationInput>) {
  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const email = body.email?.trim();
  const date = body.date?.trim();
  const time = body.time?.trim();
  const guestCount = Number(body.guestCount);
  const comment = body.comment?.trim() || null;

  if (!name || !phone || !email || !date || !time) {
    return { ok: false as const, error: "Alla obligatoriska fält måste fyllas i." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false as const, error: "Ogiltigt datum." };
  }

  if (!/^\d{2}:\d{2}$/.test(time)) {
    return { ok: false as const, error: "Ogiltig tid." };
  }

  if (!isValidGuestCount(guestCount)) {
    return {
      ok: false as const,
      error: "Antal gäster måste vara mellan 1 och 50.",
    };
  }

  if (!isTimeSlotAvailable(date, time)) {
    return { ok: false as const, error: "Den valda tiden är inte tillgänglig." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, error: "Ogiltig e-postadress." };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(`${date}T00:00:00`);
  if (selected < today) {
    return { ok: false as const, error: "Datumet kan inte ligga i det förflutna." };
  }

  return {
    ok: true as const,
    data: { name, phone, email, guestCount, date, time, comment },
  };
}
