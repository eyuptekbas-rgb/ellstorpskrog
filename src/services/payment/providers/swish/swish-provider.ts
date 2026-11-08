import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSwishAppUrl } from "./config";
import { swishToken } from "./tokens";
import { normalizeSwishPhone } from "./phone";
export { normalizeSwishPhone } from "./phone";
import type {
  PaymentProviderId,
  PaymentRequest,
  PaymentResult,
} from "@/src/services/payment/types";
import type { PaymentAmount } from "@/src/services/payment/types/decimal";
import type {
  PaymentProvider,
  ProviderPaymentResponse,
  ProviderWebhookPayload,
  ProviderWebhookResult,
} from "@/src/services/payment/types/provider";
import { toSwishAmount } from "@/src/services/payment/providers/swish/amounts";
import {
  formatSwishApiError,
  swishApiRequest,
  type SwishApiError,
} from "@/src/services/payment/providers/swish/client";
import { extractSwishResourceId } from "@/src/services/payment/providers/swish/urls";
import { resolveSwishProviderConfig } from "@/src/services/payment/providers/swish/config";

export class SwishProvider implements PaymentProvider {
  readonly id: PaymentProviderId = "swish";

  async createPayment(request: PaymentRequest): Promise<ProviderPaymentResponse> {
    const config = await resolveSwishProviderConfig(request.businessId);

    if (!config) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorCode: "SWISH_NOT_CONFIGURED",
        errorMessage: "Swish Handel is not configured for this business",
      };
    }

    const order = await prisma.order.findFirst({
      where: {
        id: request.orderId,
        tenantId: request.businessId,
      },
      select: {
        id: true,
        orderNumber: true,
        customerPhone: true,
      },
    });

    if (!order) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorCode: "ORDER_NOT_FOUND",
        errorMessage: "Order not found for Swish payment",
      };
    }

    if (!request.paymentId) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorCode: "PAYMENT_ID_MISSING",
        errorMessage: "Internal payment id is required for Swish callbacks",
      };
    }

    const payment = await prisma.payment.findFirst({ where: { id: request.paymentId, businessId: request.businessId, orderId: order.id, provider: "swish" } });
    if (!payment?.providerPaymentId) throw new Error("Swish instruction must be persisted before sending");
    const payerAlias = normalizeSwishPhone(request.swishPayerPhone ?? order.customerPhone);
    const baseUrl = getSwishAppUrl();
    const callbackUrl = `${baseUrl}/api/webhooks/swish?paymentId=${request.paymentId}&secret=${swishToken(request.paymentId, "callback")}`;
    const message = `Order ${order.orderNumber}`.slice(0, 50);

    const redirectUrl = `/checkout/success?swish_payment_id=${request.paymentId}&token=${swishToken(request.paymentId, "status")}`;
    let response;
    try {
      response = await swishApiRequest<SwishApiError | null>(
      config,
      "PUT",
      `/paymentrequests/${payment.providerPaymentId}`,
      {
      payeeAlias: config.merchantNumber,
      payerAlias,
      amount: toSwishAmount(request.amount),
      currency: request.currency,
      callbackUrl,
      payeePaymentReference: request.paymentId,
      message,
    });
    } catch {
      // Delivery is uncertain; retain the instruction and let status polling recover it.
      return { success: true, status: PaymentStatus.PENDING, providerPaymentId: payment.providerPaymentId, redirectUrl };
    }

    if (response.statusCode !== 201) {
      if (response.statusCode >= 500 || response.statusCode === 409) {
        return { success: true, status: PaymentStatus.PENDING, providerPaymentId: payment.providerPaymentId, redirectUrl };
      }
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorCode: "SWISH_CREATE_FAILED",
        errorMessage: formatSwishApiError(response),
      };
    }

    const paymentRequestId = extractSwishResourceId(response.location);

    if (!paymentRequestId || paymentRequestId !== payment.providerPaymentId) {
      return {
        success: false,
        status: PaymentStatus.PENDING,
        redirectUrl,
        errorCode: "SWISH_ID_MISSING",
        errorMessage: "Swish did not return a payment request id",
      };
    }

    return {
      success: true,
      status: PaymentStatus.PENDING,
      providerPaymentId: paymentRequestId,
      providerReference: request.paymentId,
      redirectUrl,
    };
  }

  async capturePayment(providerPaymentId: string): Promise<PaymentResult> {
    return {
      success: true,
      status: PaymentStatus.PROCESSING,
      providerPaymentId,
    };
  }

  async cancelPayment(providerPaymentId: string): Promise<PaymentResult> {
    const businessId = await this.resolveBusinessIdFromPaymentRequest(providerPaymentId);

    if (!businessId) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorCode: "BUSINESS_NOT_FOUND",
        errorMessage: "Unable to resolve business for Swish payment request",
      };
    }

    const config = await resolveSwishProviderConfig(businessId);

    if (!config) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorCode: "SWISH_NOT_CONFIGURED",
        errorMessage: "Swish Handel is not configured for this business",
      };
    }

    const response = await swishApiRequest(
      config,
      "PATCH",
      `/paymentrequests/${encodeURIComponent(providerPaymentId)}`,
      [{ op: "replace", path: "/status", value: "cancelled" }]
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return {
        success: true,
        status: PaymentStatus.CANCELLED,
        providerPaymentId,
      };
    }

    return {
      success: false,
      status: PaymentStatus.PENDING,
      providerPaymentId,
      errorCode: "SWISH_CANCEL_FAILED",
      errorMessage: "Swish did not confirm cancellation",
    };
  }

  async refundPayment(
    providerPaymentId: string,
    amount?: PaymentAmount
  ): Promise<PaymentResult> {
    void amount;
    return {
      success: false,
      status: PaymentStatus.PAID,
      providerPaymentId,
      errorCode: "SWISH_REFUND_UNAVAILABLE",
      errorMessage: "Swish refunds require a separately verified refund flow",
    };
  }

  async parseWebhook(payload: ProviderWebhookPayload): Promise<ProviderWebhookResult> {
    void payload;
    throw new Error("Swish updates require the verified mTLS confirmation endpoint");
  }

  private async resolveBusinessIdFromPaymentRequest(
    providerPaymentId: string
  ): Promise<string | null> {
    const payment = await prisma.payment.findFirst({
      where: {
        provider: "swish",
        providerPaymentId,
      },
      select: { businessId: true },
    });

    return payment?.businessId ?? null;
  }
}

export const swishPaymentProvider = new SwishProvider();
