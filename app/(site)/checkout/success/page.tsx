"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/checkout/LoadingSpinner";
import SuccessView from "@/components/checkout/SuccessView";
import { clearCart, clearOrderNote } from "@/lib/cart";
import { trackPurchaseConversion } from "@/lib/marketing/events";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const cashOrder = searchParams.get("cash") === "1";
  const cashOrderId = searchParams.get("order_id");

  const [orderNumber, setOrderNumber] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(Boolean(sessionId || cashOrderId));
  const [error, setError] = useState("");

  useEffect(() => {
    clearCart();
    clearOrderNote();
  }, []);

  useEffect(() => {
    if (cashOrder && cashOrderId) {
      fetch(`/api/checkout/cash?order_id=${encodeURIComponent(cashOrderId)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data: { orderNumber: string; total: number }) => {
          setOrderNumber(data.orderNumber);
          setTotal(data.total);
          trackPurchaseConversion({
            orderNumber: data.orderNumber,
            value: data.total,
          });
        })
        .catch(() => setError("Kunde inte verifiera beställningen."))
        .finally(() => setLoading(false));
      return;
    }

    if (cashOrder) {
      queueMicrotask(() => {
        setError("Kunde inte verifiera beställningen.");
        setLoading(false);
      });
      return;
    }

    if (!sessionId) {
      queueMicrotask(() => {
        setError("Ingen betalningssession hittades.");
        setLoading(false);
      });
      return;
    }

    fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { orderNumber: string; total: number }) => {
        setOrderNumber(data.orderNumber);
        setTotal(data.total);
        trackPurchaseConversion({
          orderNumber: data.orderNumber,
          value: data.total,
        });
      })
      .catch(() => setError("Kunde inte verifiera betalningen."))
      .finally(() => setLoading(false));
  }, [sessionId, cashOrder, cashOrderId]);

  return (
    <SuccessView
      loading={loading}
      error={error}
      orderNumber={orderNumber}
      total={total}
      cashOrder={cashOrder}
    />
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-4 pt-10 pb-28">
      <div className="mx-auto max-w-lg text-center">
        <Suspense fallback={<LoadingSpinner label="Laddar…" size="lg" />}>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
