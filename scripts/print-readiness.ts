import { getSystemStatus } from "../lib/system/status";
import { prisma } from "../lib/prisma";

async function main() {
  const slug = process.env.DEFAULT_TENANT_SLUG ?? "ellstorps-krog";
  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
  if (!tenant) throw new Error(`Default tenant "${slug}" not found`);
  const status = await getSystemStatus(tenant.id);
  console.log(JSON.stringify({
    overall: status.readinessPercent,
    stripe: status.stripeReadinessPercent,
    email: status.emailReadinessPercent,
    missingEnvVars: status.missingEnvVars,
    launchBlockers: status.launchBlockers,
  }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
