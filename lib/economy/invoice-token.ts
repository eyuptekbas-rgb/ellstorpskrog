import { createHmac, timingSafeEqual } from "crypto";

function getSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return secret;
}

export function createInvoiceToken(orderId: string, customerEmail: string): string {
  return createHmac("sha256", getSecret())
    .update(`${orderId}:${customerEmail.trim().toLowerCase()}`)
    .digest("base64url");
}

export function verifyInvoiceToken(
  orderId: string,
  customerEmail: string,
  token: string
): boolean {
  try {
    const expected = createInvoiceToken(orderId, customerEmail);
    const a = Buffer.from(expected);
    const b = Buffer.from(token);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
