import { OrderStatus, PaymentStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  CustomerVipLevel,
  type CustomerDashboardStats,
  type CustomerListItem,
  type CustomerProfileDetail,
  type CustomerTag,
  type CustomerTimelineEvent,
  normalizeEmail,
  normalizePhone,
  parseCustomerTags,
  vipLevelFromSpend,
} from "@/lib/customers/crm";

type Identity = {
  email: string;
  phone: string | null;
  name: string;
  userId: string | null;
  address: string | null;
};

async function collectIdentities(tenantId: string): Promise<Map<string, Identity>> {
  const map = new Map<string, Identity>();

  const [orders, reservations, users] = await Promise.all([
    prisma.order.findMany({
      where: { tenantId },
      select: {
        customerEmail: true,
        customerPhone: true,
        customerName: true,
        customerAddress: true,
        userId: true,
      },
      distinct: ["customerEmail"],
    }),
    prisma.reservation.findMany({
      where: { tenantId },
      select: { email: true, phone: true, name: true, userId: true },
      distinct: ["email"],
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { tenantId },
          { orders: { some: { tenantId } } },
          { reservations: { some: { tenantId } } },
        ],
        role: "CUSTOMER",
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        address: true,
        postalCode: true,
        city: true,
      },
    }),
  ]);

  const upsert = (raw: {
    email: string;
    phone?: string | null;
    name?: string;
    userId?: string | null;
    address?: string | null;
  }) => {
    const email = normalizeEmail(raw.email);
    if (!email) return;
    const existing = map.get(email);
    const phone = raw.phone?.trim() || existing?.phone || null;
    const name = raw.name?.trim() || existing?.name || email.split("@")[0];
    map.set(email, {
      email,
      phone,
      name,
      userId: raw.userId ?? existing?.userId ?? null,
      address: raw.address ?? existing?.address ?? null,
    });
  };

  for (const o of orders) {
    upsert({
      email: o.customerEmail,
      phone: o.customerPhone,
      name: o.customerName,
      userId: o.userId,
      address: o.customerAddress,
    });
  }
  for (const r of reservations) {
    upsert({
      email: r.email,
      phone: r.phone,
      name: r.name,
      userId: r.userId,
    });
  }
  for (const u of users) {
    const address = [u.address, u.postalCode, u.city].filter(Boolean).join(", ") || null;
    upsert({
      email: u.email,
      phone: u.phone,
      name: u.name,
      userId: u.id,
      address,
    });
  }

  return map;
}

async function syncProfiles(tenantId: string, identities: Map<string, Identity>) {
  const existing = await prisma.customerCrmProfile.findMany({
    where: { tenantId },
  });
  const byEmail = new Map(existing.map((p) => [normalizeEmail(p.email), p]));

  for (const identity of identities.values()) {
    const current = byEmail.get(identity.email);
    if (current) {
      if (
        (identity.userId && !current.userId) ||
        (identity.name && current.name !== identity.name) ||
        (identity.phone && current.phone !== identity.phone)
      ) {
        await prisma.customerCrmProfile.update({
          where: { id: current.id },
          data: {
            userId: identity.userId ?? current.userId,
            name: identity.name ?? current.name,
            phone: identity.phone ?? current.phone,
            address: identity.address ?? current.address,
          },
        });
      }
      continue;
    }

    let loyaltyPoints = 0;
    if (identity.userId) {
      const user = await prisma.user.findUnique({
        where: { id: identity.userId },
        select: { loyaltyPoints: true },
      });
      loyaltyPoints = user?.loyaltyPoints ?? 0;
    }

    await prisma.customerCrmProfile.create({
      data: {
        tenantId,
        userId: identity.userId,
        email: identity.email,
        phone: identity.phone,
        name: identity.name,
        address: identity.address,
        loyaltyPoints,
      },
    });
  }
}

function customerOrderWhere(
  tenantId: string,
  email: string,
  userId: string | null
): Prisma.OrderWhereInput {
  const or: Prisma.OrderWhereInput[] = [
    { customerEmail: { equals: email, mode: "insensitive" } },
  ];
  if (userId) or.push({ userId });
  return { tenantId, OR: or };
}

