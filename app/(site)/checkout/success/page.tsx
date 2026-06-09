"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/checkout/LoadingSpinner";
import SuccessView from "@/components/checkout/SuccessView";
import { clearCart } from "@/lib/cart";
import { trackPurchaseConversion } from "@/lib/marketing/events";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const cashOrder = searchParams.get("cash") === "1";
  const cashOrderNumber = searchParams.get("order_number");
  const cashTotal = searchParams.get("total");

  const [orderNumber, setOrderNumber] = useState(cashOrderNumber ?? "");
  const [total, setTotal] = useState(cashTotal ? Number(cashTotal) : 0);
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [error, setError] = useState("");

  useEffect(() => {
    clearCart();
  }, []);

  useEffect(() => {
    if (cashOrder) {
      if (cashOrderNumber && cashTotal) {
        trackPurchaseConversion({
          orderNumber: cashOrderNumber,
          value: Number(cashTotal),
        });
      }
      return;
    }

    if (!sessionId) {
      setError("Ingen betalningssession hittades.");
      setLoading(false);
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
  }, [sessionId, cashOrder, cashOrderNumber, cashTotal]);

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
