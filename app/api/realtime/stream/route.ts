import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { requireAdminTenantId } from "@/lib/tenant/auth";
import {
  formatSse,
  formatSsePing,
  subscribeTenant,
} from "@/lib/realtime/bus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !isStaffRole(session.user.role)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let tenantId: string;
  try {
    tenantId = await requireAdminTenantId();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();

      const close = () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        if (unsubscribe) unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      };

      unsubscribe = subscribeTenant(tenantId, (event) => {
        try {
          controller.enqueue(encoder.encode(formatSse(event)));
        } catch {
          close();
        }
      });

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(formatSsePing()));
        } catch {
          close();
        }
      }, 15_000);

      req.signal.addEventListener("abort", close);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      if (unsubscribe) unsubscribe();
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
