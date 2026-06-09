"use client";

import { OrderStatus, OrderType, PaymentMethod } from "@prisma/client";
import { Printer } from "lucide-react";
import {
  ORDER_TYPE_LABELS,
  PAYMENT_LABELS,
  STATUS_LABELS,
  formatOrderDate,
  formatOrderNumber,
} from "@/lib/orders";

type OrderItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type PrintOrder = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string | null;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  note: string | null;
  adminNote: string | null;
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
};

type Props = {
  order: PrintOrder;
  restaurantName?: string;
};

export default function OrderPrintButton({ order, restaurantName = "Ellstorps Krog" }: Props) {
  const handlePrint = () => {
    const created = formatOrderDate(new Date(order.createdAt));
    const itemRows = order.items
      .map(
        (item) =>
          `<tr>
            <td>${item.quantity}× ${item.productName}</td>
            <td style="text-align:right">${item.unitPrice} kr</td>
            <td style="text-align:right;font-weight:600">${item.totalPrice} kr</td>
          </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8"/>
  <title>${formatOrderNumber(order.orderNumber)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; font-size: 14px; color: #111; padding: 24px; max-width: 480px; margin: 0 auto; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
    .section { margin-bottom: 16px; }
    .section h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    td { padding: 6px 0; border-bottom: 1px solid #eee; vertical-align: top; }
    .total { display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; margin-top: 12px; padding-top: 12px; border-top: 2px solid #111; }
    .note { background: #f5f5f5; padding: 10px; border-radius: 6px; margin-top: 6px; font-size: 13px; }
    .badge { display: inline-block; background: #111; color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 99px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${restaurantName}</h1>
  <p class="meta">${formatOrderNumber(order.orderNumber)} · ${created} · <span class="badge">${STATUS_LABELS[order.status]}</span></p>

  <div class="section">
    <h2>Kund</h2>
    <p><strong>${order.customerName}</strong></p>
    <p>${order.customerPhone}</p>
    <p>${order.customerEmail}</p>
    ${order.customerAddress ? `<p>${order.customerAddress}</p>` : ""}
  </div>

  <div class="section">
    <h2>Order</h2>
    <p>${ORDER_TYPE_LABELS[order.orderType]} · ${PAYMENT_LABELS[order.paymentMethod]}</p>
    ${order.note ? `<div class="note"><strong>Kundanteckning:</strong> ${order.note}</div>` : ""}
    ${order.adminNote ? `<div class="note"><strong>Intern anteckning:</strong> ${order.adminNote}</div>` : ""}
  </div>

  <div class="section">
    <h2>Produkter</h2>
    <table>
      <thead>
        <tr>
          <td>Artikel</td>
          <td style="text-align:right">À pris</td>
          <td style="text-align:right">Summa</td>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div class="total"><span>Totalt</span><span>${order.total} kr</span></div>
  </div>
</body>
</html>`;

    const win = window.open("", "_blank", "width=520,height=720");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition"
    >
      <Printer size={16} />
      Skriv ut
    </button>
  );
}
