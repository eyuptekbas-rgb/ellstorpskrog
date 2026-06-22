import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/stripe/config";
import type {
  PaymentProviderId,
  PaymentRequest,
  PaymentResult,
} from "@/src/services/payment/types";
import type { PaymentAmount } from "@/src/services/payment/types/decimal";
import { decimalToAmountString } from "@/src/services/payment/types/decimal";
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
import {
  parseSwishCallbackBody,
  parseSwishCallbackPayload,
  parseSwishRefundCallback,
  type SwishCallbackPayload,
  type SwishRefundCallbackPayload,
} from "@/src/services/payment/providers/swish/callback-parser";
import { resolveSwishProviderConfig } from "@/src/services/payment/providers/swish/config";

const SWISH_PAYMENT_URL = "https://swish.co/payment";

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

    const baseUrl = getAppBaseUrl();
    const callbackUrl = `${baseUrl}/api/webhooks/swish?businessId=${encodeURIComponent(request.businessId)}`;
    const message = `Order ${order.orderNumber}`.slice(0, 50);

    const response = await swishApiRequest<SwishApiError | null>(
      config,
      "POST",
      "/paymentrequests",
      {
      payeeAlias: config.merchantNumber,
      amount: toSwishAmount(request.amount),
      currency: request.currency,
      callbackUrl,
      payeePaymentReference: request.paymentId,
      message,
    });

    if (response.statusCode !== 201) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorCode: "SWISH_CREATE_FAILED",
        errorMessage: formatSwishApiError(response),
      };
    }

    const paymentRequestId = extractSwishResourceId(response.location);

    if (!paymentRequestId) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorCode: "SWISH_ID_MISSING",
        errorMessage: "Swish did not return a payment request id",
      };
    }

    return {
      success: true,
      status: PaymentStatus.PENDING,
      providerPaymentId: paymentRequestId,
      providerReference: request.paymentId,
      redirectUrl: `${SWISH_PAYMENT_URL}?id=${encodeURIComponent(paymentRequestId)}`,
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
      { status: "cancelled" }
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return {
        success: true,
        status: PaymentStatus.CANCELLED,
        providerPaymentId,
      };
    }

    return {
      success: true,
      status: PaymentStatus.CANCELLED,
      providerPaymentId,
    };
  }

  async refundPayment(
    providerPaymentId: string,
    amount?: PaymentAmount
  ): Promise<PaymentResult> {
    const payment = await prisma.payment.findFirst({
      where: {
        provider: "swish",
        OR: [
          { providerPaymentId },
          { providerReference: providerPaymentId },
        ],
      },
    });

    if (!payment?.businessId) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorCode: "PAYMENT_NOT_FOUND",
        errorMessage: "Unable to resolve Swish payment for refund",
      };
    }

    const config = await resolveSwishProviderConfig(payment.businessId);

    if (!config) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorCode: "SWISH_NOT_CONFIGURED",
        errorMessage: "Swish Handel is not configured for this business",
      };
    }

    const originalPaymentReference =
      payment.providerReference?.trim() || providerPaymentId;

    const refundBody: Record<string, string> = {
      originalPaymentReference,
      payerAlias: config.merchantNumber,
      amount: toSwishAmount(amount ?? decimalToAmountString(payment.amount)),
      message: "Refund",
    };

    const callbackUrl = `${getAppBaseUrl()}/api/webhooks/swish?businessId=${encodeURIComponent(payment.businessId)}&type=refund`;
    refundBody.callbackUrl = callbackUrl;

    const response = await swishApiRequest<SwishApiError | null>(
      config,
      "POST",
      "/refunds",
      refundBody
    );

    if (response.statusCode !== 201) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorCode: "SWISH_REFUND_FAILED",
        errorMessage: formatSwishApiError(response),
      };
    }

    const refundId = extractSwishResourceId(response.location);

    return {
      success: true,
      status: PaymentStatus.REFUNDED,
      providerPaymentId,
      providerReference: refundId ?? originalPaymentReference,
    };
  }

  async parseWebhook(payload: ProviderWebhookPayload): Promise<ProviderWebhookResult> {
    const callbackPayload =
      (payload.verifiedEvent as SwishCallbackPayload | SwishRefundCallbackPayload | undefined) ??
      parseSwishCallbackBody(payload.rawBody);

    if (
      "originalPaymentReference" in callbackPayload &&
      callbackPayload.originalPaymentReference?.trim()
    ) {
      const parsed = parseSwishRefundCallback(
        callbackPayload as SwishRefundCallbackPayload
      );

      if (!parsed) {
        throw new Error("Swish refund callback did not produce a payment update");
      }

      return parsed;
    }

    const parsed = parseSwishCallbackPayload(callbackPayload as SwishCallbackPayload);

    if (!parsed) {
      throw new Error("Swish callback did not produce a payment update");
    }

    return parsed;
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
