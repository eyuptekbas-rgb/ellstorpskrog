import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/billing/cron-auth";
import { markOverdueInvoices } from "@/lib/billing/service";

async function handleOverdueCron() {
  const updated = await markOverdueInvoices();
  return NextResponse.json({ success: true, overdueUpdated: updated });
}

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return handleOverdueCron();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Overdue job failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return handleOverdueCron();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Overdue job failed" },
      { status: 500 }
    );
  }
}
