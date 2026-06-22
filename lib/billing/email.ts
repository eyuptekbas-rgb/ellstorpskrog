import { getResendClient } from "@/lib/email/resend";
import { getPlatformBillingPaymentInfo } from "@/lib/billing/platform-config";
import type { PlatformInvoiceDocument } from "@/lib/billing/types";
import { formatSek } from "@/lib/billing/calculate";
import { base64ToPdf } from "@/lib/billing/pdf";

export async function sendPlatformInvoiceEmail(params: {
  to: string;
  document: PlatformInvoiceDocument;
  pdfBase64: string;
}): Promise<{ resendId: string | null; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { resendId: null, error: "E-post är inte konfigurerad (RESEND_API_KEY saknas)" };
  }

  const payment = getPlatformBillingPaymentInfo();
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "no-reply@ordina.se";
  const from = `${payment.companyName} <${fromEmail}>`;

  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `Faktura ${params.document.invoiceNumber} — ${params.document.periodLabel}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; color: #111;">
        <h1 style="font-size: 20px;">Faktura ${params.document.invoiceNumber}</h1>
        <p>Hej ${params.document.customer.companyName},</p>
        <p>Kundnummer: <strong>${params.document.customer.customerNumber}</strong></p>
        <p>Bifogat finner ni faktura för <strong>${params.document.periodLabel}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 6px 0;">Abonnemang</td><td style="text-align: right;">${formatSek(params.document.subscriptionFee)}</td></tr>
          <tr><td style="padding: 6px 0;">Order (${params.document.orderCount} st × ${formatSek(params.document.orderFeePerOrder)})</td><td style="text-align: right;">${formatSek(params.document.orderFeeTotal)}</td></tr>
          <tr><td style="padding: 6px 0;">Moms (${params.document.vatRate}%)</td><td style="text-align: right;">${formatSek(params.document.vatAmount)}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Att betala</td><td style="text-align: right; font-weight: bold;">${formatSek(params.document.totalAmount)}</td></tr>
        </table>
        <p style="font-size: 14px; color: #555;">Betalningsreferens: ${params.document.invoiceNumber}</p>
        <p style="font-size: 13px; color: #666;">Vid frågor, svara på detta mail eller kontakta ${payment.email}.</p>
      </div>
    `,
    attachments: [
      {
        filename: `${params.document.invoiceNumber}.pdf`,
        content: base64ToPdf(params.pdfBase64),
      },
    ],
  });

  if (error) {
    return { resendId: null, error: error.message };
  }

  return { resendId: data?.id ?? null };
}