async function computeOrderStats(
  tenantId: string,
  email: string,
  userId: string | null
) {
  const where = customerOrderWhere(tenantId, email, userId);
  const [orders, items] = await Promise.all([
    prisma.order.findMany({
      where,
      select: { total: true, status: true, paymentStatus: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.orderItem.findMany({
      where: { order: where },
      select: {
        productName: true,
        quantity: true,
        productId: true,
      },
    }),
  ]);

  const valid = orders.filter(
    (o) =>
      o.status !== OrderStatus.CANCELLED &&
      o.paymentStatus !== PaymentStatus.FAILED
  );
  const totalSpent = valid.reduce((s, o) => s + o.total, 0);
  const totalOrders = valid.length;

  const dishCounts = new Map<string, number>();
  for (const item of items) {
    dishCounts.set(item.productName, (dishCounts.get(item.productName) ?? 0) + item.quantity);
  }
  const favouriteDishes = [...dishCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))] as string[];
  let favouriteCategory: string | null = null;
  if (productIds.length > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, category: { select: { name: true } } },
    });
    const catCounts = new Map<string, number>();
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (product?.category.name) {
        catCounts.set(
          product.category.name,
          (catCounts.get(product.category.name) ?? 0) + item.quantity
        );
      }
    }
    favouriteCategory =
      [...catCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }

  return {
    totalOrders,
    totalSpent,
    averageOrder: totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0,
    firstOrderAt: valid[0]?.createdAt.toISOString() ?? null,
    lastOrderAt: valid[valid.length - 1]?.createdAt.toISOString() ?? null,
    favouriteDishes,
    favouriteCategory,
  };
}

async function buildListItem(
  tenantId: string,
  profile: {
    id: string;
    email: string;
    phone: string | null;
    name: string | null;
    userId: string | null;
    loyaltyPoints: number;
    vipLevel: string;
    vipOverride: boolean;
    tags: unknown;
  }
): Promise<CustomerListItem> {
  const stats = await computeOrderStats(tenantId, profile.email, profile.userId);
  const vipLevel = profile.vipOverride
    ? (profile.vipLevel as CustomerVipLevel)
    : vipLevelFromSpend(stats.totalSpent);

  return {
    id: profile.id,
    name: profile.name ?? profile.email,
    email: profile.email,
    phone: profile.phone,
    totalOrders: stats.totalOrders,
    totalSpent: stats.totalSpent,
    loyaltyPoints: profile.loyaltyPoints,
    vipLevel,
    tags: parseCustomerTags(profile.tags),
    lastOrderAt: stats.lastOrderAt,
    isReturning: stats.totalOrders > 1,
  };
}

