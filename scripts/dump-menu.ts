import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany({
    where: { tenant: { slug: "ellstorps-krog" } },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        orderBy: { sortOrder: "asc" },
        select: { name: true, price: true, sortOrder: true, description: true },
      },
    },
  });
  console.log(JSON.stringify(cats, null, 2));
}

main()
  .finally(() => prisma.$disconnect());
