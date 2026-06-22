import type { InvoiceCalculation } from "@/lib/billing/types";

export function calculateInvoiceAmount(
  subscriptionFee: number,
  orderCount: number,
  orderFeePerOrder: number,
  vatRate = 0
): InvoiceCalculation {
  const orderFeeTotal = orderCount * orderFeePerOrder;
  const subtotal = subscriptionFee + orderFeeTotal;
  const vatAmount = Math.round(subtotal * (vatRate / 100));
  const totalAmount = subtotal + vatAmount;

  return {
    subscriptionFee,
    orderCount,
    orderFeePerOrder,
    orderFeeTotal,
    vatRate,
    vatAmount,
    totalAmount,
  };
}

export function formatSek(amount: number): string {
  return `${amount.toLocaleString("sv-SE")} kr`;
}
