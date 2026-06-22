import { Prisma } from "@prisma/client";
import type { PaymentProviderRegistry } from "@/src/services/payment/types/provider";
import type {
  ProcessWebhookInput,
  ProcessWebhookResult,
} from "@/src/services/payment/types";
import { PaymentService } from "@/src/services/payment/server/payment-service";
import { hashWebhookPayload } from "@/src/services/payment/server/payment-service";
import { PaymentRepository } from "@/src/services/payment/server/repositories/payment-repository";
import { PaymentWebhookEventRepository } from "@/src/services/payment/server/repositories/payment-webhook-event-repository";
import { webhookPayloadSchema } from "@/src/services/payment/validators/webhook";
import type { ProviderWebhookResult } from "@/src/services/payment/types/provider";

type ResolvedWebhookTarget = {
  duplicate: boolean;
  paymentId: string | null;
  parsed: ProviderWebhookResult | null;
};

export class PaymentWebhookService {
  constructor(
    private readonly registry: PaymentProviderRegistry,
    private readonly paymentService: PaymentService,
    private readonly payments = new PaymentRepository(),
    private readonly webhookEvents = new PaymentWebhookEventRepository()
  ) {}

  async processWebhook(input: ProcessWebhookInput): Promise<ProcessWebhookResult> {
    const data = webhookPayloadSchema.parse(input);
    const provider = this.registry.getProvider(data.provider);
    const payloadHash = hashWebhookPayload(data.rawBody);

    const parsed = await provider.parseWebhook({
      headers: data.headers,
      rawBody: data.rawBody,
      businessId: data.businessId,
      verifiedEvent: data.verifiedEvent,
    });

    const resolved = await this.resolveWebhookTarget(
      data.businessId,
      data.provider,
      parsed,
      payloadHash
    );

    if (resolved.duplicate || !resolved.paymentId || !resolved.parsed) {
      return {
        duplicate: resolved.duplicate,
        paymentId: resolved.paymentId,
        status: null,
      };
    }

    const updated = await this.paymentService.syncPaymentStatus(
      data.businessId,
      resolved.paymentId,
      {
        status: resolved.parsed.status,
        providerPaymentId: resolved.parsed.providerPaymentId,
        providerReference: resolved.parsed.providerReference,
      }
    );

    return {
      duplicate: false,
      paymentId: resolved.paymentId,
      status: updated.status,
    };
  }

  private async resolveWebhookTarget(
    businessId: string,
    providerId: ProcessWebhookInput["provider"],
    parsed: ProviderWebhookResult,
    payloadHash: string
  ): Promise<ResolvedWebhookTarget> {
    try {
      return await this.webhookEvents.transaction(async (tx) => {
        const existing = await this.webhookEvents.findByProviderEvent(
          providerId,
          parsed.eventId,
          tx
        );

        if (existing) {
          return {
            duplicate: true,
            paymentId: existing.paymentId,
            parsed: null,
          };
        }

        let payment = null;

        if (parsed.paymentId) {
          payment = await this.payments.findById(
            businessId,
            parsed.paymentId,
            tx
          );
        }

        if (!payment && parsed.providerPaymentId) {
          payment = await this.payments.findByProviderPaymentId(
            businessId,
            providerId,
            parsed.providerPaymentId,
            tx
          );
        }

        if (!payment && parsed.providerReference) {
          payment = await this.payments.findByProviderReference(
            businessId,
            providerId,
            parsed.providerReference,
            tx
          );
        }

        const orderIdFromEvent = parsed.orderId?.trim();
        if (!payment && orderIdFromEvent) {
          payment = await this.payments.findByOrderId(
            businessId,
            orderIdFromEvent,
            tx
          );
        }

        await this.webhookEvents.create(
          {
            provider: providerId,
            eventId: parsed.eventId,
            paymentId: payment?.id ?? null,
            payloadHash,
          },
          tx
        );

        return {
          duplicate: false,
          paymentId: payment?.id ?? null,
          parsed,
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existing = await this.webhookEvents.findByProviderEvent(
          providerId,
          parsed.eventId
        );

        return {
          duplicate: true,
          paymentId: existing?.paymentId ?? null,
          parsed: null,
        };
      }

      throw error;
    }
  }
}
