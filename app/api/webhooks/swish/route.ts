import { NextResponse } from "next/server";
import { validSwishToken } from "@/src/services/payment/providers/swish/tokens";
import { confirmSwishPayment } from "@/src/services/payment/server/swish-confirmation";

export const runtime = "nodejs";

async function handleSwishCallback(req: Request) {
  const url = new URL(req.url);
  const paymentId = url.searchParams.get("paymentId") || "";
  try {
    if (!paymentId || !validSwishToken(paymentId, "callback", url.searchParams.get("secret") || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Callback is only a wake-up signal; payment facts come from mTLS GET.
    const result = await confirmSwishPayment(paymentId);
    return NextResponse.json({ received: true, duplicate: result.duplicate });
  } catch {
    return NextResponse.json({ error: "Swish verification unavailable" }, { status: 503 });
  }
}

export const POST = handleSwishCallback;
export const PUT = handleSwishCallback;
