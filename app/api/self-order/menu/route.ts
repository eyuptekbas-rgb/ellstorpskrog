import { NextResponse } from "next/server";
import { getPublicMenu } from "@/lib/menu";
import { resolvePublicTenantId } from "@/lib/tenant/resolve";

export async function GET() {
  try {
    const tenantId = await resolvePublicTenantId();
    const menu = await getPublicMenu(tenantId);
    return NextResponse.json({ menu });
  } catch {
    return NextResponse.json({ error: "Menu unavailable" }, { status: 503 });
  }
}