export async function listCustomers(
  tenantId: string,
  search?: string
): Promise<{ customers: CustomerListItem[]; stats: CustomerDashboardStats }> {
  const identities = await collectIdentities(tenantId);
  await syncProfiles(tenantId, identities);

  const profiles = await prisma.customerCrmProfile.findMany({
    where: {
      tenantId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  const customers = await Promise.all(profiles.map((p) => buildListItem(tenantId, p)));
  customers.sort((a, b) => b.totalSpent - a.totalSpent);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const newToday = profiles.filter((p) => p.createdAt >= todayStart).length;
  const returning = customers.filter((c) => c.isReturning).length;
  const vipCount = customers.filter(
    (c) => c.vipLevel === CustomerVipLevel.VIP || c.tags.includes("VIP")
  ).length;

  return {
    customers,
    stats: {
      newToday,
      returning,
      vipCount,
      topCustomers: customers.slice(0, 5),
    },
  };
}

export async function getCustomerProfile(
  tenantId: string,
  profileId: string
): Promise<CustomerProfileDetail | null> {
  const profile = await prisma.customerCrmProfile.findFirst({
    where: { id: profileId, tenantId },
    include: {
      adminNotes: { orderBy: { updatedAt: "desc" } },
      loyaltyEvents: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!profile) return null;

  const orderStats = await computeOrderStats(tenantId, profile.email, profile.userId);
  const vipLevel = profile.vipOverride
    ? (profile.vipLevel as CustomerVipLevel)
    : vipLevelFromSpend(orderStats.totalSpent);

  const reservations = await prisma.reservation.findMany({
    where: {
      tenantId,
      OR: [
        { email: { equals: profile.email, mode: "insensitive" } },
        ...(profile.phone
          ? [{ phone: { contains: normalizePhone(profile.phone) } }]
          : []),
        ...(profile.userId ? [{ userId: profile.userId }] : []),
      ],
    },
    orderBy: [{ date: "desc" }, { time: "desc" }],
    take: 20,
  });

  const orders = await prisma.order.findMany({
    where: customerOrderWhere(tenantId, profile.email, profile.userId),
    include: {
      payments: { select: { id: true, amount: true, status: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const timeline: CustomerTimelineEvent[] = [];

  for (const order of orders) {
    timeline.push({
      id: `order-${order.id}`,
      type: "order",
      title: `Order ${order.orderNumber}`,
      subtitle: order.status,
      amount: order.total,
      at: order.createdAt.toISOString(),
    });
    for (const payment of order.payments) {
      timeline.push({
        id: `payment-${payment.id}`,
        type: "payment",
        title: "Betalning",
        subtitle: payment.status,
        amount: Number(payment.amount),
        at: payment.createdAt.toISOString(),
      });
    }
  }

  for (const reservation of reservations) {
    timeline.push({
      id: `reservation-${reservation.id}`,
      type: "reservation",
      title: `Reservation ${reservation.date} ${reservation.time}`,
      subtitle: `${reservation.guestCount} gäster · ${reservation.status}`,
      at: reservation.createdAt.toISOString(),
    });
  }

  for (const note of profile.adminNotes) {
    timeline.push({
      id: `note-${note.id}`,
      type: "note",
      title: "Adminanteckning",
      subtitle: note.body.slice(0, 80),
      at: note.createdAt.toISOString(),
    });
  }

  for (const event of profile.loyaltyEvents) {
    timeline.push({
      id: `loyalty-${event.id}`,
      type: "loyalty",
      title: event.pointsDelta >= 0 ? "Poäng tillagda" : "Poäng avdrag",
      subtitle: event.reason,
      amount: event.pointsDelta,
      at: event.createdAt.toISOString(),
    });
  }

  timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return {
    id: profile.id,
    userId: profile.userId,
    name: profile.name ?? profile.email,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
    tags: parseCustomerTags(profile.tags),
    vipLevel,
    vipOverride: profile.vipOverride,
    loyaltyPoints: profile.loyaltyPoints,
    lifetimeSpend: orderStats.totalSpent,
    totalOrders: orderStats.totalOrders,
    averageOrder: orderStats.averageOrder,
    firstOrderAt: orderStats.firstOrderAt,
    lastOrderAt: orderStats.lastOrderAt,
    favouriteDishes: orderStats.favouriteDishes,
    favouriteCategory: orderStats.favouriteCategory,
    reservationCount: reservations.length,
    lastReservationAt: reservations[0]
      ? `${reservations[0].date}T${reservations[0].time}:00`
      : null,
    reservations: reservations.map((r) => ({
      id: r.id,
      date: r.date,
      time: r.time,
      guestCount: r.guestCount,
      status: r.status,
    })),
    adminNotes: profile.adminNotes.map((n) => ({
      id: n.id,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
    loyaltyEvents: profile.loyaltyEvents.map((e) => ({
      id: e.id,
      pointsDelta: e.pointsDelta,
      reason: e.reason,
      createdBy: e.createdBy,
      createdAt: e.createdAt.toISOString(),
    })),
    timeline,
  };
}

export async function updateCustomerProfile(
  tenantId: string,
  profileId: string,
  data: {
    tags?: CustomerTag[];
    vipLevel?: CustomerVipLevel;
    vipOverride?: boolean;
  }
) {
  const profile = await prisma.customerCrmProfile.findFirst({
    where: { id: profileId, tenantId },
  });
  if (!profile) return null;

  return prisma.customerCrmProfile.update({
    where: { id: profileId },
    data: {
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.vipLevel !== undefined
        ? { vipLevel: data.vipLevel, vipOverride: true }
        : {}),
      ...(data.vipOverride !== undefined ? { vipOverride: data.vipOverride } : {}),
    },
  });
}

export async function adjustLoyaltyPoints(
  tenantId: string,
  profileId: string,
  pointsDelta: number,
  reason: string,
  createdBy?: string
) {
  const profile = await prisma.customerCrmProfile.findFirst({
    where: { id: profileId, tenantId },
  });
  if (!profile) return null;

  const nextPoints = Math.max(0, profile.loyaltyPoints + pointsDelta);

  return prisma.$transaction(async (tx) => {
    await tx.customerCrmProfile.update({
      where: { id: profileId },
      data: { loyaltyPoints: nextPoints },
    });
    const event = await tx.loyaltyEvent.create({
      data: { profileId, pointsDelta, reason, createdBy: createdBy ?? null },
    });
    if (profile.userId) {
      await tx.user.update({
        where: { id: profile.userId },
        data: { loyaltyPoints: nextPoints },
      });
    }
    return { loyaltyPoints: nextPoints, event };
  });
}

export async function createAdminNote(
  tenantId: string,
  profileId: string,
  body: string
) {
  const profile = await prisma.customerCrmProfile.findFirst({
    where: { id: profileId, tenantId },
  });
  if (!profile) return null;

  return prisma.customerAdminNote.create({
    data: { profileId, body: body.trim() },
  });
}

export async function updateAdminNote(
  tenantId: string,
  noteId: string,
  body: string
) {
  const note = await prisma.customerAdminNote.findFirst({
    where: { id: noteId, profile: { tenantId } },
  });
  if (!note) return null;

  return prisma.customerAdminNote.update({
    where: { id: noteId },
    data: { body: body.trim() },
  });
}

export async function deleteAdminNote(tenantId: string, noteId: string) {
  const note = await prisma.customerAdminNote.findFirst({
    where: { id: noteId, profile: { tenantId } },
  });
  if (!note) return false;

  await prisma.customerAdminNote.delete({ where: { id: noteId } });
  return true;
}
