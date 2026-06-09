import { getSystemStatus } from "../lib/system/status";

async function main() {
  const status = await getSystemStatus();
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
    const { prisma } = await import("../lib/prisma");
    await prisma.$disconnect();
  });
