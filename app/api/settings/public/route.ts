import { NextResponse } from "next/server";
import { getPublicSettings } from "@/lib/settings";

export async function GET() {
  try {
    const data = await getPublicSettings();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/settings/public error:", error);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}
