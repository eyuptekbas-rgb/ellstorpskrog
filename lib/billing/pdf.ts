import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PlatformInvoiceDocument } from "@/lib/billing/types";
import { formatSek } from "@/lib/billing/calculate";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("sv-SE");
}

export async function generatePlatformInvoicePdf(
  doc: PlatformInvoiceDocument
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  let y = height - 50;
  const left = 50;
  const right = width - 50;

  const drawText = (
    text: string,
    x: number,
    size = 10,
    bold = false,
    color = rgb(0.1, 0.1, 0.1)
  ) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: bold ? fontBold : font,
      color,
    });
  };

  drawText("FAKTURA", left, 22, true);
  y -= 28;
  drawText(doc.payment.companyName, left, 11, true);
  y -= 14;
  if (doc.payment.organizationNumber) {
    drawText(`Org.nr: ${doc.payment.organizationNumber}`, left, 9);
    y -= 12;
  }
  if (doc.payment.address) {
    for (const line of doc.payment.address.split("\n")) {
      drawText(line.trim(), left, 9);
      y -= 12;
    }
  }

  y = height - 50;
  drawText(`Fakturanr: ${doc.invoiceNumber}`, right - 180, 10, true);
  y -= 14;
  drawText(`Fakturadatum: ${formatDate(doc.invoiceDate)}`, right - 180, 9);
  y -= 12;
  drawText(`Förfallodatum: ${formatDate(doc.dueDate)}`, right - 180, 9);
  y -= 12;
  drawText(`Period: ${doc.periodLabel}`, right - 180, 9);

  y = height - 160;
  drawText("Kund", left, 10, true);
  y -= 16;
  drawText(`Kundnr: ${doc.customer.customerNumber}`, left, 9);
  y -= 14;
  drawText(doc.customer.companyName, left, 10, true);
  y -= 14;
  if (doc.customer.organizationNumber) {
    drawText(`Org.nr: ${doc.customer.organizationNumber}`, left, 9);
    y -= 12;
  }
  if (doc.customer.billingAddress) {
    for (const line of doc.customer.billingAddress.split("\n")) {
      drawText(line.trim(), left, 9);
      y -= 12;
    }
  }
  if (doc.customer.invoiceEmail) {
    drawText(doc.customer.invoiceEmail, left, 9);
    y -= 12;
  }

  y -= 20;
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 22;

  drawText("Beskrivning", left, 9, true);
  drawText("Antal", left + 280, 9, true);
  drawText("À-pris", left + 340, 9, true);
  drawText("Belopp", right - 60, 9, true);
  y -= 16;

  for (const line of doc.lines) {
    drawText(line.description, left, 9);
    drawText(String(line.quantity), left + 280, 9);
    drawText(formatSek(line.unitPrice), left + 340, 9);
    drawText(formatSek(line.total), right - 60, 9);
    y -= 16;
  }

  y -= 10;
  page.drawLine({
    start: { x: left + 280, y: y + 8 },
    end: { x: right, y: y + 8 },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  const summary = [
    ["Abonnemang", formatSek(doc.subscriptionFee)],
    ["Order (antal)", String(doc.orderCount)],
    ["Orderavgift", formatSek(doc.orderFeePerOrder)],
    ["Orderavgifter totalt", formatSek(doc.orderFeeTotal)],
    [`Moms (${doc.vatRate}%)`, formatSek(doc.vatAmount)],
    ["Att betala", formatSek(doc.totalAmount)],
  ];

  for (const [label, value] of summary) {
    const isTotal = label === "Att betala";
    drawText(label, left + 280, isTotal ? 11 : 9, isTotal);
    drawText(value, right - 60, isTotal ? 11 : 9, isTotal);
    y -= isTotal ? 18 : 14;
  }

  y -= 30;
  drawText("Betalningsinformation", left, 10, true);
  y -= 16;
  if (doc.payment.iban) {
    drawText(`IBAN: ${doc.payment.iban}`, left, 9);
    y -= 12;
  }
  if (doc.payment.bic) {
    drawText(`BIC: ${doc.payment.bic}`, left, 9);
    y -= 12;
  }
  drawText(`Referens: ${doc.invoiceNumber}`, left, 9);
  y -= 12;
  drawText(`E-post: ${doc.payment.email}`, left, 9);

  y -= 24;
  drawText(
    "Vid frågor om fakturan, kontakta oss på angiven e-postadress.",
    left,
    8,
    false,
    rgb(0.4, 0.4, 0.4)
  );

  return pdf.save();
}

export function pdfToBase64(pdfBytes: Uint8Array): string {
  return Buffer.from(pdfBytes).toString("base64");
}

export function base64ToPdf(base64: string): Buffer {
  return Buffer.from(base64, "base64");
}
