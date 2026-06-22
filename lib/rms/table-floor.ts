import type { AdminTableRow } from "@/lib/reservations/admin";
import type { ReservationStatus } from "@prisma/client";

export type TableFloorStatus = "available" | "occupied" | "reserved";

export type FloorTable = AdminTableRow & {
  floorStatus: TableFloorStatus;
  reservationGuest?: string;
  reservationTime?: string;
  orderCount?: number;
};

type ReservationLite = {
  id: string;
  tableId: string | null;
  status: ReservationStatus;
  guestName: string;
  date: string;
  time: string;
};

const OCCUPIED: ReservationStatus[] = ["CONFIRMED", "SEATED"];
const RESERVED: ReservationStatus[] = ["NEW", "CONFIRMED"];

export function computeFloorTables(
  tables: AdminTableRow[],
  reservations: ReservationLite[],
  tableOrderCounts: Record<string, number> = {}
): FloorTable[] {
  const active = tables.filter((t) => t.active);

  return active.map((table) => {
    const tableReservations = reservations.filter((r) => r.tableId === table.id);
    const seated = tableReservations.find((r) => r.status === "SEATED");
    const reserved = tableReservations.find((r) => RESERVED.includes(r.status));
    const orderCount = tableOrderCounts[table.id] ?? 0;

    let floorStatus: TableFloorStatus = "available";
    let reservationGuest: string | undefined;
    let reservationTime: string | undefined;

    if (seated || orderCount > 0) {
      floorStatus = "occupied";
      reservationGuest = seated?.guestName;
      reservationTime = seated ? `${seated.date} ${seated.time}` : undefined;
    } else if (reserved) {
      floorStatus = "reserved";
      reservationGuest = reserved.guestName;
      reservationTime = `${reserved.date} ${reserved.time}`;
    } else if (tableReservations.some((r) => OCCUPIED.includes(r.status))) {
      floorStatus = "occupied";
    }

    return {
      ...table,
      floorStatus,
      reservationGuest,
      reservationTime,
      orderCount,
    };
  });
}

export const FLOOR_STATUS_LABELS: Record<TableFloorStatus, string> = {
  available: "Ledig",
  occupied: "Upptagen",
  reserved: "Reserverad",
};

export const FLOOR_STATUS_COLORS: Record<TableFloorStatus, string> = {
  available: "border-emerald-500/35 bg-emerald-500/10",
  occupied: "border-blue-500/35 bg-blue-500/10",
  reserved: "border-amber-500/35 bg-amber-500/10",
};
