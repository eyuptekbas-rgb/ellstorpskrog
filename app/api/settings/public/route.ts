import { NextResponse } from "next/server";
import { getPublicSettings } from "@/lib/settings";

export async function GET() {
  const data = await getPublicSettings();
  return NextResponse.json(data);
}
