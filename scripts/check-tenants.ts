import { prisma } from "@/lib/prisma";

async function main() {
  const tenants = await prisma.tenant.findMany({
    select: { slug: true, name: true, templateId: true, primaryColor: true },
  });
  console.log(JSON.stringify(tenants, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
