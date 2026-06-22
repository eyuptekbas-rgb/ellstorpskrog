import { NextResponse } from "next/server";
import { listBackups, runBackup } from "@/lib/backup/service";
import { requirePermission } from "@/lib/auth/require-permission";
import { tenantApiError } from "@/lib/tenant/admin-api";

export async function GET() {
  try {
    await requirePermission("settings");
    return NextResponse.json({ backups: listBackups() });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Backup list failed" }, { status: 500 });
  }
}

export async function POST() {
  try {
    await requirePermission("settings");
    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (!databaseUrl) {
      return NextResponse.json({ error: "DATABASE_URL missing" }, { status: 500 });
    }

    const result = runBackup(databaseUrl);
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Backup failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, file: result.file });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
