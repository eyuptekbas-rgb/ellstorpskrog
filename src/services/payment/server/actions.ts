"use server";

import { getAdminTenantId } from "@/lib/tenant/admin-api";
import { resolvePublicTenantId } from "@/lib/tenant/resolve";
import { paymentService } from "@/src/services/payment/server/payment-service";
import { paymentWebhookService } from "@/src/services/payment/server/webhooks/instance";
import type {
  ListPaymentsInput,
  ProcessWebhookInput,
} from "@/src/services/payment/types";
import type { CreatePaymentInput } from "@/src/services/payment/validators/payment";

async function assertBusinessAccess(businessId: string) {
  const tenantId = await getAdminTenantId();
  if (tenantId !== businessId) {
    throw new Error("UNAUTHORIZED");
  }
}

export async function createPaymentAction(input: CreatePaymentInput) {
  const businessId = await resolvePublicTenantId();
  if (input.businessId !== businessId) {
    throw new Error("UNAUTHORIZED");
  }

  return paymentService.createPayment({ ...input, businessId });
}

export async function capturePaymentAction(
  businessId: string,
  paymentId: string
) {
  await assertBusinessAccess(businessId);
  return paymentService.capturePayment(businessId, paymentId);
}

export async function cancelPaymentAction(
  businessId: string,
  paymentId: string
) {
  await assertBusinessAccess(businessId);
  return paymentService.cancelPayment(businessId, paymentId);
}

export async function refundPaymentAction(
  businessId: string,
  paymentId: string
) {
  await assertBusinessAccess(businessId);
  return paymentService.refundPayment(businessId, paymentId);
}

export async function getPaymentAction(businessId: string, paymentId: string) {
  await assertBusinessAccess(businessId);
  return paymentService.getPayment(businessId, paymentId);
}

export async function listPaymentsAction(input: ListPaymentsInput) {
  await assertBusinessAccess(input.businessId);
  return paymentService.listPayments(input);
}

export async function processPaymentWebhookAction(input: ProcessWebhookInput) {
  return paymentWebhookService.processWebhook(input);
}
