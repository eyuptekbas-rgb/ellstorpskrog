import { NextResponse } from "next/server";
import { requireAdminTenantId } from "@/lib/tenant/auth";

export async function getAdminTenantId(): Promise<string> {
  return requireAdminTenantId();
}

export function tenantApiError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "NO_TENANT_SELECTED") {
      return NextResponse.json(
        { error: "Välj en kund i Ordina-plattformen först" },
        { status: 400 }
      );
    }
    if (error.message === "NO_TENANT_ASSIGNED") {
      return NextResponse.json(
        { error: "Ditt konto saknar tilldelad restaurang" },
        { status: 403 }
      );
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  return null;
}
