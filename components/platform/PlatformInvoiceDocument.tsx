"use client";

import type { PlatformInvoiceDocument } from "@/lib/billing/types";
import { formatSek } from "@/lib/billing/calculate";
import { INVOICE_STATUS_LABELS } from "@/lib/billing/invoice-data";

type Props = {
  document: PlatformInvoiceDocument;
  onPrint?: () => void;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("sv-SE");
}

export default function PlatformInvoiceDocumentView({ document, onPrint }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white text-[#111] shadow-2xl">
      <div className="border-b border-black/10 px-6 py-5 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7c3aed]">
              Faktura
            </p>
            <h2 className="mt-1 text-2xl font-bold">{document.payment.companyName}</h2>
            {document.payment.organizationNumber && (
              <p className="text-sm text-black/60">
                Org.nr {document.payment.organizationNumber}
              </p>
            )}
            {document.payment.address && (
              <p className="mt-1 whitespace-pre-line text-sm text-black/60">
                {document.payment.address}
              </p>
            )}
          </div>
          <div className="text-right text-sm">
            <p>
              <span className="text-black/50">Fakturanr</span>{" "}
              <strong>{document.invoiceNumber}</strong>
            </p>
            <p>
              <span className="text-black/50">Datum</span>{" "}
              {formatDate(document.invoiceDate)}
            </p>
            <p>
              <span className="text-black/50">Förfallodatum</span>{" "}
              {formatDate(document.dueDate)}
            </p>
            <p>
              <span className="text-black/50">Period</span> {document.periodLabel}
            </p>
            <p className="mt-1 text-xs text-black/45">
              Status: {INVOICE_STATUS_LABELS[document.status] ?? document.status}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-5 sm:grid-cols-2 sm:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-black/45">
            Kund
          </p>
          <p className="font-semibold">{document.customer.companyName}</p>
          <p className="text-sm text-black/60">
            Kundnummer {document.customer.customerNumber}
          </p>
          {document.customer.organizationNumber && (
            <p className="text-sm text-black/60">
              Org.nr {document.customer.organizationNumber}
            </p>
          )}
          {document.customer.billingAddress && (
            <p className="mt-1 whitespace-pre-line text-sm text-black/60">
              {document.customer.billingAddress}
            </p>
          )}
          {document.customer.invoiceEmail && (
            <p className="mt-1 text-sm text-black/60">{document.customer.invoiceEmail}</p>
          )}
        </div>
        <div className="rounded-xl bg-[#f8f5ff] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7c3aed]">
            Att betala
          </p>
          <p className="mt-1 text-3xl font-bold">{formatSek(document.totalAmount)}</p>
        </div>
      </div>

      <div className="px-6 pb-6 sm:px-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-black/50">
              <th className="py-2 font-medium">Beskrivning</th>
              <th className="py-2 font-medium">Antal</th>
              <th className="py-2 font-medium">À-pris</th>
              <th className="py-2 text-right font-medium">Belopp</th>
            </tr>
          </thead>
          <tbody>
            {document.lines.map((line) => (
              <tr key={line.description} className="border-b border-black/5">
                <td className="py-3">{line.description}</td>
                <td className="py-3">{line.quantity}</td>
                <td className="py-3">{formatSek(line.unitPrice)}</td>
                <td className="py-3 text-right font-medium">{formatSek(line.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 space-y-1 border-t border-black/10 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-black/60">Abonnemang</span>
            <span>{formatSek(document.subscriptionFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/60">
              Orderavgift ({document.orderCount} × {formatSek(document.orderFeePerOrder)})
            </span>
            <span>{formatSek(document.orderFeeTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/60">Moms ({document.vatRate}%)</span>
            <span>{formatSek(document.vatAmount)}</span>
          </div>
          <div className="flex justify-between pt-2 text-base font-bold">
            <span>Totalt</span>
            <span>{formatSek(document.totalAmount)}</span>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-black/8 bg-[#fafafa] p-4 text-sm">
          <p className="font-semibold">Betalningsinformation</p>
          {document.payment.iban && <p className="mt-2">IBAN: {document.payment.iban}</p>}
          {document.payment.bic && <p>BIC: {document.payment.bic}</p>}
          <p>Referens: {document.invoiceNumber}</p>
          <p>E-post: {document.payment.email}</p>
        </div>

        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="mt-4 rounded-xl border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            Skriv ut
          </button>
        )}
      </div>
    </div>
  );
}
