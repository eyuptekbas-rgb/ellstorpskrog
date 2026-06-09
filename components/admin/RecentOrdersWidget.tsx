import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  STATUS_LABELS,
  formatOrderDate,
  formatOrderNumber,
  statusStyle,
} from "@/lib/orders";
import type { OrderStatus } from "@prisma/client";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  items: { id: string; quantity: number }[];
};

type Props = {
  orders: Order[];
};

export default function RecentOrdersWidget({ orders }: Props) {
  return (
    <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-white">Senaste ordrar</h2>
          <p className="mt-0.5 text-sm text-white/45">De 5 senaste beställningarna</p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-[#b85c38]/30 hover:text-white"
        >
          Visa alla
          <ArrowRight size={12} />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center">
          <p className="text-sm text-white/45">Inga ordrar i databasen ännu</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {orders.map((order) => {
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/6 bg-[#121212] p-3.5 transition hover:border-[#b85c38]/25 hover:bg-[#161616] sm:p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#b85c38]/10 font-serif text-sm text-[#d4a574]">
                    {itemCount}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-white">
                        {order.customerName}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyle(order.status)}`}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-white/40">
                      {formatOrderNumber(order.orderNumber)} · {order.customerPhone}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-[#e8c4a8]">{order.total} kr</p>
                    <p className="mt-0.5 text-[10px] text-white/35">
                      {formatOrderDate(order.createdAt)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
