import { Suspense } from "react";
import SelfOrderClient from "@/components/order/SelfOrderClient";

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#0f0f0f] text-white/40">
          Laddar…
        </div>
      }
    >
      <SelfOrderClient />
    </Suspense>
  );
}
