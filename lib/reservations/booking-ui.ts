export const RESERVATION_OPEN_TIME = "13:00";
export const RESERVATION_SLOT_INTERVAL_MIN = 30;
export const RESERVATION_MIN_GUESTS = 1;
export const RESERVATION_MAX_GUESTS = 50;

/** dayOfWeek: 0 = Sunday … 6 = Saturday (matches JS Date.getDay()) */
export const RESERVATION_CLOSING_BY_DAY: Record<number, string> = {
  0: "21:00", // Sunday
  1: "21:00", // Monday
  2: "22:00", // Tuesday
  3: "22:00", // Wednesday
  4: "22:00", // Thursday
  5: "23:00", // Friday
  6: "23:00", // Saturday
};

export const RESERVATION_GUEST_CARD_OPTIONS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, "10+",
] as const;

export type ReservationGuestCardOption =
  (typeof RESERVATION_GUEST_CARD_OPTIONS)[number];

export function guestCardToCount(option: ReservationGuestCardOption): number {
  return option === "10+" ? 10 : option;
}

export function isGuestCardSelected(
  option: ReservationGuestCardOption,
  guestCount: number
): boolean {
  if (option === "10+") return guestCount >= 10;
  return guestCount === option;
}
export const RESERVATION_STEPS = [
  { id: 1, label: "Datum" },
  { id: 2, label: "Tid" },
  { id: 3, label: "Gäster" },
  { id: 4, label: "Uppgifter" },
  { id: 5, label: "Bekräfta" },
] as const;

export type ReservationStep = (typeof RESERVATION_STEPS)[number]["id"];

export type ReservationDateOption = {
  value: string;
  primaryLabel: string;
  secondaryLabel: string;
  badge?: "today" | "tomorrow";
};

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDayOfWeekFromDate(date: string): number {
  return new Date(`${date}T12:00:00`).getDay();
}

export function getClosingTimeForDate(date: string): string | null {
  if (!date) return null;
  return RESERVATION_CLOSING_BY_DAY[getDayOfWeekFromDate(date)] ?? null;
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatMinutesAsTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function getReservationTimeSlots(
  date: string,
  openTime = RESERVATION_OPEN_TIME
): string[] {
  const closeTime = getClosingTimeForDate(date);
  if (!closeTime) return [];

  const start = parseTimeToMinutes(openTime);
  const end = parseTimeToMinutes(closeTime);
  const slots: string[] = [];

  for (let minutes = start; minutes <= end; minutes += RESERVATION_SLOT_INTERVAL_MIN) {
    slots.push(formatMinutesAsTime(minutes));
  }

  return slots;
}

export function getReservationDateOptions(
  count = 8,
  now = new Date()
): ReservationDateOption[] {
  const options: ReservationDateOption[] = [];

  for (let i = 0; i < count; i++) {
    const day = new Date(now);
    day.setHours(12, 0, 0, 0);
    day.setDate(now.getDate() + i);

    const value = toLocalDateString(day);
    let primaryLabel: string;
    let badge: ReservationDateOption["badge"];

    if (i === 0) {
      primaryLabel = "Idag";
      badge = "today";
    } else if (i === 1) {
      primaryLabel = "Imorgon";
      badge = "tomorrow";
    } else {
      primaryLabel = day
        .toLocaleDateString("sv-SE", { weekday: "long" })
        .replace(/^\w/, (c) => c.toUpperCase());
    }

    const secondaryLabel = day.toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "long",
    });

    options.push({ value, primaryLabel, secondaryLabel, badge });
  }

  return options;
}

export function formatCompactDate(date: string): string {
  if (!date) return "—";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function isTimeSlotAvailable(
  date: string,
  time: string,
  now = new Date()
): boolean {
  if (!date || !time) return false;

  const slots = getReservationTimeSlots(date);
  if (!slots.includes(time)) return false;

  const today = toLocalDateString(now);
  if (date !== today) return true;

  const [hours, minutes] = time.split(":").map(Number);
  const slot = new Date(now);
  slot.setHours(hours, minutes, 0, 0);

  const cutoff = new Date(
    now.getTime() + RESERVATION_SLOT_INTERVAL_MIN * 60 * 1000
  );
  return slot >= cutoff;
}

export function formatReservationSummaryDate(date: string): string {
  if (!date) return "—";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function clampGuestCount(value: number): number {
  return Math.min(
    RESERVATION_MAX_GUESTS,
    Math.max(RESERVATION_MIN_GUESTS, value)
  );
}

export function isValidGuestCount(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= RESERVATION_MIN_GUESTS &&
    value <= RESERVATION_MAX_GUESTS
  );
}

export function formatGuestSummary(count: number): string {
  if (count < 1) return "—";
  return count === 1 ? "1 gäst" : `${count} gäster`;
}

export function formatReservationHoursForDate(date: string): string {
  const close = getClosingTimeForDate(date);
  if (!close) return "—";
  return `${RESERVATION_OPEN_TIME}–${close}`;
}
