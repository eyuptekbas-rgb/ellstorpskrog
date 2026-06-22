import type {
  BusinessPaymentSettings,
  Payment,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import type { PaymentAmount } from "@/src/services/payment/types/decimal";
import type { Iso4217Currency } from "@/src/services/payment/types/currencies";

export const PAYMENT_METHODS = [
  "CARD",
  "APPLE_PAY",
  "GOOGLE_PAY",
  "SWISH",
  "MOBILEPAY",
] as const satisfies readonly PaymentMethod[];

export const PAYMENT_STATUSES = [
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
] as const satisfies readonly PaymentStatus[];

export const PAYMENT_PROVIDERS = ["stripe", "swish", "mobilepay"] as const;

export type PaymentProviderId = (typeof PAYMENT_PROVIDERS)[number];

export type PaymentDTO = {
  id: Payment["id"];
  orderId: Payment["orderId"];
  businessId: Payment["businessId"];
  method: Payment["method"];
  status: Payment["status"];
  amount: PaymentAmount;
  currency: Iso4217Currency;
  provider: Payment["provider"];
  providerPaymentId: Payment["providerPaymentId"];
  providerReference: Payment["providerReference"];
  createdAt: Payment["createdAt"];
  updatedAt: Payment["updatedAt"];
  paidAt: Payment["paidAt"];
};

export type CreatePaymentDTO = {
  orderId: string;
  businessId: string;
  method: PaymentMethod;
  amount: PaymentAmount;
  currency: Iso4217Currency;
  providerReference?: string | null;
};

export type UpdatePaymentDTO = {
  status?: PaymentStatus;
  providerPaymentId?: string | null;
  providerReference?: string | null;
  paidAt?: Date | null;
};

export type PaymentRequest = {
  orderId: string;
  businessId: string;
  method: PaymentMethod;
  amount: PaymentAmount;
  currency: Iso4217Currency;
  providerReference?: string | null;
  paymentId?: string;
};

export type PaymentResult = {
  success: boolean;
  status: PaymentStatus;
  providerPaymentId?: string | null;
  providerReference?: string | null;
  errorCode?: string;
  errorMessage?: string;
};

export type PaymentResponse = {
  payment: PaymentDTO;
  requiresAction: boolean;
  actionUrl?: string;
};

export type ListPaymentsInput = {
  businessId: string;
  orderId?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  take?: number;
  skip?: number;
};

export type BusinessPaymentSettingsDTO = Omit<
  BusinessPaymentSettings,
  "stripeSecretKey"
>;

export type PaymentMethodSettings = Pick<
  BusinessPaymentSettings,
  | "cardEnabled"
  | "applePayEnabled"
  | "googlePayEnabled"
  | "swishEnabled"
  | "mobilePayEnabled"
>;

export type PaymentWebhookEventDTO = {
  provider: string;
  eventId: string;
  paymentId: string | null;
  payloadHash: string;
  processedAt: Date;
};

export type ProcessWebhookInput = {
  businessId: string;
  provider: PaymentProviderId;
  headers: Headers;
  rawBody: string;
  verifiedEvent?: unknown;
};

export type ProcessWebhookResult = {
  duplicate: boolean;
  paymentId: string | null;
  status: PaymentStatus | null;
};
