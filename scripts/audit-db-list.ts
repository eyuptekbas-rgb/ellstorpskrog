import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    include: {
      settings: { select: { restaurantName: true, email: true, phone: true } },
      _count: {
        select: {
          users: true,
          orders: true,
          reservations: true,
          categories: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tenantId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const tenantMap = new Map(tenants.map((t) => [t.id, t]));

  console.log("=== TENANTS (" + tenants.length + ") ===");
  for (const t of tenants) {
    console.log(
      JSON.stringify({
        id: t.id,
        slug: t.slug,
        name: t.name,
        active: t.active,
        templateId: t.templateId,
        restaurantName: t.settings?.restaurantName,
        counts: t._count,
        createdAt: t.createdAt.toISOString(),
      })
    );
  }

  console.log("\n=== USERS (" + users.length + ") ===");
  for (const u of users) {
    const tenant = u.tenantId ? tenantMap.get(u.tenantId) : null;
    console.log(
      JSON.stringify({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        tenantSlug: tenant?.slug ?? null,
        tenantName: tenant?.name ?? null,
        createdAt: u.createdAt.toISOString(),
      })
    );
  }

  const orderCount = await prisma.order.count();
  const reservationCount = await prisma.reservation.count();
  console.log("\n=== TOTALS ===");
  console.log("Orders:", orderCount);
  console.log("Reservations:", reservationCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
