import type { PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PaymentDbClient } from "@/src/services/payment/server/repositories/payment-repository";

const STRIPE_METHODS = new Set<PaymentMethod>([
  "CARD",
  "APPLE_PAY",
  "GOOGLE_PAY",
]);

const OFFLINE_METHODS = new Set<PaymentMethod>(["ON_PICKUP", "ON_DELIVERY"]);

const METHOD_SETTING_KEYS = {
  CARD: "cardEnabled",
  APPLE_PAY: "applePayEnabled",
  GOOGLE_PAY: "googlePayEnabled",
  SWISH: "swishEnabled",
  MOBILEPAY: "mobilePayEnabled",
} as const;

export type BusinessPaymentSettingsUpsertInput = Partial<
  Omit<
    Prisma.BusinessPaymentSettingsUncheckedCreateInput,
    "businessId" | "createdAt" | "updatedAt"
  >
>;

export class BusinessPaymentSettingsRepository {
  async findByBusinessId(businessId: string, tx: PaymentDbClient = prisma) {
    return tx.businessPaymentSettings.findUnique({
      where: { businessId },
    });
  }

  async upsert(
    businessId: string,
    data: BusinessPaymentSettingsUpsertInput
  ) {
    return prisma.businessPaymentSettings.upsert({
      where: { businessId },
      create: {
        businessId,
        ...data,
      },
      update: data,
    });
  }

  async isPaymentMethodEnabled(
    businessId: string,
    method: PaymentMethod,
    tx: PaymentDbClient = prisma
  ) {
    if (OFFLINE_METHODS.has(method)) {
      return true;
    }

    const settings = await this.findByBusinessId(businessId, tx);
    if (settings) {
      const key = METHOD_SETTING_KEYS[method as keyof typeof METHOD_SETTING_KEYS];
      return Boolean(settings[key]);
    }

    if (STRIPE_METHODS.has(method)) {
      const siteSettings = await tx.siteSettings.findUnique({
        where: { tenantId: businessId },
        select: { stripeEnabled: true },
      });
      return Boolean(siteSettings?.stripeEnabled);
    }

    return false;
  }
}
