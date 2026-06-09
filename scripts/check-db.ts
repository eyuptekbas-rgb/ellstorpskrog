import { checkDatabaseConnection } from "../lib/db/errors";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Checking DATABASE_URL...");
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not set in .env");
    process.exit(1);
  }
  console.log("DATABASE_URL is configured.");

  const result = await checkDatabaseConnection();
  if (!result.ok) {
    console.error("ERROR: Cannot connect to database.");
    console.error(result.error);
    process.exit(1);
  }

  console.log("Connection OK.");

  const orderCount = await prisma.order.count();
  console.log(`Order table accessible. ${orderCount} orders in database.`);

  await prisma.$disconnect();
  console.log("Prisma Client is working correctly.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
