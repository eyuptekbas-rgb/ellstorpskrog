import { NextResponse } from "next/server";

/**
 * Cloud hosts must never access the Windows Print Spooler.
 * All RAW printing is handled by the local Print Agent on each POS terminal.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Windows RAW printing is disabled on the cloud server. Use the local Print Agent on the POS terminal (http://127.0.0.1:9211).",
      code: "LOCAL_PRINT_AGENT_REQUIRED",
    },
    { status: 503 }
  );
}
