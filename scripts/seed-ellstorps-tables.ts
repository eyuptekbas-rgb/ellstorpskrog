import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const tables = [4, 4, 4, 6, 6, 6, 4, 4];

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: "ellstorps-krog" },
    select: { id: true },
  });
  if (!tenant) throw new Error("Tenant ellstorps-krog not found");

  await prisma.$transaction(async (tx) => {
    const existing = await tx.restaurantTable.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true },
    });
    const byNumber = new Map(
      existing
        .map((table) => [table.name.match(/(\d+)$/)?.[1], table.id] as const)
        .filter((entry): entry is [string, string] => Boolean(entry[0]))
    );
    const currentCount = existing.length;

    for (let index = 0; index < tables.length; index += 1) {
      const number = String(index + 1);
      const data = { capacity: tables[index], sortOrder: index };
      const id = byNumber.get(number);
      if (id) {
        await tx.restaurantTable.update({ where: { id }, data });
      } else {
        await tx.restaurantTable.create({
          data: { tenantId: tenant.id, name: `Bord ${number}`, ...data },
        });
      }
    }
    if (currentCount > 8) {
      console.warn(`Tenant already has ${currentCount} tables; preserved extras.`);
    }
  });

  const result = await prisma.restaurantTable.findMany({
    where: { tenantId: tenant.id },
    orderBy: { sortOrder: "asc" },
    select: { name: true, capacity: true },
  });
  console.log(JSON.stringify(result));
}

main().finally(() => prisma.$disconnect());
