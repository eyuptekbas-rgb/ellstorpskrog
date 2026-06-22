import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/images/constants";
import { processProductImage } from "@/lib/images/process";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function POST(req: Request) {
  try {
    await getAdminTenantId();
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Ingen bild vald" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Ogiltigt format. Använd JPEG, PNG eller WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Bilden är för stor (max 5 MB)." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileId = randomUUID();

    const cropLeft = formData.get("cropLeft");
    const cropTop = formData.get("cropTop");
    const cropWidth = formData.get("cropWidth");
    const cropHeight = formData.get("cropHeight");

    const crop =
      cropLeft != null &&
      cropTop != null &&
      cropWidth != null &&
      cropHeight != null
        ? {
            left: Number(cropLeft),
            top: Number(cropTop),
            width: Number(cropWidth),
            height: Number(cropHeight),
          }
        : undefined;

    const result = await processProductImage(buffer, fileId, crop);

    return NextResponse.json(result);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("POST /api/admin/upload error:", error);
    return NextResponse.json(
      { error: "Kunde inte bearbeta bilden" },
      { status: 500 }
    );
  }
}
