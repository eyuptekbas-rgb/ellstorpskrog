import type { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ListPaymentsInput } from "@/src/services/payment/types";
import { amountStringToDecimal } from "@/src/services/payment/types/decimal";

export type PaymentCreateInput = Omit<
  Prisma.PaymentUncheckedCreateInput,
  "amount"
> & {
  amount: string;
};

export type PaymentDbClient = Prisma.TransactionClient | typeof prisma;

export class PaymentRepository {
  async transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return prisma.$transaction(fn);
  }

  async create(
    businessId: string,
    data: PaymentCreateInput,
    tx: PaymentDbClient = prisma
  ) {
    if (data.businessId !== businessId) {
      throw new Error("businessId mismatch in payment create");
    }

    return tx.payment.create({
      data: {
        ...data,
        amount: amountStringToDecimal(data.amount),
      },
    });
  }

  async update(
    businessId: string,
    id: string,
    data: Prisma.PaymentUncheckedUpdateInput,
    tx: PaymentDbClient = prisma
  ) {
    const result = await tx.payment.updateMany({
      where: { id, businessId },
      data,
    });

    if (result.count === 0) return null;

    return this.findById(businessId, id, tx);
  }

  async updateStatus(
    businessId: string,
    id: string,
    status: PaymentStatus,
    data: Omit<Prisma.PaymentUncheckedUpdateInput, "status"> = {},
    tx: PaymentDbClient = prisma
  ) {
    return this.update(
      businessId,
      id,
      {
        ...data,
        status,
        paidAt: status === "PAID" ? new Date() : data.paidAt,
      },
      tx
    );
  }

  async findById(
    businessId: string,
    id: string,
    tx: PaymentDbClient = prisma
  ) {
    return tx.payment.findFirst({
      where: { id, businessId },
    });
  }

  async findByProviderPaymentId(
    businessId: string,
    provider: string,
    providerPaymentId: string,
    tx: PaymentDbClient = prisma
  ) {
    return tx.payment.findFirst({
      where: {
        businessId,
        provider,
        providerPaymentId,
      },
    });
  }

  async findByProviderReference(
    businessId: string,
    provider: string,
    providerReference: string,
    tx: PaymentDbClient = prisma
  ) {
    return tx.payment.findFirst({
      where: {
        businessId,
        provider,
        providerReference,
      },
    });
  }

  async findByOrderId(
    businessId: string,
    orderId: string,
    tx: PaymentDbClient = prisma
  ) {
    return tx.payment.findFirst({
      where: {
        businessId,
        orderId,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async list(
    businessId: string,
    input: Omit<ListPaymentsInput, "businessId">,
    tx: PaymentDbClient = prisma
  ) {
    return tx.payment.findMany({
      where: {
        businessId,
        ...(input.orderId && { orderId: input.orderId }),
        ...(input.status && { status: input.status }),
        ...(input.method && { method: input.method }),
      },
      orderBy: { createdAt: "desc" },
      take: input.take ?? 50,
      skip: input.skip ?? 0,
    });
  }

  async findOrderForPayment(
    businessId: string,
    orderId: string,
    tx: PaymentDbClient = prisma
  ) {
    return tx.order.findFirst({
      where: { id: orderId, tenantId: businessId },
      select: {
        id: true,
        tenantId: true,
        orderType: true,
        total: true,
      },
    });
  }
}
