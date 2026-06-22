import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PaymentProviderId } from "@/src/services/payment/types";
import type { PaymentDbClient } from "@/src/services/payment/server/repositories/payment-repository";

export type PaymentWebhookEventCreateInput = {
  provider: PaymentProviderId;
  eventId: string;
  paymentId?: string | null;
  payloadHash: string;
};

export class PaymentWebhookEventRepository {
  async transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return prisma.$transaction(fn);
  }

  async findByProviderEvent(
    provider: string,
    eventId: string,
    tx: PaymentDbClient = prisma
  ) {
    return tx.paymentWebhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider,
          eventId,
        },
      },
    });
  }

  async create(
    input: PaymentWebhookEventCreateInput,
    tx: PaymentDbClient = prisma
  ) {
    return tx.paymentWebhookEvent.create({
      data: {
        provider: input.provider,
        eventId: input.eventId,
        paymentId: input.paymentId ?? null,
        payloadHash: input.payloadHash,
      },
    });
  }
}
