import { prisma } from "../lib/prisma";
import { defaultCategoryRows } from "../lib/tenant/default-catalog";

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: { categories: { none: {} } },
    select: { id: true, name: true, slug: true },
  });

  for (const tenant of tenants) {
    await prisma.category.createMany({ data: defaultCategoryRows(tenant.id) });
    console.log(`Added default categories for ${tenant.name} (${tenant.slug})`);
  }

  if (tenants.length === 0) {
    console.log("All tenants already have categories.");
  }
}

main().finally(() => prisma.$disconnect());
