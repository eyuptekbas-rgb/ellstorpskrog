import { NextResponse } from "next/server";
import { NotificationType } from "@prisma/client";
import { sendTestNotification } from "@/lib/email/notifications/retry";
import { isEmailConfigured } from "@/lib/email/resend";

type TestBody = {
  type: NotificationType;
  recipient: string;
  orderId?: string;
};

export async function POST(req: Request) {
  try {
    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured" },
        { status: 503 }
      );
    }

    const body: TestBody = await req.json();
    const { type, recipient, orderId } = body;

    if (!type || !Object.values(NotificationType).includes(type)) {
      return NextResponse.json({ error: "Valid type is required" }, { status: 400 });
    }

    if (!recipient?.trim() || !recipient.includes("@")) {
      return NextResponse.json(
        { error: "Valid recipient email is required" },
        { status: 400 }
      );
    }

    const result = await sendTestNotification({
      type,
      recipient: recipient.trim(),
      orderId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/notifications/test error:", error);
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 }
    );
  }
}
