import { NextResponse } from "next/server";
import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";
import { publishOrderUpdated } from "@/lib/realtime/publish";

type Line = { method?: PaymentMethod; amount?: string };

function toOre(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const ore = Math.round(Number(value) * 100);
  return Number.isSafeInteger(ore) && ore > 0 ? ore : null;
}

export async function POST(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const body = await req.json() as { orderId?: string; lines?: Line[] };
    if (!body.orderId || !Array.isArray(body.lines) || body.lines.length < 2) {
      return NextResponse.json({ error: "Minst två betalningsdelar krävs." }, { status: 400 });
    }
    const parsed = body.lines.map((line) => ({
      method: line.method,
      amount: line.amount,
      ore: typeof line.amount === "string" ? toOre(line.amount) : null,
    }));
    if (parsed.some((line) => !line.method || !Object.values(PaymentMethod).includes(line.method) || line.ore === null)) {
      return NextResponse.json({ error: "Ogiltig betalningsrad." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Match Swish confirmation's order lock so payment attempts cannot race it.
      await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${body.orderId} AND "tenantId" = ${tenantId} FOR UPDATE`;
      const order = await tx.order.findFirst({ where: { id: body.orderId, tenantId } });
      if (!order) return null;
      const swishPayment = await tx.payment.findFirst({
        where: { orderId: order.id, businessId: tenantId, method: PaymentMethod.SWISH },
        select: { id: true, status: true, provider: true, amount: true, currency: true },
        orderBy: { createdAt: "desc" },
      });
      // POS must neither invent paid Swish rows nor settle an in-flight Swish
      // order using different line labels. Confirmed Swish is settled by mTLS.
      if (order.paymentMethod === PaymentMethod.SWISH || swishPayment ||
          parsed.some(line => line.method === PaymentMethod.SWISH)) {
        // Swish pays the full order upstream. A confirmed retry acknowledges
        // that settlement without creating additional POS payment rows.
        if (swishPayment?.provider === "swish" &&
            swishPayment.status === PaymentStatus.PAID &&
            swishPayment.currency === "SEK" &&
            swishPayment.amount.equals(new Prisma.Decimal(order.total)) &&
            order.paymentStatus === PaymentStatus.PAID) {
          return order;
        }
        throw new Error("SWISH_CONFIRMATION_REQUIRED");
      }
      if (order.paymentStatus === PaymentStatus.PAID) throw new Error("ALREADY_PAID");
      if (parsed.reduce((sum, line) => sum + (line.ore ?? 0), 0) !== order.total * 100) {
        throw new Error("TOTAL_MISMATCH");
      }
      await tx.payment.createMany({
        data: parsed.map((line) => ({
          orderId: order.id,
          businessId: tenantId,
          method: line.method!,
          status: PaymentStatus.PAID,
          amount: new Prisma.Decimal(line.amount!),
          currency: "SEK",
          provider: "pos",
          providerReference: `pos:${order.id}:${crypto.randomUUID()}`,
          paidAt: new Date(),
        })),
      });
      const updated = await tx.order.updateMany({
        where: { id: order.id, tenantId, paymentStatus: { not: PaymentStatus.PAID } },
        data: { paymentStatus: PaymentStatus.PAID },
      });
      if (updated.count !== 1) throw new Error("ALREADY_PAID");
      return tx.order.findUnique({ where: { id: order.id }, include: { payments: true } });
    });
    if (!result) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    publishOrderUpdated(tenantId, result.id, result.status, result.orderNumber);
    return NextResponse.json({ order: result });
  } catch (error) {
    if (error instanceof Error && error.message === "SWISH_CONFIRMATION_REQUIRED") {
      return NextResponse.json({ error: "Swish måste bekräftas via Swish. Betalningen kan inte registreras som POS-delbetalning." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "TOTAL_MISMATCH") {
      return NextResponse.json({ error: "Betalningsdelarna måste motsvara ordertotalen." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "ALREADY_PAID") {
      return NextResponse.json({ error: "Ordern är redan betald." }, { status: 409 });
    }
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Kunde inte spara delbetalningen." }, { status: 500 });
  }
}
