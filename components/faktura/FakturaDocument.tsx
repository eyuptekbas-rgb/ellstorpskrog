"use client";

import { Printer } from "lucide-react";
import type { InvoiceData } from "@/lib/economy/invoice";
import { formatSek } from "@/lib/economy/invoice";

type Props = {
  invoice: InvoiceData;
  showPrintButton?: boolean;
  className?: string;
};

export default function FakturaDocument({
  invoice,
  showPrintButton = true,
  className = "",
}: Props) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <article
      className={`faktura-document mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white text-[#111] shadow-xl ${className}`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#eee] px-6 py-5 sm:px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#888]">
            Faktura
          </p>
          <h1 className="mt-1 font-serif text-2xl text-[#111]">
            {invoice.restaurant.name}
          </h1>
          <p className="mt-2 text-sm text-[#555]">{invoice.restaurant.address}</p>
          <p className="text-sm text-[#555]">{invoice.restaurant.phone}</p>
          <p className="text-sm text-[#555]">{invoice.restaurant.email}</p>
        </div>
        {showPrintButton && (
          <button
            type="button"
            onClick={handlePrint}
            className="faktura-print-btn inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#ddd] bg-[#fafafa] px-4 py-2.5 text-sm font-medium text-[#333] transition hover:bg-[#f0f0f0]"
          >
            <Printer size={16} />
            Skriv ut
          </button>
        )}
      </div>

      <div className="grid gap-6 px-6 py-5 sm:grid-cols-2 sm:px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#888]">
            Fakturauppgifter
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#666]">Fakturanummer</dt>
              <dd className="font-semibold">{invoice.invoiceNumber}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#666]">Fakturadatum</dt>
              <dd>{invoice.invoiceDate}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#666]">Betalstatus</dt>
              <dd>{invoice.paymentStatusLabel}</dd>
            </div>
          </dl>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#888]">
            Kund
          </p>
          <div className="mt-3 text-sm">
            <p className="font-semibold">{invoice.customer.name}</p>
            <p className="text-[#555]">{invoice.customer.email}</p>
            <p className="text-[#555]">{invoice.customer.phone}</p>
            {invoice.customer.address && (
              <p className="text-[#555]">{invoice.customer.address}</p>
            )}
          </div>
        </div>
      </div>

      <div className="border-y border-[#eee] px-6 py-4 sm:px-8">
        <p className="text-sm text-[#555]">
          {invoice.orderTypeLabel} · {invoice.paymentMethodLabel} ·{" "}
          {invoice.orderStatusLabel}
        </p>
        {invoice.orderNote && (
          <p className="mt-2 rounded-lg bg-[#f7f7f7] px-3 py-2 text-sm text-[#555]">
            <span className="font-medium">Meddelande:</span> {invoice.orderNote}
          </p>
        )}
      </div>

      <div className="overflow-x-auto px-6 py-5 sm:px-8">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-[#eee] text-left text-[11px] uppercase tracking-wide text-[#888]">
              <th className="pb-3 pr-3 font-semibold">Artikel</th>
              <th className="pb-3 pr-3 text-right font-semibold">Antal</th>
              <th className="pb-3 pr-3 text-right font-semibold">À pris</th>
              <th className="pb-3 text-right font-semibold">Summa</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, index) => (
              <tr key={index} className="border-b border-[#f0f0f0] align-top">
                <td className="py-3 pr-3">
                  <p className="font-medium">{line.name}</p>
                  {line.options.length > 0 && (
                    <p className="mt-1 text-xs text-[#666]">
                      + {line.options.join(" · ")}
                    </p>
                  )}
                  {line.note && (
                    <p className="mt-1 text-xs italic text-[#777]">
                      &ldquo;{line.note}&rdquo;
                    </p>
                  )}
                </td>
                <td className="py-3 pr-3 text-right tabular-nums">{line.quantity}</td>
                <td className="py-3 pr-3 text-right tabular-nums">
                  {formatSek(line.unitPrice)}
                </td>
                <td className="py-3 text-right font-medium tabular-nums">
                  {formatSek(line.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-[#eee] px-6 py-5 sm:px-8">
        <div className="ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between gap-4 text-[#555]">
            <span>Delsumma</span>
            <span className="tabular-nums">{formatSek(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-[#111] pt-3 text-lg font-bold">
            <span>Totalt att betala</span>
            <span className="tabular-nums">{formatSek(invoice.total)}</span>
          </div>
        </div>
        <p className="mt-4 text-xs text-[#777]">{invoice.vatNote}</p>
        <p className="mt-2 text-xs text-[#999]">
          Tack för din beställning hos {invoice.restaurant.name}.
        </p>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .faktura-document,
          .faktura-document * {
            visibility: visible;
          }
          .faktura-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
            border-radius: 0;
          }
          .faktura-print-btn {
            display: none !important;
          }
        }
      `}</style>
    </article>
  );
}
