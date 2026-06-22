import { Suspense } from "react";
import PlatformTenantsClient from "./PlatformTenantsClient";

export default function PlatformTenantsPage() {
  return (
    <Suspense fallback={<p className="px-5 py-12 text-center text-white/50">Laddar…</p>}>
      <PlatformTenantsClient />
    </Suspense>
  );
}
