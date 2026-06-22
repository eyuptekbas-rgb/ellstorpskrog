import { NextResponse } from "next/server";
import {
  adjustLoyaltyPoints,
  getCustomerProfile,
  updateCustomerProfile,
} from "@/lib/customers/crm-service";
import { CUSTOMER_TAGS, CUSTOMER_VIP_LEVELS, type CustomerTag, type CustomerVipLevel } from "@/lib/customers/crm";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: Params) {
  try {
    const tenantId = await getAdminTenantId();
    const { id } = await params;
    const profile = await getCustomerProfile(tenantId, id);
    if (!profile) {
      return NextResponse.json({ error: "Kunden hittades inte." }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Kunde inte hämta kund." }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const tenantId = await getAdminTenantId();
    const { id } = await params;
    const body = await req.json();

    if (body.pointsDelta !== undefined) {
      const pointsDelta = Number(body.pointsDelta);
      const reason = body.reason?.trim();
      if (!Number.isFinite(pointsDelta) || !reason) {
        return NextResponse.json(
          { error: "Ange poängändring och anledning." },
          { status: 400 }
        );
      }
      const result = await adjustLoyaltyPoints(
        tenantId,
        id,
        pointsDelta,
        reason,
        body.createdBy
      );
      if (!result) {
        return NextResponse.json({ error: "Kunden hittades inte." }, { status: 404 });
      }
      const profileAfterLoyalty = await getCustomerProfile(tenantId, id);
      return NextResponse.json(profileAfterLoyalty);
    }

    const tags = Array.isArray(body.tags)
      ? body.tags.filter(
          (t: unknown): t is CustomerTag =>
            typeof t === "string" && CUSTOMER_TAGS.includes(t as CustomerTag)
        )
      : undefined;

    const vipLevel =
      body.vipLevel && CUSTOMER_VIP_LEVELS.includes(body.vipLevel)
        ? (body.vipLevel as CustomerVipLevel)
        : undefined;

    const updated = await updateCustomerProfile(tenantId, id, {
      tags,
      vipLevel,
      vipOverride: body.vipOverride,
    });
    if (!updated) {
      return NextResponse.json({ error: "Kunden hittades inte." }, { status: 404 });
    }

    const profile = await getCustomerProfile(tenantId, id);
    return NextResponse.json(profile);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Kunde inte uppdatera kund." }, { status: 500 });
  }
}
