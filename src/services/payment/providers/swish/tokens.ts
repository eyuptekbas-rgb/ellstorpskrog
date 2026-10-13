import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export function swishToken(paymentId: string, purpose: "callback" | "status"): string {
  const secret = process.env.SWISH_CALLBACK_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error("Swish callback secret is not configured");
  return createHmac("sha256", secret).update(`${purpose}:${paymentId}`).digest("hex");
}

export function validSwishToken(paymentId: string, purpose: "callback" | "status", token: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  return timingSafeEqual(Buffer.from(swishToken(paymentId, purpose)), Buffer.from(token));
}
