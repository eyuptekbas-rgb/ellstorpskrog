"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from "@prisma/client";
import { RefreshCw, Search } from "lucide-react";
import {
  ADMIN_ORDER_FILTERS,
  AdminOrderFilter,
  ORDER_TYPE_LABELS,
  PAYMENT_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  formatOrderDate,
  formatOrderNumber,
  paymentStatusStyle,
  statusStyle,
} from "@/lib/orders";
import StatusSelect from "@/app/admin/orders/StatusSelect";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: { id: string; quantity: number; productName: string }[];
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminOrderFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (!res.ok) throw new Error();
      setOrders(await res.json());
    } catch {
      setError("Kunde inte hämta beställningar.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchOrders, 300);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      await fetchOrders();
    } catch {
      setError("Kunde inte uppdatera status.");
    }
  };

  return (
    <div className="px-5 py-8 pb-12">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-serif tracking-wide">Beställningar</h1>
          <div className="w-16 h-[2px] bg-[#b85c38] rounded-full mt-3 mb-2" />
          <p className="text-white/60 text-sm">
            {loading ? "Laddar…" : `${orders.length} ordrar · nyast först`}
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-sm text-white/70 transition disabled:opacity-50"
          title="Uppdatera"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
        />
        <input
          type="search"
          placeholder="Sök ordernummer, namn eller telefon…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#b85c38]/50 transition"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
        {ADMIN_ORDER_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              statusFilter === key
                ? "bg-[#b85c38] text-white"
                : "bg-[#1a1a1a] text-white/60 border border-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-2xl p-4 text-red-300 text-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-white/50 text-center py-12">Laddar beställningar…</p>
      ) : orders.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-12 text-center">
          <p className="text-white/50">Inga beställningar hittades</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <article
                key={order.id}
                className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-xs text-[#b85c38] font-medium mb-1">
                      {formatOrderNumber(order.orderNumber)}
                    </p>
                    <h2 className="font-semibold text-lg hover:text-[#b85c38] transition">
                      {order.customerName}
                    </h2>
                    <p className="text-white/60 text-sm mt-1">
                      {order.customerPhone}
                    </p>
                    <p className="text-white/40 text-xs mt-1">
                      {ORDER_TYPE_LABELS[order.orderType]} ·{" "}
                      {PAYMENT_LABELS[order.paymentMethod]} · {itemCount}{" "}
                      {itemCount === 1 ? "artikel" : "artiklar"}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${paymentStatusStyle(order.paymentStatus)}`}
                      >
                        {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                      </span>
                    </div>
                  </Link>
                  <span
                    className={`shrink-0 text-xs font-medium px-3 py-1 rounded-full ${statusStyle(order.status)}`}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 gap-3">
                  <span className="text-white/50 text-sm">
                    {formatOrderDate(new Date(order.createdAt))}
                  </span>
                  <span className="text-[#b85c38] font-semibold">
                    {order.total} kr
                  </span>
                </div>

                <div className="mt-3">
                  <StatusSelect
                    value={order.status}
                    onChange={(status) => handleStatusChange(order.id, status)}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
