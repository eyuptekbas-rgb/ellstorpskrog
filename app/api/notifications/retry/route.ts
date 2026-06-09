import { NextResponse } from "next/server";
import {
  retryAllFailedNotifications,
  retryFailedNotification,
} from "@/lib/email/notifications/retry";

type RetryBody = {
  logId?: string;
  retryAll?: boolean;
};

export async function POST(req: Request) {
  try {
    const body: RetryBody = await req.json();

    if (body.retryAll) {
      const results = await retryAllFailedNotifications();
      return NextResponse.json({ results });
    }

    if (!body.logId) {
      return NextResponse.json(
        { error: "logId or retryAll is required" },
        { status: 400 }
      );
    }

    const result = await retryFailedNotification(body.logId);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retry notification";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
