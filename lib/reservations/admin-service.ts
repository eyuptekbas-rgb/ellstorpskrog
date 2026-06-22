import { ReservationStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  computeTableStats,
  formatDateKey,
  reservationDateRangeWhere,
  type AdminReservationRow,
  type AdminTableRow,
  type ReservationAdminStats,
  type ReservationDateRange,
} from "@/lib/reservations/admin";

const tableSelect = {
  id: true,
  name: true,
  capacity: true,
  mergeGroupId: true,
  sortOrder: true,
  active: true,
} as const;

const reservationInclude = {
  table: { select: tableSelect },
} as const;

function serializeReservation(
  row: Prisma.ReservationGetPayload<{ include: typeof reservationInclude }>
): AdminReservationRow {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    guestCount: row.guestCount,
    date: row.date,
    time: row.time,
    comment: row.comment,
    status: row.status,
    tableId: row.tableId,
    createdAt: row.createdAt.toISOString(),
    table: row.table,
  };
}

export type ReservationAdminBundle = {
  reservations: AdminReservationRow[];
  tables: AdminTableRow[];
  stats: ReservationAdminStats;
};

export async function getReservationAdminBundle(
  tenantId: string,
  options: {
    range?: ReservationDateRange;
    search?: string;
  } = {}
): Promise<ReservationAdminBundle> {
  const range = options.range ?? "week";
  const search = options.search?.trim();
  const dateWhere = reservationDateRangeWhere(range);
  const todayKey = formatDateKey(new Date());

  const searchWhere: Prisma.ReservationWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [reservations, tables, todayReservations] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        tenantId,
        ...dateWhere,
        ...searchWhere,
      },
      include: reservationInclude,
      orderBy: [{ date: "asc" }, { time: "asc" }, { createdAt: "desc" }],
    }),
    prisma.restaurantTable.findMany({
      where: { tenantId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: tableSelect,
    }),
    prisma.reservation.findMany({
      where: { tenantId, date: todayKey },
      include: reservationInclude,
      orderBy: [{ time: "asc" }],
    }),
  ]);

  const serialized = reservations.map(serializeReservation);
  const serializedTables = tables as AdminTableRow[];
  const stats = computeTableStats(
    serializedTables,
    todayReservations.map(serializeReservation),
    todayKey
  );

  return {
    reservations: serialized,
    tables: serializedTables,
    stats,
  };
}

export async function listRestaurantTables(tenantId: string): Promise<AdminTableRow[]> {
  return prisma.restaurantTable.findMany({
    where: { tenantId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: tableSelect,
  });
}

export async function createRestaurantTable(
  tenantId: string,
  data: { name: string; capacity: number }
): Promise<AdminTableRow> {
  const count = await prisma.restaurantTable.count({ where: { tenantId } });
  return prisma.restaurantTable.create({
    data: {
      tenantId,
      name: data.name.trim(),
      capacity: data.capacity,
      sortOrder: count,
    },
    select: tableSelect,
  });
}

export async function updateRestaurantTable(
  tenantId: string,
  id: string,
  data: Partial<{
    name: string;
    capacity: number;
    active: boolean;
    mergeGroupId: string | null;
    sortOrder: number;
  }>
): Promise<AdminTableRow | null> {
  const existing = await prisma.restaurantTable.findFirst({
    where: { id, tenantId },
  });
  if (!existing) return null;

  return prisma.restaurantTable.update({
    where: { id },
    data,
    select: tableSelect,
  });
}

export async function mergeRestaurantTables(
  tenantId: string,
  tableIds: string[]
): Promise<AdminTableRow[]> {
  const uniqueIds = [...new Set(tableIds)];
  if (uniqueIds.length < 2) {
    throw new Error("MERGE_MIN_TWO");
  }

  const tables = await prisma.restaurantTable.findMany({
    where: { tenantId, id: { in: uniqueIds } },
    select: tableSelect,
  });

  if (tables.length !== uniqueIds.length) {
    throw new Error("TABLE_NOT_FOUND");
  }

  const mergeGroupId = crypto.randomUUID();
  await prisma.restaurantTable.updateMany({
    where: { tenantId, id: { in: uniqueIds } },
    data: { mergeGroupId },
  });

  return prisma.restaurantTable.findMany({
    where: { tenantId, id: { in: uniqueIds } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: tableSelect,
  });
}

export async function assignReservationTable(
  tenantId: string,
  reservationId: string,
  tableId: string | null
): Promise<AdminReservationRow | null> {
  const existing = await prisma.reservation.findFirst({
    where: { id: reservationId, tenantId },
  });
  if (!existing) return null;

  if (tableId) {
    const table = await prisma.restaurantTable.findFirst({
      where: { id: tableId, tenantId, active: true },
    });
    if (!table) return null;
  }

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: { tableId },
    include: reservationInclude,
  });

  return serializeReservation(updated);
}

export async function updateReservationStatus(
  tenantId: string,
  reservationId: string,
  status: ReservationStatus
): Promise<AdminReservationRow | null> {
  const existing = await prisma.reservation.findFirst({
    where: { id: reservationId, tenantId },
  });
  if (!existing) return null;

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status },
    include: reservationInclude,
  });

  return serializeReservation(updated);
}
