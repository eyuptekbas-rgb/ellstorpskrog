import type { PlatformBillingPaymentInfo } from "@/lib/billing/types";

export function getDefaultBillingVatRate(): number {
  const raw = process.env.ORDINA_BILLING_VAT_RATE ?? "25";
  const rate = Number(raw);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) return 0;
  return Math.round(rate);
}

export function getPlatformBillingPaymentInfo(): PlatformBillingPaymentInfo {
  return {
    companyName: process.env.ORDINA_BILLING_COMPANY ?? "Ordina AB",
    organizationNumber: process.env.ORDINA_BILLING_ORG_NUMBER ?? "",
    address: process.env.ORDINA_BILLING_ADDRESS ?? "",
    email: process.env.ORDINA_BILLING_EMAIL ?? "faktura@ordina.se",
    iban: process.env.ORDINA_BILLING_IBAN ?? "",
    bic: process.env.ORDINA_BILLING_BIC ?? "",
    paymentTermsDays: Number(process.env.ORDINA_BILLING_PAYMENT_DAYS ?? "14"),
  };
}

export function resolveTenantVatRate(billingVatRate: number | null | undefined): number {
  if (typeof billingVatRate === "number" && billingVatRate >= 0 && billingVatRate <= 100) {
    return Math.round(billingVatRate);
  }
  return getDefaultBillingVatRate();
}
