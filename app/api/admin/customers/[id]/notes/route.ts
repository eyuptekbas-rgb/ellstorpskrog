import { NextResponse } from "next/server";
import {
  createAdminNote,
  deleteAdminNote,
  updateAdminNote,
} from "@/lib/customers/crm-service";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const tenantId = await getAdminTenantId();
    const { id: profileId } = await params;
    const body = await req.json();
    const text = body.body?.trim();
    if (!text) {
      return NextResponse.json({ error: "Anteckningen kan inte vara tom." }, { status: 400 });
    }
    const note = await createAdminNote(tenantId, profileId, text);
    if (!note) {
      return NextResponse.json({ error: "Kunden hittades inte." }, { status: 404 });
    }
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Kunde inte spara anteckning." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const body = await req.json();
    const noteId = body.noteId?.trim();
    const text = body.body?.trim();
    if (!noteId || !text) {
      return NextResponse.json({ error: "Ogiltig begäran." }, { status: 400 });
    }
    const note = await updateAdminNote(tenantId, noteId, text);
    if (!note) {
      return NextResponse.json({ error: "Anteckningen hittades inte." }, { status: 404 });
    }
    return NextResponse.json(note);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Kunde inte uppdatera anteckning." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId")?.trim();
    if (!noteId) {
      return NextResponse.json({ error: "noteId saknas." }, { status: 400 });
    }
    const ok = await deleteAdminNote(tenantId, noteId);
    if (!ok) {
      return NextResponse.json({ error: "Anteckningen hittades inte." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Kunde inte radera anteckning." }, { status: 500 });
  }
}
