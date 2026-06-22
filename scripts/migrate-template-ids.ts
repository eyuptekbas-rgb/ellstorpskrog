import { prisma } from "@/lib/prisma";
import { LEGACY_TEMPLATE_MAP, migrateTemplateId } from "@/lib/tenant/templates";

async function main() {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, slug: true, templateId: true },
  });

  for (const tenant of tenants) {
    const next = migrateTemplateId(tenant.templateId);
    if (next !== tenant.templateId) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { templateId: next },
      });
      console.log(`${tenant.slug}: ${tenant.templateId} → ${next}`);
    } else {
      console.log(`${tenant.slug}: ${tenant.templateId} (ok)`);
    }
  }

  console.log("Legacy map:", LEGACY_TEMPLATE_MAP);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
