"use client";

import { loadConsent } from "@/lib/consent/storage";
import {
  hasAnalyticsConsent,
  hasMarketingConsent,
} from "@/lib/consent/types";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackPurchaseConversion(payload: {
  orderNumber: string;
  value: number;
  currency?: string;
}) {
  const consent = loadConsent();
  const currency = payload.currency ?? "SEK";

  if (hasAnalyticsConsent(consent) && typeof window.gtag === "function") {
    window.gtag("event", "purchase", {
      transaction_id: payload.orderNumber,
      value: payload.value,
      currency,
    });
  }

  if (hasMarketingConsent(consent) && typeof window.fbq === "function") {
    window.fbq("track", "Purchase", {
      value: payload.value,
      currency,
    });
  }
}

export function trackLeadConversion() {
  const consent = loadConsent();

  if (hasAnalyticsConsent(consent) && typeof window.gtag === "function") {
    window.gtag("event", "generate_lead");
  }

  if (hasMarketingConsent(consent) && typeof window.fbq === "function") {
    window.fbq("track", "Lead");
  }
}
