import type { PaymentProvider } from "@/src/services/payment/types/provider";
import { StubPaymentProvider } from "@/src/services/payment/providers/stub-provider";

export type MobilePayPaymentProvider = PaymentProvider;

export const mobilePayPaymentProvider: MobilePayPaymentProvider =
  new StubPaymentProvider("mobilepay");
