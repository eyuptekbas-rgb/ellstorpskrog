import { Suspense } from "react";
import KitchenProductionDisplay from "@/components/kitchen/KitchenProductionDisplay";

export default function KitchenPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-[#070707] text-white/40">
          Laddar…
        </div>
      }
    >
      <KitchenProductionDisplay />
    </Suspense>
  );
}
