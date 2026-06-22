import { NextResponse } from "next/server";
import {
  extractSwishBusinessIdFromCallbackUrl,
  parseSwishCallbackBody,
  type SwishCallbackPayload,
  type SwishRefundCallbackPayload,
} from "@/src/services/payment/providers/swish/callback-parser";
import { paymentWebhookService } from "@/src/services/payment/server/webhooks/instance";

async function handleSwishCallback(req: Request) {
  const url = new URL(req.url);
  const businessId = url.searchParams.get("businessId")?.trim();
  const callbackType = url.searchParams.get("type")?.trim();
  const callbackSecret = process.env.SWISH_CALLBACK_SECRET?.trim();

  if (callbackSecret) {
    const provided =
      url.searchParams.get("secret")?.trim() ||
      req.headers.get("x-swish-callback-secret")?.trim();
    if (provided !== callbackSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Swish callbacks are not configured" },
      { status: 503 }
    );
  }

  if (!businessId) {
    return NextResponse.json(
      { error: "Missing businessId query parameter" },
      { status: 400 }
    );
  }

  const rawBody = await req.text();

  if (!rawBody.trim()) {
    return NextResponse.json({ error: "Empty callback body" }, { status: 400 });
  }

  let verifiedEvent: SwishCallbackPayload | SwishRefundCallbackPayload;

  try {
    verifiedEvent = parseSwishCallbackBody(rawBody) as
      | SwishCallbackPayload
      | SwishRefundCallbackPayload;
  } catch (error) {
    console.error("Swish callback parse error:", error);
    return NextResponse.json({ error: "Invalid callback payload" }, { status: 400 });
  }

  const metadataBusinessId = extractSwishBusinessIdFromCallbackUrl(
    verifiedEvent.callbackUrl
  );

  if (metadataBusinessId && metadataBusinessId !== businessId) {
    return NextResponse.json({ error: "Business mismatch" }, { status: 403 });
  }

  const headers = new Headers(req.headers);

  if (callbackType === "refund") {
    headers.set("x-swish-callback-type", "refund");
  }

  try {
    const result = await paymentWebhookService.processWebhook({
      businessId,
      provider: "swish",
      headers,
      rawBody,
      verifiedEvent,
    });

    return NextResponse.json({
      received: true,
      duplicate: result.duplicate,
      paymentId: result.paymentId,
      status: result.status,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("did not produce a payment update") ||
        error.message.includes("Unhandled"))
    ) {
      return NextResponse.json({ received: true, ignored: true });
    }

    console.error("Swish callback handler error:", error);
    return NextResponse.json(
      { error: "Callback handler failed" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  return handleSwishCallback(req);
}

export async function POST(req: Request) {
  return handleSwishCallback(req);
}
