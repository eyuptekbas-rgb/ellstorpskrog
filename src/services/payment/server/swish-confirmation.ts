import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { publishNewOrder } from "@/lib/realtime/publish";
import { resolveSwishProviderConfig } from "../providers/swish/config";
import { swishApiRequest } from "../providers/swish/client";
import { mapSwishStatusToPaymentStatus, type SwishCallbackPayload } from "../providers/swish/callback-parser";
import { validateSwishConfirmation } from "../providers/swish/verification";
import { swishAmountsMatch } from "../providers/swish/amounts";

/** The callback is only a wake-up signal. All payment facts come from mTLS GET. */
export async function confirmSwishPayment(paymentId: string) {
  const payment = await prisma.payment.findFirst({ where: { id: paymentId, provider: "swish", method: "SWISH" } });
  if (!payment?.providerPaymentId) throw new Error("Unknown Swish payment");
  const config = await resolveSwishProviderConfig(payment.businessId);
  if (!config) throw new Error("Swish is not configured");
  const response = await swishApiRequest<SwishCallbackPayload>(config, "GET", `/paymentrequests/${encodeURIComponent(payment.providerPaymentId)}`);
  if (response.statusCode !== 200 || !response.body) throw new Error("Swish status verification unavailable");
  validateSwishConfirmation({ ...payment, amount: payment.amount.toFixed(2) }, response.body, config.merchantNumber);
  return applyVerifiedSwishPayment(paymentId, response.body);
}

/** Internal only: caller must first authenticate the Swish response via mTLS. */
export async function applyVerifiedSwishPayment(paymentId: string, remote: SwishCallbackPayload) {
  const mapped = remote.status ? mapSwishStatusToPaymentStatus(remote.status) : null;
  if (!mapped) throw new Error("Unsupported Swish status");
  const result = await prisma.$transaction(async tx => {
    const initial = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${initial.orderId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${paymentId} FOR UPDATE`;
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const order = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId } });
    if (payment.provider !== "swish" || payment.method !== "SWISH" || order.tenantId !== payment.businessId ||
        !swishAmountsMatch(String(order.total), payment.amount.toFixed(2))) throw new Error("Swish order mismatch");
    const eventId = `${remote.id}:${remote.status}`;
    const existing = await tx.paymentWebhookEvent.findUnique({ where: { provider_eventId: { provider: "swish", eventId } } });
    if (existing || payment.status === "REFUNDED" || (payment.status === "PAID" && mapped !== "PAID") ||
        (mapped === "PENDING" && payment.status !== "PENDING")) {
      return { duplicate: true, payment, order, newlyPaid: false };
    }
    const updated = await tx.payment.update({ where: { id: paymentId }, data: {
      status: mapped,
      ...(mapped === "PAID" && { paidAt: payment.paidAt ?? new Date(), providerReference: remote.paymentReference }),
    } });
    const newlyPaid = mapped === "PAID" && order.paymentStatus !== "PAID";
    const updatedOrder = order.paymentStatus === "PAID" || mapped === "PENDING" ? order : await tx.order.update({ where: { id: order.id }, data: {
      paymentStatus: mapped, paymentMethod: "SWISH",
    } });
    await tx.paymentWebhookEvent.create({ data: {
      provider: "swish", eventId, paymentId,
      payloadHash: createHash("sha256").update(JSON.stringify(remote)).digest("hex"),
    } });
    return { duplicate: false, payment: updated, order: updatedOrder, newlyPaid };
  });
  if (result.newlyPaid) publishNewOrder(result.order.tenantId, result.order.id, result.order.orderNumber);
  return result;
}
