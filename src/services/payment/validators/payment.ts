import { z } from "zod";
import { ISO_4217_CURRENCIES } from "@/src/services/payment/types/currencies";
import { isValidPaymentAmount } from "@/src/services/payment/types/decimal";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/src/services/payment/types";

const cuidSchema = z.string().cuid();

const currencySchema = z
  .string()
  .trim()
  .length(3)
  .transform((value) => value.toUpperCase())
  .pipe(z.enum(ISO_4217_CURRENCIES));

const amountSchema = z
  .string()
  .trim()
  .refine(
    isValidPaymentAmount,
    "Amount must be a positive decimal with up to 2 fractional digits"
  );

export const createPaymentSchema = z.object({
  orderId: cuidSchema,
  businessId: cuidSchema,
  method: z.enum(PAYMENT_METHODS),
  amount: amountSchema,
  currency: currencySchema,
  providerReference: z.string().trim().min(1).max(255).nullable().optional(),
});

export const updatePaymentSchema = z.object({
  businessId: cuidSchema,
  paymentId: cuidSchema,
  status: z.enum(PAYMENT_STATUSES).optional(),
  providerPaymentId: z.string().trim().min(1).max(255).nullable().optional(),
  providerReference: z.string().trim().min(1).max(255).nullable().optional(),
  paidAt: z.coerce.date().nullable().optional(),
});

export const listPaymentsSchema = z.object({
  businessId: cuidSchema,
  orderId: cuidSchema.optional(),
  status: z.enum(PAYMENT_STATUSES).optional(),
  method: z.enum(PAYMENT_METHODS).optional(),
  take: z.number().int().min(1).max(100).optional(),
  skip: z.number().int().min(0).optional(),
});

export const paymentOperationSchema = z.object({
  businessId: cuidSchema,
  paymentId: cuidSchema,
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsSchema>;
export type PaymentOperationInput = z.infer<typeof paymentOperationSchema>;
