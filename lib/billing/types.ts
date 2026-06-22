import type { PlatformInvoiceStatus } from "@prisma/client";

export type BillingPeriod = {
  year: number;
  month: number;
};

export type InvoiceCalculation = {
  subscriptionFee: number;
  orderCount: number;
  orderFeePerOrder: number;
  orderFeeTotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
};

export type PlatformBillingPaymentInfo = {
  companyName: string;
  organizationNumber: string;
  address: string;
  email: string;
  iban: string;
  bic: string;
  paymentTermsDays: number;
};

export type PlatformInvoiceDocument = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  periodLabel: string;
  customer: {
    customerNumber: string;
    companyName: string;
    organizationNumber: string | null;
    billingAddress: string | null;
    invoiceEmail: string | null;
    tenantName: string;
  };
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subscriptionFee: number;
  orderCount: number;
  orderFeePerOrder: number;
  orderFeeTotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  payment: PlatformBillingPaymentInfo;
  status: PlatformInvoiceStatus;
};

export type TenantBillingRow = {
  id: string;
  customerNumber: string | null;
  name: string;
  slug: string;
  active: boolean;
  companyName: string | null;
  organizationNumber: string | null;
  billingAddress: string | null;
  invoiceEmail: string | null;
  monthlySubscriptionFee: number;
  orderFee: number;
  billingVatRate: number | null;
  effectiveVatRate: number;
  ordersToday: number;
  ordersThisMonth: number;
  currentInvoiceAmount: number;
  currentPeriod: BillingPeriod;
  currentInvoice: {
    id: string;
    invoiceNumber: string;
    status: PlatformInvoiceStatus;
    totalAmount: number;
    sentAt: string | null;
  } | null;
  lastInvoiceSentAt: string | null;
};

export type BillingDashboardStats = {
  monthlyRevenue: number;
  outstandingInvoices: number;
  paidInvoices: number;
  totalOrderFees: number;
  totalSubscriptionFees: number;
  period: BillingPeriod;
};
