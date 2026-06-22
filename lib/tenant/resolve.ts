import { cookies, headers } from "next/headers";
import { getDbErrorMessage, isPrismaConnectionError, checkDatabaseConnection } from "@/lib/db/errors";
import { prisma } from "@/lib/prisma";
import { PUBLIC_TENANT_COOKIE } from "@/lib/tenant/public-path";

export const PUBLIC_TENANT_HEADER = "x-public-tenant-slug";
export const TENANT_COOKIE = "ordina-tenant-id";
export const DEFAULT_TENANT_SLUG = "ellstorps-krog";
export const OFFLINE_TENANT_ID = "offline";

export type TenantSummary = {
  id: string;
  slug: string;
  name: string;
  templateId: string;
  primaryColor: string;
  logo: string | null;
  active: boolean;
};

export async function getTenantBySlug(slug: string) {
  try {
    return await prisma.tenant.findUnique({ where: { slug } });
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      console.error("getTenantBySlug:", getDbErrorMessage(error));
      return null;
    }
    throw error;
  }
}

export async function getTenantById(id: string) {
  try {
    return await prisma.tenant.findUnique({ where: { id } });
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      console.error("getTenantById:", getDbErrorMessage(error));
      return null;
    }
    throw error;
  }
}

export type PlatformAdminTenantResolution =
  | { status: "valid"; tenantId: string }
  | { status: "missing" }
  | { status: "invalid" }
  | { status: "unavailable" };

/** Platform-admin tenant cookie — distinguishes missing/invalid from DB unavailable. */
export async function resolvePlatformAdminTenant(): Promise<PlatformAdminTenantResolution> {
  const cookieStore = await cookies();
  const tenantCookie = cookieStore.get(TENANT_COOKIE)?.value?.trim();
  if (!tenantCookie) {
    return { status: "missing" };
  }

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantCookie } });
    if (tenant) {
      return { status: "valid", tenantId: tenant.id };
    }

    const conn = await checkDatabaseConnection();
    if (!conn.ok) {
      console.error("resolvePlatformAdminTenant: database unavailable", conn.error);
      return { status: "unavailable" };
    }

    return { status: "invalid" };
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      console.error("resolvePlatformAdminTenant:", getDbErrorMessage(error));
      return { status: "unavailable" };
    }
    throw error;
  }
}

async function resolveSlugFromRequest(): Promise<string | null> {
  const headerStore = await headers();
  const slugFromHeader = headerStore.get(PUBLIC_TENANT_HEADER)?.trim();
  if (slugFromHeader) {
    const tenant = await getTenantBySlug(slugFromHeader);
    if (tenant?.active) return tenant.slug;
  }

  const cookieStore = await cookies();
  const slugFromCookie = cookieStore.get(PUBLIC_TENANT_COOKIE)?.value?.trim();
  if (slugFromCookie) {
    const tenant = await getTenantBySlug(slugFromCookie);
    if (tenant?.active) return tenant.slug;
  }

  return null;
}

export async function resolvePublicTenantId(): Promise<string> {
  try {
    const resolvedSlug = await resolveSlugFromRequest();
    if (resolvedSlug) {
      const tenant = await getTenantBySlug(resolvedSlug);
      if (tenant) return tenant.id;
    }

    const slug = process.env.DEFAULT_TENANT_SLUG ?? DEFAULT_TENANT_SLUG;
    const tenant = await getTenantBySlug(slug);
    if (!tenant) {
      const conn = await checkDatabaseConnection();
      if (!conn.ok) {
        console.error("resolvePublicTenantId fallback:", conn.error);
        return OFFLINE_TENANT_ID;
      }
      throw new Error(`Default tenant "${slug}" not found`);
    }
    return tenant.id;
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      console.error("resolvePublicTenantId fallback:", getDbErrorMessage(error));
      return OFFLINE_TENANT_ID;
    }
    throw error;
  }
}

export async function resolvePublicTenantSlug(): Promise<string> {
  const resolvedSlug = await resolveSlugFromRequest();
  if (resolvedSlug) return resolvedSlug;
  return process.env.DEFAULT_TENANT_SLUG ?? DEFAULT_TENANT_SLUG;
}

/** Resolves tenant from public route header/cookie without requiring active=true */
export async function resolveRequestedPublicTenant(): Promise<TenantSummary | null> {
  try {
    const headerStore = await headers();
    const slugFromHeader = headerStore.get(PUBLIC_TENANT_HEADER)?.trim();

    if (slugFromHeader) {
      return prisma.tenant.findUnique({
        where: { slug: slugFromHeader },
        select: {
          id: true,
          slug: true,
          name: true,
          templateId: true,
          primaryColor: true,
          logo: true,
          active: true,
        },
      });
    }

    const cookieStore = await cookies();
    const slugFromCookie = cookieStore.get(PUBLIC_TENANT_COOKIE)?.value?.trim();
    if (slugFromCookie) {
      return prisma.tenant.findUnique({
        where: { slug: slugFromCookie },
        select: {
          id: true,
          slug: true,
          name: true,
          templateId: true,
          primaryColor: true,
          logo: true,
          active: true,
        },
      });
    }

    return null;
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      console.error("resolveRequestedPublicTenant fallback:", getDbErrorMessage(error));
      return null;
    }
    throw error;
  }
}

export async function resolveAdminTenantId(
  userRole: string | undefined,
  userTenantId: string | null | undefined
): Promise<string> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(TENANT_COOKIE)?.value;

  if (userRole === "PLATFORM_ADMIN" && fromCookie) {
    const tenant = await getTenantById(fromCookie);
    if (tenant) return tenant.id;
  }

  if (userTenantId) {
    return userTenantId;
  }

  if (userRole === "ADMIN" || userRole === "STAFF") {
    throw new Error("NO_TENANT_ASSIGNED");
  }

  if (userRole === "PLATFORM_ADMIN") {
    throw new Error("NO_TENANT_SELECTED");
  }

  return resolvePublicTenantId();
}

export async function getActiveTenantSummary(): Promise<TenantSummary | null> {
  try {
    const tenantId = await resolvePublicTenantId();
    return prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        name: true,
        templateId: true,
        primaryColor: true,
        logo: true,
        active: true,
      },
    });
  } catch {
    return null;
  }
}
