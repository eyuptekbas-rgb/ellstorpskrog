import "server-only";

import Stripe from "stripe";
import {
  resolveStripeProviderConfig,
  type StripeProviderConfig,
} from "@/src/services/payment/providers/stripe/config";

export async function getStripeProviderClient(
  businessId: string
): Promise<{ stripe: Stripe; config: StripeProviderConfig }> {
  const config = await resolveStripeProviderConfig(businessId);

  if (!config?.secretKey) {
    throw new Error("Stripe secret key is not configured for this business");
  }

  return {
    config,
    stripe: new Stripe(config.secretKey, { typescript: true }),
  };
}
