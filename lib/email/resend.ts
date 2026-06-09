import { Resend } from "resend";
import type { SiteSettings } from "@prisma/client";

let resendClient: Resend | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export function getFromAddress(settings: SiteSettings): string;
export function getFromAddress(restaurantName: string): string;
export function getFromAddress(settingsOrName: SiteSettings | string): string {
  if (typeof settingsOrName === "string") {
    const email =
      process.env.RESEND_FROM_EMAIL ?? "no-reply@ellstorpskrog.se";
    return `${settingsOrName} <${email}>`;
  }

  const settings = settingsOrName;
  const name =
    settings.emailSenderName?.trim() ||
    settings.restaurantName ||
    "Ellstorps Krog";
  const email =
    settings.emailSenderAddress?.trim() ||
    process.env.RESEND_FROM_EMAIL ||
    "no-reply@ellstorpskrog.se";
  return `${name} <${email}>`;
}
