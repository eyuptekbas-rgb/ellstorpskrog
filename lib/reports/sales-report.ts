import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ReportPeriod = {
  from: Date;
  to: Date;
  label: string;
};

export type SalesReport = {
  period: ReportPeriod;
  grossSales: number;
  netSales: number;
  orderCount: number;
  cancelledCount: number;
  averageTicket: number;
  paymentBreakdown: { method: PaymentMethod; count: number; total: number }[];
  cashExpected: number;
  cardExpected: number;
  refunds: number;
};

function todayPeriod(): ReportPeriod {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date();
  return { from, to, label: "Today" };
}

export function getReportPeriod(kind: "x" | "z" | "daily"): ReportPeriod {
  if (kind === "daily" || kind === "z") return todayPeriod();
  const from = new Date(Date.now() - 8 * 60 * 60 * 1000);
  return { from, to: new Date(), label: "Shift (8h)" };
}

export async function buildSalesReport(
  tenantId: string,
  kind: "x" | "z" | "daily"
): Promise<SalesReport> {
  const period = getReportPeriod(kind);

  const orders = await prisma.order.findMany({
    where: { tenantId, createdAt: { gte: period.from, lte: period.to } },
    select: {
      total: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
    },
  });

  const active = orders.filter((o) => o.status !== OrderStatus.CANCELLED);
  const cancelled = orders.filter((o) => o.status === OrderStatus.CANCELLED);
  const paid = active.filter(
    (o) =>
      o.paymentStatus === PaymentStatus.PAID ||
      o.status === OrderStatus.COMPLETED
  );
  const refunds = orders.filter(
    (o) => o.paymentStatus === PaymentStatus.REFUNDED
  );

  const grossSales = paid.reduce((sum, o) => sum + o.total, 0);
  const refundTotal = refunds.reduce((sum, o) => sum + o.total, 0);
  const netSales = grossSales - refundTotal;

  const paymentMap = new Map<PaymentMethod, { count: number; total: number }>();
  for (const order of paid) {
    const row = paymentMap.get(order.paymentMethod) ?? { count: 0, total: 0 };
    row.count += 1;
    row.total += order.total;
    paymentMap.set(order.paymentMethod, row);
  }

  const paymentBreakdown = [...paymentMap.entries()].map(([method, stats]) => ({
    method,
    ...stats,
  }));

  const cashMethods: PaymentMethod[] = [PaymentMethod.SWISH, PaymentMethod.MOBILEPAY];
  const cashExpected = paid
    .filter((o) => cashMethods.includes(o.paymentMethod))
    .reduce((sum, o) => sum + o.total, 0);
  const cardExpected = grossSales - cashExpected;

  return {
    period,
    grossSales,
    netSales,
    orderCount: active.length,
    cancelledCount: cancelled.length,
    averageTicket: paid.length ? Math.round(grossSales / paid.length) : 0,
    paymentBreakdown,
    cashExpected,
    cardExpected,
    refunds: refundTotal,
  };
}

export type CashReconciliation = {
  expectedCash: number;
  countedCash: number;
  variance: number;
  notes?: string;
};

export function reconcileCash(
  expectedCash: number,
  countedCash: number,
  notes?: string
): CashReconciliation {
  return {
    expectedCash,
    countedCash,
    variance: countedCash - expectedCash,
    notes,
  };
}

export function reportToCsv(report: SalesReport): string {
  const lines = [
    "Report,Value",
    `Period,${report.period.label}`,
    `Gross Sales,${report.grossSales}`,
    `Net Sales,${report.netSales}`,
    `Orders,${report.orderCount}`,
    `Cancelled,${report.cancelledCount}`,
    `Average Ticket,${report.averageTicket}`,
    `Cash Expected,${report.cashExpected}`,
    `Card Expected,${report.cardExpected}`,
    `Refunds,${report.refunds}`,
    "",
    "Payment Method,Count,Total",
    ...report.paymentBreakdown.map(
      (row) => `${row.method},${row.count},${row.total}`
    ),
  ];
  return lines.join("\n");
}

export async function reportToPdfBytes(report: SalesReport): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  const draw = (text: string, size = 11, useBold = false) => {
    page.drawText(text, {
      x: 50,
      y,
      size,
      font: useBold ? bold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= size + 8;
  };

  draw(`${report.period.label} Report`, 18, true);
  draw(`Generated: ${new Date().toISOString()}`);
  draw(`Gross sales: ${report.grossSales} SEK`);
  draw(`Net sales: ${report.netSales} SEK`);
  draw(`Orders: ${report.orderCount}`);
  draw(`Average ticket: ${report.averageTicket} SEK`);
  draw(`Cash expected: ${report.cashExpected} SEK`);
  draw(`Card expected: ${report.cardExpected} SEK`);
  draw(`Refunds: ${report.refunds} SEK`);

  return pdf.save();
}
