/**
 * Ensures the default admin user exists with a password hash.
 * Safe to run on existing databases without wiping data.
 *
 * Usage: npx tsx scripts/ensure-admin.ts
 */
import { UserRole } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { prisma } from "../lib/prisma";

const ADMIN_EMAIL = "admin@ellstorpskrog.se";

async function main() {
  const password =
    process.env.ADMIN_INITIAL_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await hashPassword(password);

  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: {
        role: UserRole.ADMIN,
        passwordHash,
        name: existing.name || "Admin",
      },
    });
    console.log(`Updated admin password for ${ADMIN_EMAIL}`);
  } else {
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: "Admin",
        phone: "+46 40 18 42 68",
        role: UserRole.ADMIN,
        passwordHash,
      },
    });
    console.log(`Created admin user ${ADMIN_EMAIL}`);
  }

  if (!process.env.ADMIN_INITIAL_PASSWORD) {
    console.log("Password: ChangeMe123! (set ADMIN_INITIAL_PASSWORD to override)");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
