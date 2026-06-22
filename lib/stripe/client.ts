import Stripe from "stripe";
import { getStripeConfig } from "@/lib/stripe/config";

export async function getStripeClient(tenantId?: string): Promise<Stripe> {
  const config = await getStripeConfig(tenantId);

  if (!config.secretKey) {
    throw new Error("Stripe secret key is not configured");
  }

  return new Stripe(config.secretKey, {
    typescript: true,
  });
}
