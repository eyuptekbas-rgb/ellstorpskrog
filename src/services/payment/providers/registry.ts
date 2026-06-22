import type { PaymentMethod } from "@prisma/client";
import type { PaymentProviderId } from "@/src/services/payment/types";
import type { PaymentProviderRegistry } from "@/src/services/payment/types/provider";
import { mobilePayPaymentProvider } from "@/src/services/payment/providers/mobilepay";
import { stripePaymentProvider } from "@/src/services/payment/providers/stripe";
import { swishPaymentProvider } from "@/src/services/payment/providers/swish";

type OnlinePaymentMethod = Exclude<PaymentMethod, "ON_PICKUP" | "ON_DELIVERY">;

const PROVIDER_BY_METHOD = {
  CARD: "stripe",
  APPLE_PAY: "stripe",
  GOOGLE_PAY: "stripe",
  SWISH: "swish",
  MOBILEPAY: "mobilepay",
} as const satisfies Record<OnlinePaymentMethod, PaymentProviderId>;

const PROVIDERS = {
  stripe: stripePaymentProvider,
  swish: swishPaymentProvider,
  mobilepay: mobilePayPaymentProvider,
} as const;

export class DefaultPaymentProviderRegistry implements PaymentProviderRegistry {
  resolveProviderId(method: PaymentMethod): PaymentProviderId {
    if (method === "ON_PICKUP" || method === "ON_DELIVERY") {
      throw new Error(`No payment provider for offline method ${method}`);
    }

    return PROVIDER_BY_METHOD[method];
  }

  getProvider(providerId: PaymentProviderId) {
    return PROVIDERS[providerId];
  }
}

export const paymentProviderRegistry = new DefaultPaymentProviderRegistry();
