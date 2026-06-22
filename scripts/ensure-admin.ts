/**
 * Ensures platform and tenant admin users exist with password hashes.
 * Safe to run on existing databases without wiping data.
 *
 * Usage: npx tsx scripts/ensure-admin.ts
 */
import { UserRole } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { prisma } from "../lib/prisma";

const PLATFORM_EMAIL = "admin@ordina.se";
const TENANT_EMAIL = "admin@ellstorpskrog.se";
const DEFAULT_TENANT_SLUG = "ellstorps-krog";

async function main() {
  const password =
    process.env.ADMIN_INITIAL_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await hashPassword(password);

  let tenant = await prisma.tenant.findUnique({
    where: { slug: DEFAULT_TENANT_SLUG },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        slug: DEFAULT_TENANT_SLUG,
        name: "Ellstorps Krog",
        primaryColor: "#b85c38",
      },
    });
    console.log(`Created tenant: ${tenant.name}`);
  }

  const platformExisting = await prisma.user.findUnique({
    where: { email: PLATFORM_EMAIL },
  });

  if (platformExisting) {
    await prisma.user.update({
      where: { email: PLATFORM_EMAIL },
      data: {
        role: UserRole.PLATFORM_ADMIN,
        passwordHash,
        tenantId: null,
        name: platformExisting.name || "Ordina Admin",
      },
    });
    console.log(`Updated platform admin password for ${PLATFORM_EMAIL}`);
  } else {
    await prisma.user.create({
      data: {
        email: PLATFORM_EMAIL,
        name: "Ordina Admin",
        role: UserRole.PLATFORM_ADMIN,
        passwordHash,
      },
    });
    console.log(`Created platform admin ${PLATFORM_EMAIL}`);
  }

  const tenantExisting = await prisma.user.findUnique({
    where: { email: TENANT_EMAIL },
  });

  if (tenantExisting) {
    await prisma.user.update({
      where: { email: TENANT_EMAIL },
      data: {
        role: UserRole.ADMIN,
        tenantId: tenant.id,
        passwordHash,
        name: tenantExisting.name || "Admin",
      },
    });
    console.log(`Updated tenant admin password for ${TENANT_EMAIL}`);
  } else {
    await prisma.user.create({
      data: {
        email: TENANT_EMAIL,
        name: "Admin",
        phone: "+46 40 18 42 68",
        role: UserRole.ADMIN,
        tenantId: tenant.id,
        passwordHash,
      },
    });
    console.log(`Created tenant admin ${TENANT_EMAIL}`);
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
