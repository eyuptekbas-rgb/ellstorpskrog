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
  const swishPaymentId = searchParams.get("swish_payment_id");
  const swishStatusToken = searchParams.get("token");

  const [orderNumber, setOrderNumber] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(Boolean(sessionId || cashOrderId || swishPaymentId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (swishPaymentId) return;
    clearCart();
    clearOrderNote();
  }, [swishPaymentId]);

  useEffect(() => {
    if (swishPaymentId) {
      let stopped = false;
      let timer: ReturnType<typeof setTimeout>;
      const deadline = Date.now() + 180000;
      const poll = async () => {
        try {
          const res = await fetch(`/api/checkout/swish?paymentId=${encodeURIComponent(swishPaymentId)}&token=${encodeURIComponent(swishStatusToken || "")}`, { cache: "no-store" });
          const data = res.ok ? await res.json() : null;
          if (stopped) return;
          if (data?.status === "PAID") {
            setOrderNumber(data.orderNumber);
            setTotal(data.total);
            clearCart();
            clearOrderNote();
            setLoading(false);
            trackPurchaseConversion({ orderNumber: data.orderNumber, value: data.total });
            return;
          }
          if (["FAILED", "CANCELLED", "REFUNDED"].includes(data?.status)) {
            setError("Swish-betalningen avbröts eller kunde inte genomföras.");
            setLoading(false);
            return;
          }
        } catch { /* Keep waiting; a transient network failure is not a failed payment. */ }
        if (stopped) return;
        if (Date.now() >= deadline) {
          setError("Betalningen är ännu inte bekräftad. Ladda om sidan för att kontrollera igen innan du beställer på nytt.");
          setLoading(false);
          return;
        }
        timer = setTimeout(poll, 5000);
      };
      void poll();
      return () => { stopped = true; clearTimeout(timer); };
    }
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
  }, [sessionId, cashOrder, cashOrderId, swishPaymentId, swishStatusToken]);

  return (
    <SuccessView
      loading={loading}
      error={error}
      orderNumber={orderNumber}
      total={total}
      cashOrder={cashOrder}
      loadingLabel={swishPaymentId ? "Öppna Swish på ditt mobilnummer och godkänn betalningen…" : undefined}
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
