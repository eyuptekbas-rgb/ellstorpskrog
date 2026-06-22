import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/billing/cron-auth";
import { runMonthlyBillingJob } from "@/lib/billing/service";
import { parsePeriodInput } from "@/lib/billing/period";

async function handleMonthlyCron(req: Request) {
  const body =
    req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const url = new URL(req.url);
  const period = parsePeriodInput(
    body.year ?? url.searchParams.get("year"),
    body.month ?? url.searchParams.get("month")
  ) ?? undefined;

  const autoSend =
    body.autoSend !== false && url.searchParams.get("autoSend") !== "false";

  const result = await runMonthlyBillingJob({ period, autoSend });
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return handleMonthlyCron(req);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Monthly billing job failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return handleMonthlyCron(req);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Monthly billing job failed",
      },
      { status: 500 }
    );
  }
}
