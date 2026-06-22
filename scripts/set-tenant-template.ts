import { prisma } from "@/lib/prisma";
import type { TenantTemplateId } from "@/lib/tenant/templates";

const slug = process.argv[2];
const templateId = process.argv[3] as TenantTemplateId;

if (!slug || !templateId) {
  console.error("Usage: npx tsx scripts/set-tenant-template.ts <slug> <templateId>");
  process.exit(1);
}

async function main() {
  const tenant = await prisma.tenant.update({
    where: { slug },
    data: { templateId },
    select: { slug: true, name: true, templateId: true },
  });
  console.log("Updated:", tenant);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
