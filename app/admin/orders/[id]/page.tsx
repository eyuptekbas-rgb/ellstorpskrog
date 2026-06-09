import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureSiteSettings } from "@/lib/settings";
import { getDbErrorMessage, isPrismaConnectionError } from "@/lib/db/errors";
import {
  ORDER_TYPE_LABELS,
  PAYMENT_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  formatOrderDate,
  formatOrderNumber,
  paymentStatusStyle,
  statusStyle,
} from "@/lib/orders";
import OrderStatusUpdater from "@/app/admin/orders/[id]/OrderStatusUpdater";
import OrderAdminNote from "@/app/admin/orders/[id]/OrderAdminNote";
import OrderPrintButton from "@/app/admin/orders/[id]/OrderPrintButton";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  let order;
  let restaurantName = "Ellstorps Krog";

  try {
    const [orderResult, settings] = await Promise.all([
      prisma.order.findUnique({
        where: { id },
        include: {
          items: { orderBy: { productName: "asc" } },
          statusHistory: { orderBy: { createdAt: "desc" } },
        },
      }),
      ensureSiteSettings(),
    ]);

    order = orderResult;
    restaurantName = settings.restaurantName;
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return (
        <div className="px-5 py-8">
          <Link
            href="/admin/orders"
            className="inline-flex text-sm text-white/50 hover:text-white mb-6"
          >
            ← Tillbaka
          </Link>
          <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-2xl p-6 text-yellow-200 text-sm">
            <p className="font-medium mb-2">Databasen är inte tillgänglig</p>
            <p className="text-yellow-200/70 text-xs">{getDbErrorMessage(error)}</p>
          </div>
        </div>
      );
    }
    throw error;
  }

  if (!order) notFound();

  const printOrder = {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    customerAddress: order.customerAddress,
    orderType: order.orderType,
    paymentMethod: order.paymentMethod,
    note: order.note,
    adminNote: order.adminNote,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
  };

  return (
    <div className="px-5 py-8 pb-12">
      <Link
        href="/admin/orders"
        className="inline-flex text-sm text-white/50 hover:text-white mb-6 transition"
      >
        ← Tillbaka till beställningar
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs text-[#b85c38] uppercase tracking-wide mb-1">
            {formatOrderNumber(order.orderNumber)}
          </p>
          <h1 className="text-2xl font-serif">{order.customerName}</h1>
          <p className="text-white/50 text-sm mt-1">
            Beställd {formatOrderDate(order.createdAt)}
          </p>
          {order.updatedAt.getTime() !== order.createdAt.getTime() && (
            <p className="text-white/40 text-xs mt-0.5">
              Uppdaterad {formatOrderDate(order.updatedAt)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-xs font-medium px-3 py-1.5 rounded-full ${statusStyle(order.status)}`}
          >
            {STATUS_LABELS[order.status]}
          </span>
          <span
            className={`text-xs font-medium px-3 py-1.5 rounded-full ${paymentStatusStyle(order.paymentStatus)}`}
          >
            {PAYMENT_STATUS_LABELS[order.paymentStatus]}
          </span>
          <OrderPrintButton order={printOrder} restaurantName={restaurantName} />
        </div>
      </div>

      <div className="space-y-4">
        <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-3">
          <h2 className="text-lg font-serif text-[#b85c38]">Kunduppgifter</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-white/40 text-xs">Namn</p>
              <p>{order.customerName}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Telefon</p>
              <p>
                <a
                  href={`tel:${order.customerPhone.replace(/\s/g, "")}`}
                  className="hover:text-[#b85c38] transition"
                >
                  {order.customerPhone}
                </a>
              </p>
            </div>
            <div>
              <p className="text-white/40 text-xs">E-post</p>
              <p>
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="hover:text-[#b85c38] transition break-all"
                >
                  {order.customerEmail}
                </a>
              </p>
            </div>
            {order.customerAddress && (
              <div className="sm:col-span-2">
                <p className="text-white/40 text-xs">Leveransadress</p>
                <p>{order.customerAddress}</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-3">
          <h2 className="text-lg font-serif text-[#b85c38]">Orderdetaljer</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-white/40 text-xs">Typ</p>
              <p>{ORDER_TYPE_LABELS[order.orderType]}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Betalning</p>
              <p>{PAYMENT_LABELS[order.paymentMethod]}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Betalstatus</p>
              <p>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Totalt</p>
              <p className="text-[#b85c38] font-semibold">{order.total} kr</p>
            </div>
            {order.stripeSessionId && (
              <div className="sm:col-span-2">
                <p className="text-white/40 text-xs">Stripe session</p>
                <p className="font-mono text-xs break-all text-white/70">
                  {order.stripeSessionId}
                </p>
              </div>
            )}
            {order.paymentIntentId && (
              <div className="sm:col-span-2">
                <p className="text-white/40 text-xs">Payment intent</p>
                <p className="font-mono text-xs break-all text-white/70">
                  {order.paymentIntentId}
                </p>
              </div>
            )}
          </div>
          {order.note && (
            <div>
              <p className="text-white/40 text-xs mb-1">Kundanteckning</p>
              <p className="text-sm bg-[#111] rounded-xl p-3 text-white/80">
                {order.note}
              </p>
            </div>
          )}
        </section>

        <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-3">
          <h2 className="text-lg font-serif text-[#b85c38]">Produkter</h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 text-sm bg-[#111] rounded-xl p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {item.quantity}× {item.productName}
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {item.unitPrice} kr/st
                  </p>
                </div>
                <span className="font-semibold text-[#b85c38] shrink-0">
                  {item.totalPrice} kr
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <span className="text-white/60">
              {order.items.reduce((s, i) => s + i.quantity, 0)} artiklar
            </span>
            <span className="text-xl font-semibold text-[#b85c38]">
              {order.total} kr
            </span>
          </div>
        </section>

        <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-serif text-[#b85c38]">Ändra status</h2>
          <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
        </section>

        <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-serif text-[#b85c38]">Intern adminanteckning</h2>
          <p className="text-white/40 text-xs">
            Syns bara i admin — skrivs inte ut till kunden om inte du väljer att
            inkludera den vid utskrift.
          </p>
          <OrderAdminNote orderId={order.id} initialNote={order.adminNote} />
        </section>

        <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-serif text-[#b85c38]">Statushistorik</h2>
          {order.statusHistory.length === 0 ? (
            <p className="text-white/50 text-sm">Ingen historik</p>
          ) : (
            <div className="space-y-0">
              {order.statusHistory.map((entry, index) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <div
                      className={`w-3 h-3 rounded-full shrink-0 ${index === 0 ? "bg-[#b85c38]" : "bg-white/20"}`}
                    />
                    {index < order.statusHistory.length - 1 && (
                      <div className="w-px flex-1 bg-white/10 my-1 min-h-[24px]" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-sm">
                      {STATUS_LABELS[entry.status]}
                    </p>
                    <p className="text-white/40 text-xs">
                      {formatOrderDate(entry.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
