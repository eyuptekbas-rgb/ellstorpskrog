import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/tenant/auth";
import { TENANT_TEMPLATES } from "@/lib/tenant/templates";

export async function GET() {
  try {
    await requirePlatformAdmin();
    return NextResponse.json(TENANT_TEMPLATES);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}
