import { NextResponse } from "next/server";
import {
  createStaffNote,
  deleteStaffNote,
  updateStaffNote,
} from "@/lib/staff/staff-service";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const tenantId = await getAdminTenantId();
    const { id: userId } = await params;
    const body = await req.json();
    const text = body.body?.trim();
    if (!text) {
      return NextResponse.json({ error: "Anteckningen kan inte vara tom." }, { status: 400 });
    }
    const note = await createStaffNote(tenantId, userId, text);
    if (!note) {
      return NextResponse.json({ error: "Personal hittades inte." }, { status: 404 });
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
    const note = await updateStaffNote(tenantId, noteId, text);
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
    const noteId = new URL(req.url).searchParams.get("noteId")?.trim();
    if (!noteId) {
      return NextResponse.json({ error: "noteId saknas." }, { status: 400 });
    }
    const ok = await deleteStaffNote(tenantId, noteId);
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
