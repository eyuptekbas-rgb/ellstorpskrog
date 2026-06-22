import { ReservationStatus } from "@prisma/client";

export const RESERVATION_POLL_INTERVAL_MS = 12_000;

export type ReservationDateRange = "today" | "tomorrow" | "week" | "all";

export const RESERVATION_DATE_RANGES: {
  key: ReservationDateRange;
  label: string;
}[] = [
  { key: "today", label: "Idag" },
  { key: "tomorrow", label: "Imorgon" },
  { key: "week", label: "Denna vecka" },
  { key: "all", label: "Alla" },
];

export const ADMIN_RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  NEW: "Väntar",
  CONFIRMED: "Bekräftad",
  SEATED: "Placerad",
  COMPLETED: "Avslutad",
  NO_SHOW: "Utebliven",
  CANCELLED: "Avbokad",
};

export type ReservationAction = {
  key: string;
  label: string;
  status: ReservationStatus;
  tone?: "primary" | "danger" | "neutral";
};

export function getReservationActions(
  status: ReservationStatus
): ReservationAction[] {
  switch (status) {
    case ReservationStatus.NEW:
      return [
        {
          key: "confirm",
          label: "Bekräfta",
          status: ReservationStatus.CONFIRMED,
          tone: "primary",
        },
        {
          key: "cancel",
          label: "Avboka",
          status: ReservationStatus.CANCELLED,
          tone: "danger",
        },
      ];
    case ReservationStatus.CONFIRMED:
      return [
        {
          key: "seat",
          label: "Placera gäster",
          status: ReservationStatus.SEATED,
          tone: "primary",
        },
        {
          key: "no-show",
          label: "Utebliven",
          status: ReservationStatus.NO_SHOW,
          tone: "neutral",
        },
        {
          key: "cancel",
          label: "Avboka",
          status: ReservationStatus.CANCELLED,
          tone: "danger",
        },
      ];
    case ReservationStatus.SEATED:
      return [
        {
          key: "complete",
          label: "Avsluta",
          status: ReservationStatus.COMPLETED,
          tone: "primary",
        },
        {
          key: "cancel",
          label: "Avboka",
          status: ReservationStatus.CANCELLED,
          tone: "danger",
        },
      ];
    default:
      return [];
  }
}

export function adminReservationStatusStyle(status: ReservationStatus): string {
  switch (status) {
    case ReservationStatus.NEW:
      return "bg-[#b85c38]/15 text-[#e8c4a8] ring-[#b85c38]/30";
    case ReservationStatus.CONFIRMED:
      return "bg-blue-500/15 text-blue-200 ring-blue-500/25";
    case ReservationStatus.SEATED:
      return "bg-emerald-500/15 text-emerald-200 ring-emerald-500/25";
    case ReservationStatus.COMPLETED:
      return "bg-white/8 text-white/55 ring-white/10";
    case ReservationStatus.NO_SHOW:
      return "bg-amber-500/15 text-amber-200 ring-amber-500/25";
    case ReservationStatus.CANCELLED:
      return "bg-red-500/10 text-red-300/80 ring-red-500/20";
    default:
      return "bg-white/5 text-white/60 ring-white/10";
  }
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const parsed = new Date(`${dateKey}T12:00:00`);
  parsed.setDate(parsed.getDate() + days);
  return formatDateKey(parsed);
}

export function reservationDateRangeWhere(
  range: ReservationDateRange
): { date?: string | { gte: string; lte: string } } {
  const today = formatDateKey(new Date());

  switch (range) {
    case "today":
      return { date: today };
    case "tomorrow":
      return { date: addDaysToDateKey(today, 1) };
    case "week":
      return { date: { gte: today, lte: addDaysToDateKey(today, 6) } };
    default:
      return {};
  }
}

export function parseReservationDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export function isUpcomingArrival(
  date: string,
  time: string,
  withinMinutes = 120
): boolean {
  const slot = parseReservationDateTime(date, time);
  const now = new Date();
  const diffMs = slot.getTime() - now.getTime();
  return diffMs >= 0 && diffMs <= withinMinutes * 60_000;
}

export function isReminderWindow(
  date: string,
  time: string,
  withinMinutes = 60
): boolean {
  return isUpcomingArrival(date, time, withinMinutes);
}

export type AdminTableRow = {
  id: string;
  name: string;
  capacity: number;
  mergeGroupId: string | null;
  sortOrder: number;
  active: boolean;
};

export type AdminReservationRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  guestCount: number;
  date: string;
  time: string;
  comment: string | null;
  status: ReservationStatus;
  tableId: string | null;
  createdAt: string;
  table: AdminTableRow | null;
};

export type ReservationAdminStats = {
  todayCount: number;
  availableTables: number;
  occupiedTables: number;
  upcomingArrivals: number;
  totalCapacity: number;
  totalTables: number;
};

const OCCUPIED_STATUSES: ReservationStatus[] = [
  ReservationStatus.CONFIRMED,
  ReservationStatus.SEATED,
];

export function computeTableStats(
  tables: AdminTableRow[],
  reservations: AdminReservationRow[],
  todayKey: string
): ReservationAdminStats {
  const activeTables = tables.filter((t) => t.active);
  const groups = new Map<string, AdminTableRow[]>();

  for (const table of activeTables) {
    const key = table.mergeGroupId ?? table.id;
    const list = groups.get(key) ?? [];
    list.push(table);
    groups.set(key, list);
  }

  const totalTables = groups.size;
  const totalCapacity = [...groups.values()].reduce(
    (sum, group) => sum + group.reduce((g, t) => g + t.capacity, 0),
    0
  );

  const todayActive = reservations.filter(
    (r) =>
      r.date === todayKey &&
      OCCUPIED_STATUSES.includes(r.status) &&
      r.tableId
  );

  const occupiedGroupKeys = new Set<string>();
  for (const reservation of todayActive) {
    const table = activeTables.find((t) => t.id === reservation.tableId);
    if (table) {
      occupiedGroupKeys.add(table.mergeGroupId ?? table.id);
    }
  }

  const todayCount = reservations.filter((r) => r.date === todayKey).length;
  const upcomingArrivals = reservations.filter(
    (r) =>
      r.date === todayKey &&
      (r.status === ReservationStatus.NEW ||
        r.status === ReservationStatus.CONFIRMED) &&
      isUpcomingArrival(r.date, r.time)
  ).length;

  return {
    todayCount,
    availableTables: Math.max(0, totalTables - occupiedGroupKeys.size),
    occupiedTables: occupiedGroupKeys.size,
    upcomingArrivals,
    totalCapacity,
    totalTables,
  };
}

export function groupTablesByMerge(tables: AdminTableRow[]): AdminTableRow[][] {
  const groups = new Map<string, AdminTableRow[]>();
  for (const table of tables) {
    const key = table.mergeGroupId ?? table.id;
    const list = groups.get(key) ?? [];
    list.push(table);
    groups.set(key, list);
  }
  return [...groups.values()].map((group) =>
    group.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  );
}

export function mergedTableLabel(group: AdminTableRow[]): string {
  return group.map((t) => t.name).join(" + ");
}

export function mergedTableCapacity(group: AdminTableRow[]): number {
  return group.reduce((sum, t) => sum + t.capacity, 0);
}
