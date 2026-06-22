import { auth } from "@/auth";
import { resolveAdminTenantId } from "@/lib/tenant/resolve";

export async function requireAdminTenantId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  try {
    return await resolveAdminTenantId(
      session.user.role,
      session.user.tenantId ?? null
    );
  } catch (error) {
    if (error instanceof Error && error.message === "NO_TENANT_SELECTED") {
      throw new Error("NO_TENANT_SELECTED");
    }
    throw error;
  }
}

export async function requirePlatformAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PLATFORM_ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
  return session.user;
}
