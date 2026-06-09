import Stripe from "stripe";
import { getStripeConfig } from "@/lib/stripe/config";

export async function getStripeClient(): Promise<Stripe> {
  const config = await getStripeConfig();

  if (!config.secretKey) {
    throw new Error("Stripe secret key is not configured");
  }

  return new Stripe(config.secretKey, {
    typescript: true,
  });
}
