import { PaymentStatus } from "@prisma/client";
import { createHash } from "node:crypto";
import {
  markOrderPaid,
  markOrderPaymentFailed,
  markOrderRefunded,
} from "@/lib/orders/payment";
import type { Payment } from "@prisma/client";
import type { PaymentProviderRegistry } from "@/src/services/payment/types/provider";
import {
  PAYMENT_PROVIDERS,
  type ListPaymentsInput,
  type PaymentDTO,
  type PaymentProviderId,
  type PaymentResponse,
} from "@/src/services/payment/types";
import {
  decimalToAmountString,
} from "@/src/services/payment/types/decimal";
import type { Iso4217Currency } from "@/src/services/payment/types/currencies";
import {
  createPaymentSchema,
  listPaymentsSchema,
  paymentOperationSchema,
  type CreatePaymentInput,
} from "@/src/services/payment/validators/payment";
import { paymentProviderRegistry } from "@/src/services/payment/providers/registry";
import { BusinessPaymentSettingsRepository } from "@/src/services/payment/server/repositories/business-payment-settings-repository";
import { PaymentRepository } from "@/src/services/payment/server/repositories/payment-repository";

export class PaymentError extends Error {
  constructor(
    message: string,
    readonly code: string
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

export class PaymentService {
  constructor(
    private readonly registry: PaymentProviderRegistry,
    private readonly payments = new PaymentRepository(),
    private readonly settings = new BusinessPaymentSettingsRepository()
  ) {}

  async createPayment(input: CreatePaymentInput): Promise<PaymentResponse> {
    const data = createPaymentSchema.parse(input);
    const providerId = this.registry.resolveProviderId(data.method);
    const provider = this.registry.getProvider(providerId);

    const payment = await this.payments.transaction(async (tx) => {
      const order = await this.payments.findOrderForPayment(
        data.businessId,
        data.orderId,
        tx
      );

      if (!order) {
        throw new PaymentError("Order not found", "ORDER_NOT_FOUND");
      }

      const enabled = await this.settings.isPaymentMethodEnabled(
        data.businessId,
        data.method,
        tx
      );

      if (!enabled) {
        throw new PaymentError("Payment method is disabled", "METHOD_DISABLED");
      }

      return this.payments.create(
        data.businessId,
        {
          orderId: data.orderId,
          businessId: data.businessId,
          method: data.method,
          status: PaymentStatus.PENDING,
          amount: data.amount,
          currency: data.currency,
          provider: providerId,
          providerReference: data.providerReference ?? null,
        },
        tx
      );
    });

    const providerResult = await provider.createPayment({
      orderId: data.orderId,
      businessId: data.businessId,
      method: data.method,
      amount: data.amount,
      currency: data.currency,
      providerReference: data.providerReference,
      paymentId: payment.id,
    });

    const updated = await this.payments.transaction(async (tx) => {
      const result = await this.payments.update(
        data.businessId,
        payment.id,
        {
          status: providerResult.status,
          providerPaymentId: providerResult.providerPaymentId ?? null,
          providerReference:
            providerResult.providerReference ?? payment.providerReference,
          ...(providerResult.status === PaymentStatus.PAID && { paidAt: new Date() }),
        },
        tx
      );

      if (!result) {
        throw new PaymentError("Payment not found", "PAYMENT_NOT_FOUND");
      }

      return result;
    });

    return {
      payment: toPaymentDTO(updated),
      requiresAction: Boolean(providerResult.redirectUrl),
      actionUrl: providerResult.redirectUrl,
    };
  }

  async capturePayment(
    businessId: string,
    paymentId: string
  ): Promise<PaymentDTO> {
    const input = paymentOperationSchema.parse({ businessId, paymentId });
    const payment = await this.requirePayment(input.businessId, input.paymentId);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new PaymentError("Payment is not pending", "INVALID_STATUS");
    }

    const provider = this.registry.getProvider(asProviderId(payment.provider));

    const providerResult = payment.providerPaymentId
      ? await provider.capturePayment(payment.providerPaymentId)
      : { success: true, status: PaymentStatus.PROCESSING };

    return this.payments.transaction(async (tx) => {
      const current = await this.requirePayment(
        input.businessId,
        input.paymentId,
        tx
      );

      if (current.status !== PaymentStatus.PENDING) {
        throw new PaymentError("Payment is not pending", "INVALID_STATUS");
      }

      const updated = await this.payments.updateStatus(
        input.businessId,
        input.paymentId,
        providerResult.status,
        {},
        tx
      );

      if (!updated) {
        throw new PaymentError("Payment not found", "PAYMENT_NOT_FOUND");
      }

      return toPaymentDTO(updated);
    });
  }

  async cancelPayment(
    businessId: string,
    paymentId: string
  ): Promise<PaymentDTO> {
    const input = paymentOperationSchema.parse({ businessId, paymentId });
    const payment = await this.requirePayment(input.businessId, input.paymentId);

    if (
      payment.status === PaymentStatus.PAID ||
      payment.status === PaymentStatus.REFUNDED
    ) {
      throw new PaymentError("Payment cannot be cancelled", "INVALID_STATUS");
    }

    const provider = this.registry.getProvider(asProviderId(payment.provider));

    const providerResult = payment.providerPaymentId
      ? await provider.cancelPayment(payment.providerPaymentId)
      : { success: true, status: PaymentStatus.CANCELLED };

    return this.payments.transaction(async (tx) => {
      const current = await this.requirePayment(
        input.businessId,
        input.paymentId,
        tx
      );

      if (
        current.status === PaymentStatus.PAID ||
        current.status === PaymentStatus.REFUNDED
      ) {
        throw new PaymentError("Payment cannot be cancelled", "INVALID_STATUS");
      }

      const updated = await this.payments.updateStatus(
        input.businessId,
        input.paymentId,
        providerResult.status,
        {},
        tx
      );

      if (!updated) {
        throw new PaymentError("Payment not found", "PAYMENT_NOT_FOUND");
      }

      return toPaymentDTO(updated);
    });
  }

  async refundPayment(
    businessId: string,
    paymentId: string
  ): Promise<PaymentDTO> {
    const input = paymentOperationSchema.parse({ businessId, paymentId });
    const payment = await this.requirePayment(input.businessId, input.paymentId);

    if (payment.status !== PaymentStatus.PAID) {
      throw new PaymentError("Only paid payments can be refunded", "INVALID_STATUS");
    }

    const provider = this.registry.getProvider(asProviderId(payment.provider));

    const providerResult = payment.providerPaymentId
      ? await provider.refundPayment(
          payment.providerPaymentId,
          decimalToAmountString(payment.amount)
        )
      : { success: true, status: PaymentStatus.REFUNDED };

    return this.payments.transaction(async (tx) => {
      const current = await this.requirePayment(
        input.businessId,
        input.paymentId,
        tx
      );

      if (current.status !== PaymentStatus.PAID) {
        throw new PaymentError("Only paid payments can be refunded", "INVALID_STATUS");
      }

      const updated = await this.payments.updateStatus(
        input.businessId,
        input.paymentId,
        providerResult.status,
        {},
        tx
      );

      if (!updated) {
        throw new PaymentError("Payment not found", "PAYMENT_NOT_FOUND");
      }

      return toPaymentDTO(updated);
    });
  }

  async getPayment(businessId: string, paymentId: string): Promise<PaymentDTO> {
    const input = paymentOperationSchema.parse({ businessId, paymentId });
    return toPaymentDTO(
      await this.requirePayment(input.businessId, input.paymentId)
    );
  }

  async listPayments(input: ListPaymentsInput): Promise<PaymentDTO[]> {
    const data = listPaymentsSchema.parse(input);
    const { businessId, ...filters } = data;
    const payments = await this.payments.list(businessId, filters);
    return payments.map(toPaymentDTO);
  }

  async syncPaymentStatus(
    businessId: string,
    paymentId: string,
    input: {
      status: PaymentStatus;
      providerPaymentId?: string | null;
      providerReference?: string | null;
    }
  ): Promise<PaymentDTO> {
    const operation = paymentOperationSchema.parse({ businessId, paymentId });

    const updated = await this.payments.transaction(async (tx) => {
      const current = await this.requirePayment(
        operation.businessId,
        operation.paymentId,
        tx
      );

      if (current.status === input.status) {
        return current;
      }

      const result = await this.payments.updateStatus(
        operation.businessId,
        operation.paymentId,
        input.status,
        {
          providerPaymentId:
            input.providerPaymentId ?? current.providerPaymentId,
          providerReference:
            input.providerReference ?? current.providerReference,
        },
        tx
      );

      if (!result) {
        throw new PaymentError("Payment not found", "PAYMENT_NOT_FOUND");
      }

      return result;
    });

    await this.syncOrderFromPayment(updated);

    return toPaymentDTO(updated);
  }

  private async syncOrderFromPayment(payment: Payment) {
    if (payment.status === PaymentStatus.PAID) {
      await markOrderPaid(payment.orderId, {
        stripeSessionId: payment.providerPaymentId,
        paymentIntentId: payment.providerReference,
      });
      return;
    }

    if (payment.status === PaymentStatus.FAILED) {
      await markOrderPaymentFailed(payment.orderId);
      return;
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      await markOrderRefunded(payment.orderId);
    }
  }

  private async requirePayment(
    businessId: string,
    paymentId: string,
    tx?: Parameters<PaymentRepository["findById"]>[2]
  ) {
    const payment = await this.payments.findById(businessId, paymentId, tx);

    if (!payment) {
      throw new PaymentError("Payment not found", "PAYMENT_NOT_FOUND");
    }

    return payment;
  }
}

function toPaymentDTO(payment: Payment): PaymentDTO {
  return {
    id: payment.id,
    orderId: payment.orderId,
    businessId: payment.businessId,
    method: payment.method,
    status: payment.status,
    amount: decimalToAmountString(payment.amount),
    currency: payment.currency as Iso4217Currency,
    provider: payment.provider,
    providerPaymentId: payment.providerPaymentId,
    providerReference: payment.providerReference,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    paidAt: payment.paidAt,
  };
}

export function hashWebhookPayload(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex");
}

function asProviderId(provider: string): PaymentProviderId {
  if (!(PAYMENT_PROVIDERS as readonly string[]).includes(provider)) {
    throw new PaymentError("Unknown payment provider", "UNKNOWN_PROVIDER");
  }

  return provider as PaymentProviderId;
}

export const paymentService = new PaymentService(paymentProviderRegistry);
