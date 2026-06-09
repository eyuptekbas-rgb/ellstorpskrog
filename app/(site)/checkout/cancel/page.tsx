"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CancelView from "@/components/checkout/CancelView";
import LoadingSpinner from "@/components/checkout/LoadingSpinner";

function CancelContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return <CancelView orderId={orderId} />;
}

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-4 pt-10 pb-28">
      <div className="mx-auto max-w-lg text-center">
        <Suspense fallback={<LoadingSpinner label="Laddar…" size="lg" />}>
          <CancelContent />
        </Suspense>
      </div>
    </div>
  );
}
